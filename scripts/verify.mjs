/**
 * scripts/verify.mjs — 포트폴리오 자동 검증 스크립트 (외부 패키지 0개)
 *
 * 사용법 (프로젝트 폴더에서)
 *   node scripts/verify.mjs                                   검사만 실행
 *   node scripts/verify.mjs --screenshots                     + 브레이크포인트·에러 상태 스크린샷 저장
 *   node scripts/verify.mjs --report docs/VERIFY_REPORT.md    + 결과를 마크다운 보고서로 저장
 *
 * 동작 방식
 *   1) node:http로 프로젝트 폴더를 서빙하는 작은 정적 서버를 띄운다.
 *   2) 로컬 Chrome을 헤드리스로 실행하고, Node 내장 WebSocket으로 Chrome DevTools Protocol(CDP)에 접속한다.
 *   3) CDP의 Fetch 기능으로 페이지의 모든 요청을 가로챈다.
 *      api.github.com → 이 파일 안의 합성(가짜) 저장소 데이터, formspree.io → 가짜 성공/실패 응답.
 *      → 실제 GitHub API나 Formspree(실제 메일 발송)로는 요청이 절대 나가지 않는다.
 *   4) A 정적 검사 → B 반응형 레이아웃 → C 상태 흐름 → D 접근성 순서로 검사하고 PASS/FAIL을 출력한다.
 *      하나라도 FAIL이면 종료 코드 1 → GitHub Actions(CI)에서 빨간 X로 표시된다.
 *
 * Chrome 위치는 환경 변수 CHROME_PATH로 지정할 수 있다. (없으면 OS별 기본 설치 경로를 찾는다)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ===================== 0. 설정과 테스트 데이터 ===================== */

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url))); // 프로젝트 폴더
const args = process.argv.slice(2);
const TAKE_SCREENSHOTS = args.includes('--screenshots');
const REPORT_PATH = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;
const SHOT_DIR = path.join(ROOT, 'images', 'screenshots');

// 검사할 화면 크기와 기대하는 열 개수 (프로젝트 카드 / 스킬 카드)
const VIEWPORTS = [
  { width: 375, height: 812, projectColumns: 1, skillColumns: 1 },
  { width: 768, height: 1024, projectColumns: 2, skillColumns: 2 },
  { width: 1024, height: 768, projectColumns: 3, skillColumns: 4 },
  { width: 1440, height: 900, projectColumns: 3, skillColumns: 4 },
];

// GitHub API 대신 돌려줄 합성 저장소 9개 (포크 1개 → 화면에는 8개가 나와야 한다)
const XSS_PAYLOAD = '<img src=x onerror=alert(1)>';
const repo = (name, language, extra = {}) => ({
  name,
  language,
  description: `${name} 테스트 저장소입니다.`,
  html_url: `https://github.com/ADOHI/${encodeURIComponent(name)}`,
  homepage: null,
  fork: false,
  stargazers_count: 3,
  forks_count: 1,
  updated_at: '2026-09-01T09:00:00Z',
  topics: [],
  ...extra,
});
const FIXTURE_REPOS = [
  repo('Codyssey_1_1', 'JavaScript', { homepage: 'https://adohi.github.io/Codyssey_1_1/', topics: ['portfolio', 'html', 'css'] }),
  repo(XSS_PAYLOAD, 'JavaScript', { description: `${XSS_PAYLOAD}<script>alert(2)</script>` }),
  repo('forked-library', 'C#', { fork: true }), // 포크 → 숨겨져야 한다
  repo('very_long_snake_case_repository_name_for_card_overflow_testing', 'C#'),
  repo('no-language-notes', null, { description: null }),
  repo('unity-toon-shader', 'C#', { topics: ['unity', 'shader'] }),
  repo('face-tracking-game', 'Python'),
  repo('stable-diffusion-jam', 'Python'),
  repo('jam-shooter', 'C#'),
];

// 가짜 응답 설정 (검사 도중에 값을 바꿔 여러 상황을 재현한다)
const mock = { github: 'ok', formspreeStatus: 200, githubHits: 0, formspreeHits: 0, blocked: [] };
const ALLOWED_HOSTS = ['127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com']; // 그대로 통과시키는 주소

const results = [];     // { group, label, ok, detail }
const screenshots = []; // 저장한 파일 이름
const dialogs = [];     // alert 등이 뜨면 기록 (XSS가 실행됐다는 뜻)
let cdp;                // Chrome과 대화하는 통로
let baseUrl;            // 로컬 서버 주소
let chromeVersion = '';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/* ===================== 1. 검사 결과 기록 ===================== */

// fn이 true를 돌려주면 PASS, 문자열(실패 이유)·false를 돌려주거나 에러가 나면 FAIL
async function check(group, label, fn) {
  let ok = false;
  let detail = '';
  try {
    const result = await fn();
    ok = result === true;
    if (!ok) detail = typeof result === 'string' ? result : '조건을 만족하지 않음';
  } catch (error) {
    detail = error.message.split('\n')[0];
  }
  results.push({ group, label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${group}] ${label}${ok ? '' : `  ← ${detail}`}`);
}

// 검사 묶음 하나가 중간에 에러로 멈춰도 FAIL로 기록하고 다음 묶음은 계속 실행한다
async function runGroup(group, runChecks) {
  try {
    await runChecks();
  } catch (error) {
    await check(group, `${runChecks.name} 실행이 중간에 멈춤`, () => error.message.split('\n')[0]);
  } finally {
    // 다음 묶음이 영향을 받지 않도록 화면 크기·OS 설정 흉내·가짜 응답을 기본값으로 되돌린다
    Object.assign(mock, { github: 'ok', formspreeStatus: 200 });
    await setViewport(1440, 900);
    await setMedia();
  }
}


/* ===================== 2. 정적 파일 서버 ===================== */

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function startServer() {
  const server = createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); // ?demo=... 는 버린다
    const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    // 프로젝트 폴더 밖(../)이나 없는 파일은 404
    if (!filePath.startsWith(ROOT + path.sep) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream' });
    response.end(readFileSync(filePath));
  });
  // 포트 0 → 운영체제가 비어 있는 포트를 골라 준다
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}


/* ===================== 3. Chrome 실행과 CDP 연결 ===================== */

function findChrome() {
  const { PROGRAMFILES, LOCALAPPDATA } = process.env;
  const candidates = [
    process.env.CHROME_PATH,
    PROGRAMFILES && path.join(PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    LOCALAPPDATA && path.join(LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];
  return candidates.find((candidate) => candidate && existsSync(candidate));
}

// Chrome을 띄우고, 표준 에러 출력에 찍히는 "DevTools listening on ws://..." 주소를 기다린다
function launchChrome(chromePath, profileDir) {
  const flags = [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`, // 내 평소 프로필과 섞이지 않는 임시 프로필
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--hide-scrollbars', // 스크롤바 폭 때문에 뷰포트 너비가 줄어들지 않게
    '--mute-audio',
  ];
  if (process.env.CI) flags.push('--no-sandbox'); // CI 컨테이너에서는 샌드박스를 쓸 수 없다
  const chrome = spawn(chromePath, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });

  const browserWsUrl = new Promise((resolve, reject) => {
    let log = '';
    chrome.stderr.on('data', (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    chrome.on('exit', (code) => reject(new Error(`Chrome이 바로 종료되었습니다 (code ${code})\n${log}`)));
    setTimeout(() => reject(new Error('Chrome 시작 시간 초과 (20초)')), 20000).unref();
  });
  return { chrome, browserWsUrl };
}

// CDP 메시지 형식: 보낼 때 { id, method, params } → 답장 { id, result }, 알림은 { method, params }
function connectCDP(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();   // id → 답장을 기다리는 Promise
  const listeners = {};        // 이벤트 이름 → 계속 듣는 함수들
  const waiters = {};          // 이벤트 이름 → 한 번만 기다리는 Promise

  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id !== undefined) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    (listeners[message.method] ?? []).forEach((listener) => listener(message.params));
    (waiters[message.method] ?? []).splice(0).forEach((resolve) => resolve(message.params));
  });
  ws.addEventListener('close', () => pending.forEach(({ reject }) => reject(new Error('CDP 연결이 끊겼습니다'))));

  const client = {
    send: (method, params = {}) => new Promise((resolve, reject) => {
      nextId += 1;
      pending.set(nextId, { resolve, reject });
      ws.send(JSON.stringify({ id: nextId, method, params }));
    }),
    on: (method, listener) => (listeners[method] ??= []).push(listener),
    once: (method) => new Promise((resolve) => (waiters[method] ??= []).push(resolve)),
    close: () => ws.close(),
  };
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve(client));
    ws.addEventListener('error', () => reject(new Error(`CDP 연결 실패: ${wsUrl}`)));
  });
}


/* ===================== 4. 페이지 조작 도우미 ===================== */

// 페이지 안에서 JS 식을 실행하고 결과 값을 받는다 (Promise면 끝날 때까지 기다린다)
async function evaluate(expression) {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  return result.value;
}

// 식이 참이 될 때까지 50ms마다 다시 확인한다 (시간 초과면 false)
async function waitFor(expression, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(expression)) return true;
    } catch { /* 페이지 이동 중이면 다음 확인까지 기다린다 */ }
    await sleep(50);
  }
  return false;
}

async function goto(query = '') {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: `${baseUrl}/${query}` });
  await loaded;
}

// localStorage를 비운 '첫 방문' 상태로 페이지를 연다
async function openPage(query = '') {
  await cdp.send('Storage.clearDataForOrigin', { origin: baseUrl, storageTypes: 'local_storage' });
  await goto(query);
}

async function setViewport(width, height) {
  // 768px 미만은 휴대폰처럼(meta viewport 적용) 흉내 낸다
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
}

// OS 설정 흉내: 다크 모드 / 동작 줄이기
async function setMedia({ dark = false, reducedMotion = false } = {}) {
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  });
}

// 실제 키보드 입력 (Enter는 text가 있어야 버튼이 눌린다)
const KEYS = { Enter: [13, '\r'], Escape: [27], Tab: [9] };
async function press(key) {
  const [keyCode, text] = KEYS[key];
  await cdp.send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code: key, windowsVirtualKeyCode: keyCode, text });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: keyCode });
}

// 입력칸에 포커스 → 기존 글자 전체 선택 → 새 글자 입력 (input 이벤트가 실제 타이핑처럼 발생)
async function typeInto(selector, text) {
  await evaluate(`document.querySelector('${selector}').focus(); document.querySelector('${selector}').select()`);
  await cdp.send('Input.insertText', { text });
}

// 스크롤 후 scroll 이벤트를 보내고 한 프레임 기다린다
const scrollToY = (y) => evaluate(`
  window.scrollTo({ top: ${y}, behavior: 'instant' });
  window.dispatchEvent(new Event('scroll'));
  new Promise((resolve) => requestAnimationFrame(() => resolve(true)))`);

const click = (selector) => evaluate(`document.querySelector('${selector}').click()`);
const textOf = (selector) => evaluate(`document.querySelector('${selector}').textContent`);

async function saveScreenshot(fileName) {
  // #projects로 스크롤(고정 헤더가 함께 보임) → 웹 폰트 로딩 대기 → 캡처
  await evaluate(`document.querySelector('#projects').scrollIntoView({ behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    document.fonts.ready.then(() => new Promise((resolve) => requestAnimationFrame(() => resolve(true))))`);
  await sleep(150);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  mkdirSync(SHOT_DIR, { recursive: true });
  writeFileSync(path.join(SHOT_DIR, fileName), Buffer.from(data, 'base64'));
  screenshots.push(fileName);
}

const CARDS_READY = `document.querySelectorAll('.project-card').length > 0`;
const STATUS_TEXT = `document.querySelector('.project-status').textContent`;


/* ===================== 5. 네트워크 가로채기 (가짜 응답) ===================== */

function fulfill(requestId, status, body, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*', // 다른 출처(127.0.0.1 → api.github.com) 요청이라 CORS 허용 헤더가 필요
    'Access-Control-Expose-Headers': 'x-ratelimit-remaining, x-ratelimit-reset',
    ...extraHeaders,
  };
  return cdp.send('Fetch.fulfillRequest', {
    requestId,
    responseCode: status,
    responseHeaders: Object.entries(headers).map(([name, value]) => ({ name, value })),
    body: Buffer.from(body).toString('base64'),
  });
}

async function handleRequest({ requestId, request }) {
  try {
    const { hostname } = new URL(request.url); // 주소를 못 읽으면 catch로 → 요청은 멈춘 채로 남고 밖으로 나가지 않는다
    if (ALLOWED_HOSTS.includes(hostname)) {
      await cdp.send('Fetch.continueRequest', { requestId });
    } else if (hostname === 'api.github.com') {
      mock.githubHits += 1;
      if (mock.github === 'network') {
        await cdp.send('Fetch.failRequest', { requestId, errorReason: 'InternetDisconnected' });
      } else if (mock.github === 'ratelimit') {
        const resetAt = String(Math.floor(Date.now() / 1000) + 30 * 60); // 30분 뒤 초기화
        await fulfill(requestId, 403, '{"message":"API rate limit exceeded"}', { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetAt });
      } else {
        await fulfill(requestId, 200, JSON.stringify(FIXTURE_REPOS));
      }
    } else if (hostname === 'formspree.io') {
      mock.formspreeHits += 1;
      await fulfill(requestId, mock.formspreeStatus, mock.formspreeStatus === 200 ? '{"ok":true}' : '{"error":"mock"}');
    } else {
      mock.blocked.push(request.url); // 목록에 없는 외부 요청은 막고 기록한다
      await cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    }
  } catch { /* 페이지 이동으로 이미 취소된 요청이면 무시 */ }
}


/* ===================== A. 정적 검사 (파일 내용 읽기) ===================== */

async function runStaticChecks() {
  const read = (file) => readFileSync(path.join(ROOT, file), 'utf8');
  const html = read('index.html');
  const css = ['css/style.css', 'css/noscript.css'].map(read).join('\n');
  // index.html의 <script src> 순서 = 브라우저가 실행하는 순서
  const jsFiles = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  const js = Object.fromEntries(jsFiles.map((file) => [file, read(file)]));
  const jsFilesMatching = (pattern) => jsFiles.filter((file) => pattern.test(js[file]));

  await check('A', 'JS: var 없이 const/let만 사용', () => {
    const found = jsFilesMatching(/\bvar\s/);
    return found.length === 0 || `var 발견: ${found.join(', ')}`;
  });
  await check('A', '인라인 이벤트 없음 (HTML on*= 속성 · JS 템플릿 on*= · el.onclick =)', () => {
    const inHtml = /<[^>]+\son[a-z]+\s*=/i.test(html);
    const found = jsFilesMatching(/\son[a-z]+\s*=\s*["'`$]|\.on[a-z]+\s*=[^=]/);
    return (!inHtml && found.length === 0) || `HTML: ${inHtml ? '있음' : '없음'}, JS: ${found.join(', ') || '없음'}`;
  });
  await check('A', 'style= 속성과 element.style 사용 없음 (스타일은 CSS 파일에서만)', () => {
    const inHtml = /\sstyle\s*=/i.test(html);
    const found = jsFilesMatching(/\sstyle\s*=|\.style\b/);
    return (!inHtml && found.length === 0) || `HTML: ${inHtml ? '있음' : '없음'}, JS: ${found.join(', ') || '없음'}`;
  });
  await check('A', `모든 <script>에 defer (${jsFiles.length}개)`, () => {
    const tags = html.match(/<script\b[^>]*>/g) ?? [];
    const missing = tags.filter((tag) => !/\sdefer\b/.test(tag));
    return (tags.length > 0 && missing.length === 0) || `defer 없음: ${missing.join(' ')}`;
  });
  await check('A', '모든 <label for>가 실제 id와 연결됨', () => {
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
    const fors = [...html.matchAll(/<label\b[^>]*\sfor="([^"]+)"/g)].map((match) => match[1]);
    const broken = fors.filter((id) => !ids.has(id));
    return (fors.length > 0 && broken.length === 0) || `연결 안 됨: ${broken.join(', ')}`;
  });
  await check('A', '모든 <img>에 비어 있지 않은 alt', () => {
    const images = [html, ...Object.values(js)].flatMap((source) => source.match(/<img\b[^>]*>/g) ?? []);
    const missing = images.filter((tag) => !/\salt="[^"]+"/.test(tag));
    return missing.length === 0 || `alt 없음: ${missing.join(' ')}`;
  });
  await check('A', '시맨틱 랜드마크 header·nav·main·section·article·footer 사용', () => {
    const missing = ['header', 'nav', 'main', 'section', 'article', 'footer'].filter((tag) => !new RegExp(`<${tag}\\b`).test(html));
    return missing.length === 0 || `없음: ${missing.join(', ')}`;
  });
  await check('A', 'CSS: :root 디자인 토큰 + [data-theme="dark"] 재정의 블록', () =>
    (/:root\s*\{/.test(css) && /\[data-theme="dark"\]\s*\{/.test(css)) || ':root 또는 [data-theme="dark"] 블록 없음');
  await check('A', '너비 미디어 쿼리는 min-width 768px · 1024px 두 개뿐 (모바일 퍼스트)', () => {
    const allowed = ['(min-width:768px)', '(min-width:1024px)'];
    const widthQueries = [...css.matchAll(/@media([^{]+)\{/g)]
      .map((match) => match[1].replace(/\s+/g, ''))
      .filter((query) => query.includes('width'));
    const bad = widthQueries.filter((query) => !allowed.includes(query));
    return (bad.length === 0 && allowed.every((query) => widthQueries.includes(query))) || `허용 외 쿼리: ${bad.join(', ') || '없음'}`;
  });
  await check('A', `JS ${jsFiles.length}개를 이어 붙여도 전역 const/let 이름 중복 없음`, () => {
    // 일반 <script>들은 전역 스코프를 공유한다 → 이어 붙여 '파싱만' 해 보면 중복 선언이 SyntaxError로 드러난다 (실행은 안 함)
    new Function(jsFiles.map((file) => js[file]).join('\n;\n'));
    return true;
  });
}


/* ===================== B. 반응형 레이아웃 ===================== */

async function runLayoutChecks() {
  await setMedia({ reducedMotion: true }); // 애니메이션을 멈춰 스크린샷이 항상 같은 모습이 되게
  for (const { width, height, projectColumns, skillColumns } of VIEWPORTS) {
    await setViewport(width, height);
    await openPage();
    await waitFor(CARDS_READY);
    const layout = await evaluate(`(() => {
      const isShown = (el) => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility === 'visible' && el.getBoundingClientRect().width > 0;
      };
      // grid-template-columns 계산값 예: "334px 334px" → 0보다 큰 트랙 개수 = 열 개수
      const countColumns = (el) => getComputedStyle(el).gridTemplateColumns.split(' ').filter((track) => parseFloat(track) > 0).length;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        hamburger: isShown(document.querySelector('.nav-toggle')),
        navLinks: [...document.querySelectorAll('.nav__link')].every(isShown),
        projectColumns: countColumns(document.querySelector('.project-grid')),
        skillColumns: countColumns(document.querySelector('.skills__grid')),
      };
    })()`);
    const isMobile = width < 768;

    await check('B', `${width}px: 가로 스크롤(넘침) 없음`, () =>
      layout.scrollWidth <= width || `문서 너비 ${layout.scrollWidth}px > ${width}px`);
    await check('B', `${width}px: 햄버거 버튼 ${isMobile ? '보임' : '숨김'} / 메뉴 링크 ${isMobile ? '숨김(닫힘)' : '보임'}`, () =>
      (layout.hamburger === isMobile && layout.navLinks === !isMobile) || `햄버거 보임=${layout.hamburger}, 링크 보임=${layout.navLinks}`);
    await check('B', `${width}px: 프로젝트 카드 ${projectColumns}열`, () =>
      layout.projectColumns === projectColumns || `${layout.projectColumns}열`);
    await check('B', `${width}px: 스킬 카드 ${skillColumns}열`, () =>
      layout.skillColumns === skillColumns || `${layout.skillColumns}열`);

    if (TAKE_SCREENSHOTS) await saveScreenshot(`bp-${width}.png`);
  }
}


/* ===================== C. 상태 흐름 (이벤트 → 상태 → 렌더) ===================== */

async function runThemeChecks() {
  const themeState = `[document.documentElement.dataset.theme,
    document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
    localStorage.getItem('theme')].join('|')`; // 예: "dark|true|dark"
  await setViewport(1440, 900);
  await openPage();
  await check('C', '테마: 첫 방문(저장값 없음 · OS 라이트) → light로 시작', async () =>
    (await evaluate(themeState)) === 'light|false|' || evaluate(themeState));

  await click('.theme-toggle');
  await check('C', '테마: 토글 클릭 → data-theme="dark" · aria-pressed="true" · localStorage 저장', async () =>
    (await waitFor(`${themeState} === 'dark|true|dark'`)) || evaluate(themeState));

  await goto(); // 저장소를 비우지 않고 새로고침
  await check('C', '테마: 새로고침해도 dark 유지', async () =>
    (await evaluate(themeState)) === 'dark|true|dark' || evaluate(themeState));

  await openPage();
  await evaluate(`Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); }`); // 저장 차단 흉내
  await click('.theme-toggle');
  await check('C', '테마: localStorage 저장이 막혀도 테마는 바뀌고, 버튼 title로 "이번 방문에만 적용" 안내', () =>
    waitFor(`document.documentElement.dataset.theme === 'dark' && document.querySelector('.theme-toggle').title.includes('이번 방문에만')`));

  await setMedia({ dark: true });
  await openPage();
  await check('C', '테마: 저장값 없음 + OS 다크(prefers-color-scheme) → dark로 시작', async () =>
    (await evaluate(themeState)) === 'dark|true|' || evaluate(themeState));
}

async function runScrollChecks() {
  await openPage();
  const scrollState = `[document.querySelector('.header').classList.contains('scrolled'),
    document.querySelector('.scroll-top').classList.contains('visible')].join('|')`;
  const expectAt = async (y, expected, label) => {
    await scrollToY(y);
    await check('C', label, async () => (await evaluate(scrollState)) === expected || `scrolled|visible = ${await evaluate(scrollState)}`);
  };
  await expectAt(59, 'false|false', '스크롤 59px: 헤더 .scrolled 없음');
  await expectAt(60, 'true|false', '스크롤 60px: 헤더 .scrolled 붙음');
  await expectAt(299, 'true|false', '스크롤 299px: 맨 위로 버튼 .visible 없음');
  await expectAt(300, 'true|true', '스크롤 300px: 맨 위로 버튼 .visible 붙음');

  // 끝까지 조금씩 내려가며 IntersectionObserver가 모든 .reveal을 한 번씩 보게 한다
  await scrollToY(0);
  const pageHeight = await evaluate('document.documentElement.scrollHeight');
  for (let y = 0; y <= pageHeight + 300; y += 300) {
    await scrollToY(y);
    await sleep(30);
  }
  await check('C', '스크롤 애니메이션: 끝까지 스크롤하면 모든 .reveal에 .revealed', async () =>
    (await waitFor(`[...document.querySelectorAll('.reveal')].every((el) => el.classList.contains('revealed'))`)) ||
    `남은 요소 ${await evaluate(`document.querySelectorAll('.reveal:not(.revealed)').length`)}개`);
}

async function runMenuChecks() {
  await setViewport(375, 812);
  await openPage();
  const menuState = `[document.querySelector('.nav__menu').classList.contains('active'),
    document.querySelector('.nav-toggle').getAttribute('aria-expanded'),
    document.querySelector('.nav-toggle').getAttribute('aria-label')].join('|')`;

  await evaluate(`document.querySelector('.nav-toggle').focus()`);
  await press('Enter');
  await check('C', '햄버거(키보드 Enter): 메뉴 열림 · aria-expanded="true" · 라벨 "메뉴 닫기" · 첫 링크로 포커스', async () =>
    ((await evaluate(menuState)) === 'true|true|메뉴 닫기' && evaluate(`document.activeElement === document.querySelector('.nav__link')`)) ||
    evaluate(menuState));
  await press('Tab');
  await check('C', '햄버거: 열린 메뉴에서 Tab → 두 번째 링크로 이동', () =>
    evaluate(`document.activeElement === document.querySelectorAll('.nav__link')[1]`));
  await press('Escape');
  await check('C', '햄버거: Esc → 닫힘 · aria-expanded="false" · 라벨 "메뉴 열기" · 포커스가 햄버거 버튼으로 복귀', async () =>
    ((await evaluate(menuState)) === 'false|false|메뉴 열기' && evaluate(`document.activeElement === document.querySelector('.nav-toggle')`)) ||
    evaluate(menuState));
}

async function runProjectChecks() {
  const cardState = `[document.querySelectorAll('.project-card').length, document.querySelector('.project-count').textContent,
    document.querySelector('.project-more').hidden].join('|')`; // 예: "6|8개 중 6개 표시|false"
  await openPage();
  await waitFor(CARDS_READY);
  await check('C', '프로젝트: 합성 데이터 9개 중 포크 제외 8개 → 카드 6개 + 더 보기 버튼', async () =>
    (await evaluate(cardState)) === '6|8개 중 6개 표시|false' || evaluate(cardState));
  await check('C', '프로젝트: 이름·설명의 XSS 페이로드가 글자로 표시되고 <img>/<script> 요소가 생기지 않음', async () =>
    ((await evaluate(`document.querySelectorAll('.project-grid img, .project-grid script').length === 0 &&
      document.querySelector('.project-grid').textContent.includes(${JSON.stringify(XSS_PAYLOAD)})`)) && dialogs.length === 0) ||
    `alert 발생 ${dialogs.length}회`);
  await check('C', '프로젝트: homepage(http/https)가 있는 저장소에만 Demo 링크', async () =>
    (await evaluate(`document.querySelectorAll('.project-card__demo').length`)) === 1 || '개수 불일치');

  await click('.filter-btn[data-filter="C#"]');
  await check('C', '프로젝트: C# 필터 클릭 → 3개로 줄고 aria-pressed="true"', async () =>
    ((await evaluate(cardState)) === '3|3개 중 3개 표시|true' &&
      evaluate(`document.querySelector('.filter-btn[data-filter="C#"]').getAttribute('aria-pressed') === 'true'`)) || evaluate(cardState));
  await click('.filter-btn[data-filter="all"]');
  await click('.project-more');
  await check('C', '프로젝트: 전체 → 더 보기 클릭 → 8개 모두 표시, 버튼 숨김, 포크 저장소 없음', async () =>
    ((await evaluate(cardState)) === '8|8개 중 8개 표시|true' && !(await textOf('.project-grid')).includes('forked-library')) ||
    evaluate(cardState));

  await openPage('?demo=loading');
  await check('C', '?demo=loading → "프로젝트를 불러오는 중..." + aria-busy="true"', () =>
    waitFor(`${STATUS_TEXT}.includes('프로젝트를 불러오는 중...') && document.querySelector('.project-grid').getAttribute('aria-busy') === 'true'`));
  await openPage('?demo=error');
  await check('C', '?demo=error → 에러 제목 + "다시 시도" · "GitHub에서 보기" 버튼', () =>
    waitFor(`${STATUS_TEXT}.includes('프로젝트를 불러올 수 없습니다.') && !!document.querySelector('.retry-btn') && ${STATUS_TEXT}.includes('GitHub에서 보기')`));
  await check('C', '?demo=error → "다시 시도" 클릭 즉시 로딩 상태로 재진입', () =>
    evaluate(`document.querySelector('.retry-btn').click(); ${STATUS_TEXT}.includes('프로젝트를 불러오는 중...')`));
  await openPage('?demo=empty');
  await check('C', '?demo=empty → "표시할 프로젝트가 없습니다."', () => waitFor(`${STATUS_TEXT}.includes('표시할 프로젝트가 없습니다.')`));

  // 실제 네트워크 실패·레이트 리밋 재현 (demo 모드가 아닌 진짜 fetch 경로)
  await setMedia({ reducedMotion: true }); // 스크린샷용으로 애니메이션 정지
  mock.github = 'network';
  await openPage();
  await check('C', 'API: 네트워크 끊김(Fetch.failRequest) → "네트워크에 연결할 수 없습니다…" 안내', () =>
    waitFor(`${STATUS_TEXT}.includes('네트워크에 연결할 수 없습니다') && !!document.querySelector('.retry-btn')`));
  if (TAKE_SCREENSHOTS) await saveScreenshot('state-network-error.png');
  mock.github = 'ok';
  await click('.retry-btn');
  await check('C', 'API: 네트워크 복구 후 "다시 시도" → 카드 목록 표시', () => waitFor(CARDS_READY));

  mock.github = 'ratelimit';
  await openPage();
  await check('C', 'API: 403 + x-ratelimit-remaining: 0 → 요청 한도 초과 + "HH:MM 이후에 다시 시도" 안내', () =>
    waitFor(`${STATUS_TEXT}.includes('요청 한도(시간당 60회)를 초과했습니다') && /\\d{1,2}:\\d{2} 이후에 다시 시도/.test(${STATUS_TEXT})`));
  if (TAKE_SCREENSHOTS) await saveScreenshot('state-rate-limit.png');
}

async function runFormChecks() {
  const hasError = (field) => `document.querySelector('#contact-${field}-error').textContent !== ''`;
  const formStatus = `document.querySelector('.form-status').textContent`;
  await openPage();

  await click('.contact-form__submit');
  await check('C', '폼: 빈 채로 제출 → 에러 3개 표시 + 첫 칸(#contact-name)으로 포커스', async () =>
    (await evaluate(`${hasError('name')} && ${hasError('email')} && ${hasError('message')} && document.activeElement.id === 'contact-name'`)) ||
    `포커스: ${await evaluate('document.activeElement.id')}`);

  await openPage();
  await typeInto('#contact-email', 'abc@');
  await check('C', '폼: 입력 중(칸을 벗어나기 전)에는 에러를 보여 주지 않음', async () => !(await evaluate(hasError('email'))));
  await evaluate(`document.querySelector('#contact-name').focus()`); // 이메일 칸 focusout
  await check('C', "폼: 'abc@' 입력 후 focusout → 이메일 형식 에러 + aria-invalid=\"true\"", () =>
    evaluate(`document.querySelector('#contact-email-error').textContent.includes('올바른 이메일 형식이 아닙니다') &&
      document.querySelector('#contact-email').getAttribute('aria-invalid') === 'true'`));
  await typeInto('#contact-email', 'tester@example.com');
  await check('C', '폼: 올바르게 고치면 입력 즉시 에러가 사라짐', () =>
    evaluate(`!(${hasError('email')}) && document.querySelector('#contact-email').getAttribute('aria-invalid') === 'false'`));

  const fillValidForm = async () => {
    await typeInto('#contact-name', '홍길동');
    await typeInto('#contact-email', 'tester@example.com');
    await typeInto('#contact-message', '안녕하세요! 자동 검증 스크립트가 보낸 테스트 메시지입니다.');
  };
  await fillValidForm();
  mock.formspreeStatus = 200;
  const hitsBefore = mock.formspreeHits;
  await click('.contact-form__submit');
  await check('C', '폼: 올바른 값 제출(Formspree 200 모의) → 성공 문구 + 입력칸 초기화', async () =>
    ((await waitFor(`${formStatus} === '메시지가 전송되었습니다. 확인 후 답장드릴게요. 감사합니다!'`)) &&
      (await evaluate(`['name', 'email', 'message'].every((field) => document.querySelector('.contact-form').elements[field].value === '')`)) &&
      mock.formspreeHits === hitsBefore + 1) || `상태: ${await evaluate(formStatus)}`);

  await fillValidForm();
  mock.formspreeStatus = 500;
  await click('.contact-form__submit');
  await check('C', '폼: Formspree 500 모의 → 실패 문구', () =>
    waitFor(`${formStatus} === '전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락해 주세요.'`));
}


/* ===================== D. 접근성 기본 ===================== */

// WCAG 상대 휘도·명암비 공식
function luminance(hex) {
  const digits = hex.slice(1).length === 3 ? [...hex.slice(1)].map((char) => char + char).join('') : hex.slice(1);
  const [r, g, b] = [0, 2, 4]
    .map((index) => parseInt(digits.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(colorA, colorB) {
  const [light, dark] = [luminance(colorA), luminance(colorB)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const CONTRAST_PAIRS = [
  ['본문 글자 / 배경', '--color-text', '--color-bg'],
  ['보조 글자 / 배경', '--color-text-muted', '--color-bg'],
  ['강조색 글자 / 배경', '--color-primary', '--color-bg'],
  ['강조 버튼 글자 / 강조색', '--color-on-primary', '--color-primary'],
  ['에러 글자 / 배경', '--color-error', '--color-bg'],
];

async function runA11yChecks() {
  await setViewport(1440, 900);
  await openPage();
  await waitFor(CARDS_READY);

  await check('D', '제목 구조: h1 정확히 1개, 단계 건너뛰기 없음 (h1→h2→h3)', () => evaluate(`(() => {
    const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) => Number(heading.tagName[1]));
    const skipped = levels.some((level, index) => index > 0 && level > levels[index - 1] + 1);
    return (levels.filter((level) => level === 1).length === 1 && levels[0] === 1 && !skipped) || '순서: ' + levels.join('→');
  })()`));

  await scrollToY(400); // 맨 위로 버튼도 보이게 한 뒤 검사
  await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree'); // 브라우저가 실제로 계산한 접근성 트리
  const controls = nodes.filter((node) => !node.ignored && ['button', 'link'].includes(node.role?.value));
  const unnamed = controls.filter((node) => !String(node.name?.value ?? '').trim());
  await check('D', `모든 버튼·링크에 접근 가능한 이름 (텍스트 · aria-label · sr-only, ${controls.length}개)`, () =>
    (controls.length > 0 && unnamed.length === 0) || `이름 없음 ${unnamed.length}개`);

  await check('D', '폼 입력칸마다 연결된 <label>', () =>
    evaluate(`[...document.querySelectorAll('input, textarea, select')].every((field) => field.labels.length > 0)`));
  await check('D', '메뉴 토글: aria-label · aria-expanded · aria-controls(→ 실제 #nav-menu)', () => evaluate(`(() => {
    const toggle = document.querySelector('.nav-toggle');
    return !!toggle.getAttribute('aria-label') && ['true', 'false'].includes(toggle.getAttribute('aria-expanded')) &&
      !!document.getElementById(toggle.getAttribute('aria-controls'));
  })()`));

  await openPage();
  await press('Tab');
  await check('D', '스킵 링크: 첫 Tab에 포커스 + 화면에 나타남, href="#main" → main#main 존재', async () =>
    (await evaluate(`document.activeElement.classList.contains('skip-link') &&
      document.activeElement.getAttribute('href') === '#main' && !!document.querySelector('main#main')`)) &&
    waitFor(`document.querySelector('.skip-link').getBoundingClientRect().top >= 0`));
  await press('Enter');
  await check('D', '스킵 링크: Enter → 키보드 포커스가 main으로 이동', () => waitFor(`document.activeElement.id === 'main'`));

  for (const theme of ['light', 'dark']) {
    const colors = await evaluate(`(() => {
      document.documentElement.dataset.theme = '${theme}';
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(${JSON.stringify(CONTRAST_PAIRS.flatMap(([, fg, bg]) => [fg, bg]))}
        .map((name) => [name, style.getPropertyValue(name).trim()]));
    })()`);
    for (const [name, fg, bg] of CONTRAST_PAIRS) {
      const ratio = contrastRatio(colors[fg], colors[bg]);
      await check('D', `명암비 ${theme} · ${name} (${colors[fg]} / ${colors[bg]}) = ${ratio.toFixed(2)}:1 ≥ 4.5`, () =>
        (/^#[0-9a-f]{3,6}$/i.test(colors[fg]) && /^#[0-9a-f]{3,6}$/i.test(colors[bg]) && ratio >= 4.5) || '기준 미달 또는 hex가 아닌 색');
    }
  }
}


/* ===================== 6. 보고서 · 실행 ===================== */

const GROUP_NAMES = { A: 'A 정적', B: 'B 레이아웃', C: 'C 상태 흐름', D: 'D 접근성' };

function writeReport(reportPath, seconds) {
  const passed = results.filter((result) => result.ok).length;
  const cell = (text) => String(text).replace(/[|*]/g, '\\$&').replace(/</g, '&lt;'); // 표 깨짐·강조·HTML 해석 방지
  const lines = [
    '# 자동 검증 보고서',
    '',
    '> `node scripts/verify.mjs` 가 자동으로 만든 보고서입니다. 직접 고치지 말고 스크립트를 다시 실행하세요.',
    '',
    `- 실행 시각: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    `- 브라우저: ${chromeVersion} (headless, CDP) · Node.js ${process.version}`,
    `- 뷰포트: ${VIEWPORTS.map(({ width, height }) => `${width}×${height}`).join(' · ')}`,
    `- 네트워크: api.github.com·formspree.io 요청은 모두 가로채 합성 데이터로 응답 (모의 응답 GitHub ${mock.githubHits}회 · Formspree ${mock.formspreeHits}회, 실제 요청 0건)`,
    `- 결과: **${passed} PASS / ${results.length - passed} FAIL** (총 ${results.length}개, ${seconds}초)`,
    '',
    '| # | 그룹 | 검사 항목 | 결과 | 실패 이유 |',
    '|---|---|---|---|---|',
    ...results.map(({ group, label, ok, detail }, index) =>
      `| ${index + 1} | ${GROUP_NAMES[group]} | ${cell(label)} | ${ok ? 'PASS' : '**FAIL**'} | ${cell(detail)} |`),
  ];
  if (screenshots.length > 0) {
    const toLink = (file) => path.relative(path.dirname(reportPath), path.join(SHOT_DIR, file)).split(path.sep).join('/');
    lines.push('', '## 스크린샷', '', ...screenshots.map((file) => `- [${file}](${toLink(file)})`));
  }
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

async function main() {
  const startedAt = Date.now();
  await runStaticChecks();

  const chromePath = findChrome();
  if (!chromePath) throw new Error('Chrome을 찾을 수 없습니다. 환경 변수 CHROME_PATH에 실행 파일 경로를 지정해 주세요.');
  const server = await startServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const profileDir = mkdtempSync(path.join(tmpdir(), 'verify-chrome-'));
  const { chrome, browserWsUrl } = launchChrome(chromePath, profileDir);

  try {
    const devtoolsPort = new URL(await browserWsUrl).port;
    chromeVersion = (await (await fetch(`http://127.0.0.1:${devtoolsPort}/json/version`)).json()).Browser;
    const targets = await (await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`)).json();
    cdp = await connectCDP(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    cdp.on('Fetch.requestPaused', handleRequest);
    await cdp.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] }); // 모든 요청을 가로챈다
    cdp.on('Page.javascriptDialogOpening', ({ message }) => {
      dialogs.push(message);
      cdp.send('Page.handleJavaScriptDialog', { accept: true });
    });

    await runGroup('B', runLayoutChecks);
    await runGroup('C', runThemeChecks);
    await runGroup('C', runScrollChecks);
    await runGroup('C', runMenuChecks);
    await runGroup('C', runProjectChecks);
    await runGroup('C', runFormChecks);
    await check('C', '네트워크 격리: 허용 목록(로컬·Google Fonts) 밖으로 나간 요청 없음', () =>
      (mock.githubHits > 0 && mock.blocked.length === 0) || `차단된 요청: ${mock.blocked.join(', ') || '없음'}`);
    await runGroup('D', runA11yChecks);
  } finally {
    // 실패해도 항상 Chrome과 서버를 정리한다
    cdp?.close();
    if (chrome.exitCode === null) {
      const exited = new Promise((resolve) => chrome.once('exit', resolve));
      chrome.kill();
      await exited;
    }
    server.close();
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const failed = results.filter((result) => !result.ok).length;
  console.log(`\n총 ${results.length}개 검사: ${results.length - failed} PASS / ${failed} FAIL (${seconds}초)`);
  if (TAKE_SCREENSHOTS) console.log(`스크린샷: ${screenshots.map((file) => `images/screenshots/${file}`).join(', ')}`);
  if (REPORT_PATH) {
    writeReport(path.resolve(REPORT_PATH), seconds);
    console.log(`보고서: ${REPORT_PATH}`);
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`\n검증을 끝까지 실행하지 못했습니다: ${error.stack ?? error}`);
  process.exitCode = 1;
});
