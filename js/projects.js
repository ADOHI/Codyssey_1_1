/**
 * projects.js — GitHub API로 저장소 목록을 가져와 Projects 섹션에 그린다
 *
 * [상태 → 렌더링 흐름 ②] 비동기 요청
 *   페이지 로드 / '다시 시도' click → status: 'loading' → fetch
 *     → 성공: status 'success' (+ repos)  /  실패: status 'error' (+ errorMessage)
 *     → renderProjects()가 상태에 맞는 화면(스피너 / 카드 목록 / 에러 / 빈 상태)을 그린다
 *
 * [상태 → 렌더링 흐름 ④] 필터 (보너스)
 *   언어 버튼 click → filter 상태 변경 → renderProjects()가 filter()로 걸러 다시 그린다
 *   '더 보기' click → visibleCount 상태 증가 → renderProjects()
 *
 * 상태별 화면 확인(동료평가용): 주소 뒤에 ?demo=loading | error | empty 를 붙이면 해당 상태를 강제로 볼 수 있다.
 */

const GITHUB_USERNAME = 'ADOHI';
const REPOS_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
const REQUEST_TIMEOUT = 10000; // 10초 안에 응답이 없으면 실패로 처리
const PAGE_SIZE = 6;           // 한 번에 보여 줄 카드 수
const ALL_FILTER = 'all';

const demoMode = new URLSearchParams(window.location.search).get('demo');

const projectFilters = document.querySelector('.project-filters');
const projectCount = document.querySelector('.project-count');
const projectStatus = document.querySelector('.project-status');
const projectGrid = document.querySelector('.project-grid');
const projectMoreButton = document.querySelector('.project-more');


/* ---------- 상태 ---------- */

let projectState = {
  status: 'idle',        // 'idle' | 'loading' | 'success' | 'error'
  repos: [],             // GitHub에서 받아온 저장소 (포크 제외)
  errorMessage: '',
  filter: ALL_FILTER,    // 선택된 언어
  visibleCount: PAGE_SIZE,
};

// 상태는 이 함수로만 바꾸고, 바꾼 뒤에는 항상 다시 그린다 (React의 setState → 리렌더링과 같은 흐름)
const setProjectState = (changes) => {
  projectState = { ...projectState, ...changes }; // 기존 상태를 복사한 뒤 바뀐 값만 덮어쓴다
  renderProjects();
};


/* ---------- 도우미 ---------- */

// 외부 데이터(저장소 이름·설명)를 innerHTML에 넣기 전에 특수문자를 바꿔 XSS 공격을 막는다
const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

// 사용자가 입력한 홈페이지 주소는 http(s)만 링크로 만든다 (javascript: 주소 차단)
const isSafeUrl = (url) => /^https?:\/\//i.test(url ?? '');

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

const getFilteredRepos = () => {
  const { repos, filter } = projectState;
  return filter === ALL_FILTER ? repos : repos.filter(({ language }) => language === filter);
};


/* ---------- 템플릿 (템플릿 리터럴로 HTML 문자열 생성) ---------- */

const loadingTemplate = `
  <div class="state state--loading">
    <span class="spinner" aria-hidden="true"></span>
    <p class="state__title">프로젝트를 불러오는 중...</p>
    <p class="state__desc">GitHub에서 저장소 목록을 가져오고 있습니다.</p>
  </div>`;

const createErrorTemplate = (message) => `
  <div class="state state--error">
    <svg class="state__icon" aria-hidden="true"><use href="#icon-alert"></use></svg>
    <p class="state__title">프로젝트를 불러올 수 없습니다.</p>
    <p class="state__desc">${escapeHTML(message)}</p>
    <div class="state__actions">
      <button type="button" class="btn btn--primary retry-btn">다시 시도</button>
      <a class="btn btn--outline" href="https://github.com/${GITHUB_USERNAME}?tab=repositories" target="_blank" rel="noopener noreferrer">GitHub에서 보기</a>
    </div>
  </div>`;

const emptyTemplate = `
  <div class="state state--empty">
    <svg class="state__icon" aria-hidden="true"><use href="#icon-inbox"></use></svg>
    <p class="state__title">표시할 프로젝트가 없습니다.</p>
    <p class="state__desc">아직 공개된 저장소가 없어요. 곧 새로운 프로젝트로 채워질 예정입니다!</p>
  </div>`;

// 구조분해 할당: repo 객체에서 필요한 값만 꺼내고, snake_case 이름은 camelCase로 바꿔 받는다
const createProjectCard = ({
  name,
  description,
  html_url: repoUrl,
  homepage,
  language,
  stargazers_count: stars,
  forks_count: forks,
  updated_at: updatedAt,
  topics = [],
}) => `
  <article class="project-card">
    <header class="project-card__header">
      <h3 class="project-card__title">
        <a class="project-card__link" href="${escapeHTML(repoUrl)}" target="_blank" rel="noopener noreferrer">
          ${escapeHTML(name)}<span class="sr-only"> (GitHub 저장소, 새 창)</span>
        </a>
      </h3>
      ${isSafeUrl(homepage) ? `
        <a class="project-card__demo" href="${escapeHTML(homepage)}" target="_blank" rel="noopener noreferrer">
          Demo<span class="sr-only"> 사이트 (새 창)</span>
          <svg class="icon" aria-hidden="true"><use href="#icon-external"></use></svg>
        </a>` : ''}
    </header>
    <p class="project-card__desc${description ? '' : ' project-card__desc--empty'}">
      ${description ? escapeHTML(description) : '설명이 등록되지 않은 저장소입니다.'}
    </p>
    ${topics.length > 0 ? `
      <ul class="project-card__topics" aria-label="토픽">
        ${topics.slice(0, 3).map((topic) => `<li>#${escapeHTML(topic)}</li>`).join('')}
      </ul>` : ''}
    <footer class="project-card__meta">
      ${language ? `
        <span class="project-card__lang">
          <span class="lang-dot" data-lang="${escapeHTML(language)}" aria-hidden="true"></span>${escapeHTML(language)}
        </span>` : ''}
      <span class="project-card__stat">
        <svg class="icon" aria-hidden="true"><use href="#icon-star"></use></svg>
        <span class="sr-only">스타</span>${stars}
      </span>
      <span class="project-card__stat">
        <svg class="icon" aria-hidden="true"><use href="#icon-fork"></use></svg>
        <span class="sr-only">포크</span>${forks}
      </span>
      <time class="project-card__date" datetime="${escapeHTML(updatedAt)}">${formatDate(updatedAt)}</time>
    </footer>
  </article>`;

// 언어별 저장소 개수를 세어 필터 버튼 HTML을 만든다
const createFilterButtons = (repos) => {
  // reduce: [{language:'C#'}, {language:'C#'}, ...] → { 'C#': 2, ... }
  const counts = repos.reduce((acc, { language }) => {
    if (language) acc[language] = (acc[language] ?? 0) + 1;
    return acc;
  }, {});

  const languageButtons = Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA) // 저장소가 많은 언어부터
    .map(([language, count]) => `
      <button type="button" class="filter-btn" data-filter="${escapeHTML(language)}" aria-pressed="false">
        <span class="lang-dot" data-lang="${escapeHTML(language)}" aria-hidden="true"></span>
        ${escapeHTML(language)} <span class="filter-btn__count">${count}</span>
      </button>`)
    .join('');

  return `
    <button type="button" class="filter-btn" data-filter="${ALL_FILTER}" aria-pressed="true">
      전체 <span class="filter-btn__count">${repos.length}</span>
    </button>${languageButtons}`;
};


/* ---------- 렌더: 현재 상태만 보고 화면을 그린다 ---------- */

const renderProjects = () => {
  const { status, repos, filter, visibleCount, errorMessage } = projectState;
  const filteredRepos = getFilteredRepos();
  const shownRepos = filteredRepos.slice(0, visibleCount);
  const hasList = status === 'success' && filteredRepos.length > 0;

  // 1) 상태 메시지: 로딩 / 에러 / 빈 상태 (해당 없으면 비운다)
  if (status === 'loading') projectStatus.innerHTML = loadingTemplate;
  else if (status === 'error') projectStatus.innerHTML = createErrorTemplate(errorMessage);
  else if (status === 'success' && filteredRepos.length === 0) projectStatus.innerHTML = emptyTemplate;
  else projectStatus.innerHTML = '';

  // 2) 필터 버튼: 저장소가 있을 때만 보이고, 선택된 버튼만 강조한다
  projectFilters.hidden = !(status === 'success' && repos.length > 0);
  projectFilters.querySelectorAll('.filter-btn').forEach((button) => {
    const isSelected = button.dataset.filter === filter;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });

  // 3) 카드 목록: map으로 저장소 배열 → 카드 HTML 배열 → join으로 하나의 문자열
  projectGrid.innerHTML = hasList ? shownRepos.map(createProjectCard).join('') : '';
  projectGrid.setAttribute('aria-busy', String(status === 'loading'));

  // 4) 개수 안내 + 더 보기 버튼
  projectCount.textContent = hasList ? `${filteredRepos.length}개 중 ${shownRepos.length}개 표시` : '';
  projectMoreButton.hidden = !hasList || shownRepos.length >= filteredRepos.length;
};


/* ---------- 데이터 요청 (fetch + async/await) ---------- */

// 응답을 받지 못한 경우(네트워크 끊김, 시간 초과)의 에러를 사람이 읽기 쉬운 문장으로 바꾼다
const toErrorMessage = (error) => {
  if (error.name === 'TimeoutError') return '서버 응답이 너무 늦습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  if (error instanceof TypeError) return '네트워크에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.';
  return error.message;
};

const fetchRepos = async () => {
  // 동료평가용 데모 모드: 실제 요청 없이 원하는 상태를 재현한다
  if (demoMode === 'loading') return new Promise(() => {}); // 끝나지 않는 요청 → 로딩 상태 유지
  if (demoMode === 'error') {
    await sleep(800);
    throw new Error('데모 모드: 에러 상태를 확인하기 위해 일부러 실패시켰습니다.');
  }
  if (demoMode === 'empty') {
    await sleep(800);
    return [];
  }

  const response = await fetch(REPOS_API_URL, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  // fetch는 404·403 같은 HTTP 에러에서도 reject되지 않으므로 response.ok를 직접 확인해야 한다
  if (!response.ok) {
    // 403/429: 인증 없이 호출하면 IP당 시간당 60회로 제한된다 (레이트 리밋)
    if (response.status === 403 || response.status === 429) {
      const isRateLimited = response.headers.get('x-ratelimit-remaining') === '0';
      if (isRateLimited) {
        const resetSeconds = Number(response.headers.get('x-ratelimit-reset'));
        const resetTime = new Date(resetSeconds * 1000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        throw new Error(`GitHub API 요청 한도(시간당 60회)를 초과했습니다. ${resetTime} 이후에 다시 시도해 주세요.`);
      }
      throw new Error(`GitHub API 요청이 거부되었습니다. (HTTP ${response.status}) 잠시 후 다시 시도해 주세요.`);
    }
    if (response.status === 404) throw new Error(`GitHub 사용자 '${GITHUB_USERNAME}'를 찾을 수 없습니다.`);
    throw new Error(`GitHub 서버에서 오류가 발생했습니다. (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('GitHub에서 예상하지 못한 형식의 응답을 받았습니다.');
  return data;
};

const loadRepos = async () => {
  setProjectState({ status: 'loading', errorMessage: '' });

  try {
    const data = await fetchRepos();
    const repos = data.filter(({ fork }) => !fork); // 포크한 저장소는 빼고 직접 만든 것만

    // 필터 버튼은 데이터가 바뀔 때만 새로 만든다 (매 렌더마다 만들면 누른 버튼의 키보드 포커스가 사라짐)
    projectFilters.innerHTML = createFilterButtons(repos);
    setProjectState({ status: 'success', repos, filter: ALL_FILTER, visibleCount: PAGE_SIZE });
  } catch (error) {
    console.error('[Projects] 저장소를 불러오지 못했습니다.', error);
    setProjectState({ status: 'error', errorMessage: toErrorMessage(error) });
  }
};


/* ---------- 이벤트 (이벤트 위임) ---------- */

// 버튼들은 JS가 나중에 만들어 넣으므로, 항상 존재하는 부모 요소에 리스너를 한 번만 단다
projectFilters.addEventListener('click', (event) => {
  const button = event.target.closest('.filter-btn');
  if (!button) return;
  setProjectState({ filter: button.dataset.filter, visibleCount: PAGE_SIZE });
});

projectStatus.addEventListener('click', async (event) => {
  if (!event.target.closest('.retry-btn')) return;
  await loadRepos();
  // 누른 버튼이 다시 그려지며 사라졌으므로, 결과 화면의 첫 버튼으로 포커스를 돌려준다 (키보드 사용자 배려)
  if (document.activeElement === document.body) {
    (projectStatus.querySelector('.retry-btn') ?? projectFilters.querySelector('.filter-btn'))?.focus();
  }
});

projectMoreButton.addEventListener('click', () => {
  const previousCount = projectState.visibleCount;
  setProjectState({ visibleCount: previousCount + PAGE_SIZE });
  // 마지막 페이지라 버튼이 사라졌다면, 포커스를 새로 추가된 첫 카드로 옮겨 키보드 위치를 잃지 않게 한다
  if (projectMoreButton.hidden) projectGrid.querySelectorAll('.project-card__link')[previousCount]?.focus();
});

loadRepos();
