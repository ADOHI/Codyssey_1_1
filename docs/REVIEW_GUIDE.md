# 동료평가 항목별 답변 가이드

실제 평가표의 **항목 1~5**에 맞춰 정리한 시연 순서와 답변입니다.

- **항목 1**은 **시연**입니다. 배포 사이트를 열고 아래 순서대로 보여 주면 됩니다.
- **항목 2~4**는 **설명**입니다. `결론 → 이유 → 코드 위치 보여 주기` 순서로 답합니다. 인용 블록(`>`)이 그대로 말하면 되는 30초 답변입니다.
- **항목 5**는 **보너스 4개 시연**입니다.

더 많은 예상 질문은 [QNA.md](QNA.md), 개념 복습은 [CONCEPTS.md](CONCEPTS.md)에 있습니다.

## 목차

- [평가 전 준비](#평가-전-준비)
- [항목 1. 기능 시연](#항목-1-기능-시연)
- [항목 2. 파일 분리 · 시맨틱 태그 · CSS 변수 · addEventListener](#항목-2-파일-분리--시맨틱-태그--css-변수--addeventlistener)
- [항목 3. 상태 흐름 · 비동기 · 배열 메서드 · Flexbox와 Grid](#항목-3-상태-흐름--비동기--배열-메서드--flexbox와-grid)
- [항목 4. 상태 객체 · 모바일 퍼스트](#항목-4-상태-객체--모바일-퍼스트)
- [항목 5. 보너스 과제](#항목-5-보너스-과제)
- [막혔을 때 답하는 법](#막혔을-때-답하는-법)

---

## 평가 전 준비

| 준비 | 이유 |
|---|---|
| 배포 사이트 <https://adohi.github.io/Codyssey_1_1/> 를 새 탭에 열어 둔다 | 항목 1·5 시연용 |
| VS Code에서 프로젝트 폴더를 열어 둔다 | 항목 2~4에서 "코드는 여기 있습니다" 하고 바로 보여 주기 |
| Chrome DevTools(`F12`) 사용법을 한 번 연습한다 | 모바일 화면(`Ctrl`+`Shift`+`M`), Local Storage, Network 요청 차단·스로틀링 시연 |
| 평가 직전에는 새로고침을 남발하지 않는다 | GitHub API는 로그인 없이 **IP당 시간당 60회**. 넘으면 에러 화면이 뜬다(이것도 과제 요구대로 처리된 모습이긴 하다) |
| 평가 5분 전 <https://api.github.com/rate_limit> 를 열어 `resources.core.remaining` 확인(이 주소는 횟수를 쓰지 않음). 10 이하이면 휴대폰 핫스팟으로 전환 | 캠퍼스 와이파이는 여러 명이 같은 공인 IP를 써서 60회를 같이 소진한다 |
| 아래 데모 링크 3개를 즐겨찾기해 둔다 | 로딩/에러/빈 상태를 바로 보여 주기 |
| 저장소의 **verify** 배지가 초록(passing)인지 확인하고, 필요하면 `node scripts/verify.mjs`를 한 번 실행해 둔다 | "반응형 · 상태 흐름 · 접근성 74개를 push마다 자동 검사한다"를 [Actions 기록](https://github.com/ADOHI/Codyssey_1_1/actions/workflows/verify.yml)과 [보고서](VERIFY_REPORT.md)로 보여 주기. 네트워크는 가짜 응답이라 API 횟수 · 실제 메일을 쓰지 않는다 ([README 19장](../README.md#19-자동-검증-ci)) |

- 로딩: <https://adohi.github.io/Codyssey_1_1/?demo=loading#projects>
- 에러: <https://adohi.github.io/Codyssey_1_1/?demo=error#projects>
- 빈 상태: <https://adohi.github.io/Codyssey_1_1/?demo=empty#projects>

> **한도가 이미 초과됐다면**: 화면의 "GitHub API 요청 한도(시간당 60회)를 초과했습니다..." 문구를 보여 주며 "이게 403/429 레이트 리밋 분기입니다"([js/projects.js#L233-L240](../js/projects.js#L233-L240))라고 설명하고, 성공 화면은 README 스크린샷([images/screenshots/desktop-projects.png](../images/screenshots/desktop-projects.png))으로 보여 줍니다.

> **"동작 줄이기(애니메이션 줄이기)"** 설정이 켜진 PC에서는 타이핑 효과와 등장 애니메이션이 일부러 멈춥니다([js/utils.js#L13](../js/utils.js#L13) `prefersReducedMotion`, [css/style.css#L1438](../css/style.css#L1438)). 이 상태로 페이지를 열면 타이핑 반복이 아예 시작되지 않고, 설정을 꺼도 **새로고침해야** 다시 돕니다.
> - 끄는 법: Windows 설정 → 접근성 → 시각 효과 → "애니메이션 효과" 켜기 / Mac: 시스템 설정 → 손쉬운 사용 → 디스플레이 → "동작 줄이기" 끄기 → **새로고침**. 원격 데스크톱으로 접속한 PC에서 자주 켜져 있습니다.
> - 설정을 바꿀 수 없으면 "접근성 배려로 일부러 멈춘 것입니다"라고 설명합니다.

---

## 항목 1. 기능 시연

### 1-1. 브라우저 창을 줄이면 모바일 레이아웃으로 바뀌는가?

**시연 순서**
1. 창 너비를 직접 줄이거나, `F12` → `Ctrl`+`Shift`+`M`(기기 툴바) → 너비를 375 정도로 둔다.
2. **767px 이하**: 메뉴가 숨고 햄버거 버튼이 보인다. 스킬 카드·About이 1열이 된다.
3. **768px 이상**: 햄버거가 사라지고 메뉴가 가로로 펼쳐진다. About이 [사진 | 소개] 2열, 스킬 카드가 2열이 된다.
4. **1024px 이상**: 스킬 카드 4열, Contact가 [연락처 | 폼] 2열이 된다.
5. 프로젝트 카드는 미디어 쿼리 없이 너비에 따라 알아서 1 → 2 → 3열로 바뀐다(스크롤바가 없는 기기 모드 기준 656px에서 2열, 996px에서 3열. 세로 스크롤바가 있는 일반 창은 그 폭(약 15px)만큼 더 넓어야 바뀐다).

> "모바일 기준으로 먼저 작성하고, 768px와 1024px에서 `min-width` 미디어 쿼리로 레이아웃을 넓혀 가는 모바일 퍼스트 방식입니다. 프로젝트 카드는 Grid의 `auto-fit`과 `minmax`로 열 개수가 자동으로 바뀝니다."

코드: [css/style.css#L1323](../css/style.css#L1323) `@media (min-width: 768px)`, [css/style.css#L1413](../css/style.css#L1413) `@media (min-width: 1024px)`, [css/style.css#L804-L806](../css/style.css#L804-L806) `.project-grid`

### 1-2. 테마 토글 시 다크/라이트가 바뀌고, 새로고침 후에도 유지되는가?

**시연 순서**
1. 오른쪽 위 달/해 버튼을 누른다 → 전체 색이 바뀐다.
2. `F5`로 새로고침 → 선택한 테마 그대로 뜬다.
3. (선택) `F12` → **Application** → **Local Storage** → `https://adohi.github.io` → `theme` 키에 `dark` 또는 `light`가 저장된 것을 보여 준다.

> "버튼을 누르면 테마 상태를 바꾸고 `localStorage`에 저장합니다. 페이지를 다시 열면 저장된 값을 먼저 읽어서 적용하기 때문에 새로고침해도 유지됩니다."

코드: [js/theme.js#L56](../js/theme.js#L56) 클릭 이벤트, [js/theme.js#L28](../js/theme.js#L28) `saveTheme`, [js/theme.js#L39](../js/theme.js#L39) 시작할 때 `readSavedTheme()`

> 시크릿(Incognito) 창에서도 새로고침 후 유지는 됩니다. 다만 시크릿 창을 닫으면 저장값이 사라지는 것은 브라우저 동작입니다. 사이트 데이터 저장 자체를 막은 브라우저에서는 테마는 바뀌지만 저장되지 않고, 토글 버튼에 마우스를 올리면 "이번 방문에만 적용됩니다" 안내가 보입니다([js/theme.js#L32](../js/theme.js#L32)).

### 1-3. 햄버거 메뉴, 스크롤 애니메이션, 맨 위로 가기 버튼이 정상 동작하는가?

**시연 순서**
1. **햄버거**: 모바일 너비에서 햄버거 클릭 → 메뉴가 펼쳐지고 버튼이 X로 바뀐다. 다시 클릭 → 닫힌다. 메뉴 항목을 누르면 해당 섹션으로 부드럽게 이동하면서 메뉴가 닫힌다. `Esc`로도 닫힌다.
2. **스크롤 애니메이션**: 아래로 스크롤하면 섹션 제목·About·스킬 카드·Contact 블록(`.reveal`)이 화면에 **20% 이상** 보이는 순간 아래에서 위로 떠오른다. (프로젝트 카드는 `.reveal`이 아니라 그려질 때 CSS `fade-up` 애니메이션으로 나타난다, [css/style.css#L821](../css/style.css#L821))
3. **헤더 배경**: 스크롤이 **60px 이상**이면 투명하던 헤더에 배경색과 그림자가 생긴다.
4. **맨 위로 버튼**: 스크롤이 **300px 이상**이면 오른쪽 아래에 버튼이 나타나고, 누르면 맨 위로 부드럽게 올라간다.
5. (선택) **기준값을 숫자로 증명**: Console에서 `scrollTo(0, 59)` → 헤더 투명, `scrollTo(0, 60)` → 배경 생김. `scrollTo(0, 299)` → 버튼 없음, `scrollTo(0, 300)` → 버튼 나타남.

> "햄버거는 `classList.toggle('active')`로 메뉴에 `active` 클래스를 붙였다 떼고, CSS가 그 클래스를 보고 보여 줍니다. 스크롤 애니메이션은 Intersection Observer로 threshold 0.2, 헤더는 60px, 맨 위로 버튼은 300px이 기준이고 README에도 적어 두었습니다."

코드: [js/layout.js#L40-L42](../js/layout.js#L40-L42) 햄버거, [js/layout.js#L13-L14](../js/layout.js#L13-L14) 기준값 60/300, [js/effects.js#L12](../js/effects.js#L12) `REVEAL_THRESHOLD = 0.2`

**꼬리 질문 대비**
- *"다시 올라갔다 내려오면 왜 안 떠오르나요?"* → 한 번만 보여 주도록 일부러 `unobserve` 했습니다([js/effects.js#L19](../js/effects.js#L19)). 이미 나타난 요소는 더 지켜볼 필요가 없습니다.

### 1-4. GitHub API 데이터가 표시되고, 로딩/에러/빈 상태가 구분되는가?

**시연 순서**
1. Projects 섹션에 실제 저장소 카드가 보인다(포크 제외, 최근 업데이트 순, 6개씩 + "더 보기").
2. **로딩**: `?demo=loading` 링크 → 스피너 + "프로젝트를 불러오는 중..."
3. **에러**: `?demo=error` 링크 → "프로젝트를 불러올 수 없습니다." + **다시 시도** 버튼. 누르면 다시 로딩 → 에러.
4. **빈 상태**: `?demo=empty` 링크 → "표시할 프로젝트가 없습니다."
5. (진짜 에러 → 재시도 → 진짜 로딩 → 성공) `F12` → **Network** → `repos?sort=updated…` 요청 우클릭 → **Block request domain**(요청 도메인 차단) → `F5` → 실제 `TypeError` 경로로 "네트워크에 연결할 수 없습니다. Wi-Fi나 데이터 연결을 확인한 뒤 '다시 시도'를 눌러 주세요." + **다시 시도**. 이어서 차단 목록 패널(Network request blocking)에서 체크 해제 → 스로틀링을 느린 값(`3G` 등)으로 → **다시 시도** 클릭 → 실제 요청 동안 스피너 → 카드 표시 → 스로틀링을 `No throttling`으로 원복.
   - **Offline + 새로고침은 쓰지 않는다.** 페이지 자체가 안 열린다(공룡 화면).
   - 너무 느려 10초를 넘기면 "서버가 10초 안에 응답하지 않았습니다. …" 타임아웃 에러가 뜬다. 이것도 실제 분기다.
   - 네트워크 끊김 · 레이트 리밋 화면을 바로 보여 줘야 하면 README의 [실제 에러 경로 스크린샷](../README.md#상태별-ui-github-api)을 연다.

> "상태를 `loading`, `success`, `error`로 두고, 성공했는데 결과가 0개면 빈 상태로 그립니다. 데모 링크는 평가 때 각 상태를 바로 보여 드리려고 만든 것이고, 실제 에러는 DevTools에서 api.github.com 요청만 막으면 `fetch`가 `TypeError`로 실패하는 진짜 경로로 보여 드릴 수 있습니다. 차단을 풀고 다시 시도를 누르면 로딩을 거쳐 카드가 나옵니다."

코드: [js/projects.js#L174-L184](../js/projects.js#L174-L184) `renderProjects`가 상태별 화면 선택, [js/projects.js#L213-L223](../js/projects.js#L213-L223) 데모 모드, [js/projects.js#L209](../js/projects.js#L209) `TypeError` → 네트워크 문구

### 1-5. 필수값 누락·이메일 형식 오류 시 즉각적인 피드백이 표시되는가?

**시연 순서** (새로고침한 깨끗한 상태에서 시작. 제출을 먼저 하면 모든 칸이 '건드린' 상태가 되어 1~3번이 설명과 다르게 보인다)
1. **필수값 누락 즉시**: 이름 칸 클릭 → 아무것도 안 쓰고 `Tab` → 즉시 "이름을 입력해 주세요." + 빨간 테두리.
2. **이메일 형식 즉시**: 이메일에 `abc@` 입력(치는 동안은 조용함) → `Tab` → 즉시 "올바른 이메일 형식이 아닙니다. (예: name@example.com)".
3. **실시간 갱신**: 이메일 칸으로 돌아가 `test.com`을 이어 치면 `abc@test.co`가 되는 순간 에러가 사라진다. 끝 글자를 지워 `abc@test.c`가 되면 다시 뜬다(한 번 벗어난 칸은 글자마다 검사).
4. **제출 시 전체 검사**: 메시지를 비운 채 **메시지 보내기** → 메시지 칸에도 "메시지를 입력해 주세요." + 커서가 첫 번째 잘못된 칸(이름)으로 이동.
5. 메시지 10자 미만 → "메시지는 10자 이상 입력해 주세요."
6. 모두 올바르게 입력(이름 2자 이상)하고 제출 → "전송 중..." → "메시지가 전송되었습니다. 확인 후 답장드릴게요. 감사합니다!", 폼이 비워진다. (**실제 메일이 발송**되므로 테스트는 1건만)

평가자가 직접 입력해 보기 전에 먼저 말합니다.

> "피드백은 두 단계입니다. 칸을 벗어나는 순간(`focusout`) 바로 표시하고, 그 뒤로는 `input` 이벤트로 글자마다 다시 검사해 고치는 즉시 사라집니다. 첫 글자부터 띄우면 'a'만 쳐도 형식 오류가 떠서 사용자를 재촉하게 됩니다. 제출은 `event.preventDefault()`로 새로고침을 막고, 세 칸을 한꺼번에 검사합니다."

코드: [js/contact.js#L137](../js/contact.js#L137) `input`, [js/contact.js#L148](../js/contact.js#L148) `focusout`, [js/contact.js#L156-L157](../js/contact.js#L156-L157) `submit` + `preventDefault`, [js/contact.js#L162](../js/contact.js#L162) 제출 시 전부 `touched`, [js/contact.js#L32](../js/contact.js#L32) `validators`

**꼬리 질문 대비**
- *"왜 `blur`가 아니라 `focusout`인가요?"* → `blur`는 버블링되지 않아 form 하나에 위임할 수 없습니다. `focusout`은 버블링되므로 form에 리스너 1개로 세 칸을 처리합니다([js/contact.js#L148](../js/contact.js#L148)).
- *"첫 글자부터 검사하게 바꿀 수 있나요?"* → 됩니다. `input` 핸들러의 `setFormState`([js/contact.js#L141](../js/contact.js#L141))에 `touched: { ...formState.touched, [name]: true }` 한 줄을 추가하면 됩니다. 다만 입력 중에 재촉하는 단점 때문에 일부러 안 했습니다.

---

## 항목 2. 파일 분리 · 시맨틱 태그 · CSS 변수 · addEventListener

### 2-1. HTML, CSS, JavaScript를 파일로 분리한 이유와 각 파일의 역할은?

> "HTML은 **구조와 내용**, CSS는 **모양과 배치**, JavaScript는 **동작**을 맡습니다. 역할별로 나누면 색을 바꿀 때는 CSS만, 동작을 고칠 때는 JS만 보면 돼서 수정 범위가 분명해집니다. 브라우저가 CSS·JS 파일을 따로 캐시해 재사용할 수 있고, HTML에 스크립트를 섞지 않으니 읽기도 쉽습니다. JS는 기능별로 6개 파일로 한 번 더 나눴습니다."

| 파일 | 역할 |
|---|---|
| [index.html](../index.html) | 페이지 구조와 내용(섹션, 텍스트, 폼). 외부 CSS·JS 연결 |
| [css/style.css](../css/style.css) | 디자인 토큰(변수), 라이트/다크 색, 레이아웃, 반응형, 애니메이션 |
| [js/utils.js](../js/utils.js) | 여러 파일이 같이 쓰는 도우미(`sleep`, `prefersReducedMotion`) |
| [js/theme.js](../js/theme.js) | 다크 모드 + `localStorage` 저장 + 시스템 테마 감지 |
| [js/layout.js](../js/layout.js) | 햄버거, 부드러운 스크롤, 헤더 배경(60px), 맨 위로(300px), 현재 섹션 표시 |
| [js/effects.js](../js/effects.js) | 스크롤 애니메이션(0.2), 타이핑 효과 |
| [js/projects.js](../js/projects.js) | GitHub API 호출과 로딩/에러/빈 상태, 필터, 더 보기 |
| [js/contact.js](../js/contact.js) | 폼 유효성 검사와 Formspree 전송 |

**꼬리 질문 대비**
- *"JS 파일 순서가 중요한가요?"* → 네. `defer`는 HTML을 다 읽은 뒤 **적힌 순서대로** 실행합니다. `utils.js`의 함수를 다른 파일이 쓰기 때문에 맨 앞에 뒀습니다([index.html#L35-L40](../index.html#L35-L40)).
- *"파일을 나누면 변수 이름이 겹치지 않나요?"* → 일반 스크립트는 전역을 공유해서 같은 이름을 `const`로 두 번 선언하면 에러가 납니다. 그래서 파일마다 `projectState`, `formState`처럼 이름을 구분했고, 최상위 선언 80개 중 겹치는 이름이 없는 것을 확인했습니다.
- *"왜 `type="module"`을 안 썼나요?"* → 모듈은 파일마다 스코프가 분리되지만 `import`/`export`를 써야 하고, `file://`로 열면 CORS로 막힙니다. 과제 규모에서는 `defer`와 순서 관리로 충분했습니다.
- *"파일을 많이 나누면 요청이 늘어 느려지지 않나요?"* → GitHub Pages는 HTTP/2를 지원해 한 연결로 여러 파일을 동시에 받고, `Cache-Control: max-age=600`(10분)으로 캐시됩니다. 실무에서는 번들러로 합칩니다.

### 2-2. 시맨틱 태그를 어떤 기준으로 선택했는가?

> "'이 영역이 **무슨 역할**을 하는가'를 기준으로 골랐습니다. 역할에 맞는 태그가 있으면 그 태그를 쓰고, 순수하게 배치용인 곳만 `div`를 썼습니다. 이렇게 하면 스크린 리더 사용자가 '메뉴로 이동', '본문으로 이동'처럼 영역 단위로 이동할 수 있고, 검색 엔진과 다른 개발자도 구조를 바로 이해합니다."

| 태그 | 쓴 곳 | 기준 |
|---|---|---|
| `<header>` | 사이트 상단(로고 + 메뉴) [index.html#L96](../index.html#L96) | 페이지의 머리말 |
| `<nav>` | 섹션 이동 메뉴 [index.html#L100](../index.html#L100) | 주요 이동 링크 묶음 |
| `<main>` | 본문 전체 [index.html#L124](../index.html#L124) | 페이지당 하나뿐인 핵심 내용. "본문으로 건너뛰기" 링크의 목적지 |
| `<section>` | Hero, About, Skills, Projects, Contact [index.html#L126](../index.html#L126) 등 | **제목이 있는** 주제 단위. 각각 `aria-labelledby`로 제목과 연결 |
| `<article>` | 스킬 카드 [index.html#L196](../index.html#L196), 프로젝트 카드(JS가 생성) | **따로 떼어 내도 의미가 통하는** 독립 콘텐츠 |
| `<footer>` | 저작권 + 소셜 링크 [index.html#L356](../index.html#L356) | 페이지의 꼬리말 |
| `<address>` | 이메일·GitHub 연락처 [index.html#L296](../index.html#L296) | 연락처 정보 전용 태그 |
| `<figure>` | 프로필 이미지 [index.html#L152](../index.html#L152) | 본문과 연결된 이미지 |

**꼬리 질문 대비**
- *"section과 article 차이는?"* → `section`은 페이지 안의 **주제 묶음**(제목이 있음), `article`은 **혼자서도 완결된 콘텐츠**입니다. 프로젝트 카드는 다른 페이지에 옮겨 놔도 의미가 통해서 `article`입니다.
- *"div는 안 썼나요?"* → 썼습니다. `.container`처럼 가운데 정렬·여백만을 위한 배치용 박스는 의미가 없으므로 `div`가 맞습니다.
- *"header/footer가 여러 개인데 괜찮나요?"* → 괜찮습니다. `header`·`footer`는 가장 가까운 section/article의 머리말·꼬리말입니다(섹션 제목 [index.html#L146](../index.html#L146), 프로젝트 카드 [js/projects.js#L112](../js/projects.js#L112)·[L131](../js/projects.js#L131)). body 바로 아래 것만 사이트 배너·꼬리말로 취급되고, 페이지에 하나뿐이어야 하는 것은 `main`입니다.
- *"ul 안에 article을 넣은 이유는?"*([index.html#L194-L196](../index.html#L194-L196)) → 카드들의 **목록**이라 `ul`/`li`를 쓰고, 각 카드는 **독립 콘텐츠**라 `article`입니다. 등장 애니메이션은 `li`, hover 이동은 `article`에 맡겨 `transform` 충돌도 피했습니다.

### 2-3. CSS 변수(`:root`)로 관리하면 어떤 이점이 있는가?

> "색·폰트·간격을 `:root`에 이름을 붙여 한 번만 정의했습니다. 이점은 세 가지입니다. 첫째, **한 곳만 고치면 전체가 바뀝니다.** 강조색 `--color-primary`는 30곳에서 쓰는데 값은 라이트·다크 각각 한 줄입니다. 둘째, **다크 모드가 쉬워집니다.** `[data-theme="dark"]`에서 같은 이름의 변수 값만 바꿔 두면, 컴포넌트 CSS는 그대로 두고 JS는 `data-theme` 속성 하나만 바꾸면 됩니다. 셋째, `#5b5b66` 대신 `--color-text-muted`처럼 **이름으로 뜻이 보여서** 읽기 쉽고, 간격도 정해진 값만 써서 디자인이 일관됩니다."

- `:root`에 토큰 45개(색·그림자·폰트·크기·간격·모서리·전환 시간) 정의 → [css/style.css#L33](../css/style.css#L33)
- 다크 모드에서 바꾸는 것은 18개(색 + 그림자) → [css/style.css#L94](../css/style.css#L94)
- 새 토큰을 추가할 때의 이름 규칙(`--color-{역할}`, `--space-1~9` 4px 단계 등)과 "테마에 따라 바뀌는 값은 두 블록 모두에 정의" 규칙 → [README 9.2](../README.md#디자인-토큰-css-변수)
- 스타일시트 전체에서 `var(--...)`를 298번 사용
- **10초 시연**: `F12` → Elements에서 `<html>` 선택 → Styles의 `:root`에서 `--color-primary`를 `red`로 바꾸면 로고 점·버튼·필터 등 사용처 30곳이 동시에 바뀐다. (다크 모드라면 `[data-theme="dark"]` 규칙의 값을 바꿔야 보인다)

**꼬리 질문 대비**
- *"`[data-theme="dark"]`가 `:root`를 어떻게 이기나요?"* → 둘 다 명시도가 (0,1,0)이고 같은 `<html>`에 적용되므로, 뒤에 선언된 [L94](../css/style.css#L94) 규칙이 이깁니다.
- *"Sass 변수랑 뭐가 달라요?"* → Sass 변수는 빌드할 때 값이 박혀 버려서 실행 중에 바꿀 수 없습니다. CSS 변수는 **브라우저에서 실시간으로** 적용·상속되므로 `data-theme`만 바꿔도 즉시 다크 모드가 됩니다.
- *"변수 없이 다크 모드를 하면?"* → 색을 쓰는 모든 선택자를 다크용으로 한 번 더 써야 해서 CSS가 두 배가 되고, 하나라도 빠뜨리면 그 부분만 라이트 색으로 남습니다.

### 2-4. `onclick` 인라인 속성 대신 `addEventListener`를 쓴 이유는?

> "`onclick` 속성은 HTML 안에 JS 코드를 문자열로 적는 방식이라 구조와 동작이 섞이고, 요소마다 핸들러 **자리가 하나**뿐이라 다른 코드가 다시 넣으면 앞의 것이 덮어써집니다. `addEventListener`는 JS 파일에서 연결해 HTML에는 구조만 남고, 서로 모르는 코드가 같은 이벤트에 각자 리스너를 **추가**해도 덮어쓰지 않으며, **특정 함수만** 떼거나 `once`·`passive` 같은 **옵션**을 줄 수 있습니다. 이 프로젝트는 HTML에 `onclick`이 0개이고, JS가 만든 필터 버튼도 부모에 리스너 하나로 위임했습니다."

| 비교 | `onclick` 인라인 속성 | `addEventListener` |
|---|---|---|
| 코드 위치 | HTML 안에 JS 문자열 | JS 파일 |
| 같은 이벤트에 여러 개 | 자리 1개, 다시 대입하면 덮어씀(`el.onclick`도 같은 자리) | 호출할 때마다 누적 |
| 제거 | `onclick = null`로 통째로만 | `removeEventListener`로 특정 함수만 |
| 옵션 | 없음 | `passive`, `once`, `capture` |
| 호출할 수 있는 함수 | 전역 함수만 | 어떤 함수든(클로저 포함) |
| JS로 만든 HTML | 템플릿 안에 `onclick="setFilter('C#')"` 같은 JS 코드 문자열을 넣게 됨 | 부모에 리스너 1개 + `data-*`로 값만 전달 |
| 보안 정책(CSP) | 인라인 스크립트 금지 정책에 막힘 | 허용(이 사이트엔 CSP 미설정이지만, 설정해도 깨지지 않는 구조) |

코드: [js/layout.js#L102](../js/layout.js#L102) `scroll` + `{ passive: true }` 옵션 사용 예, [js/projects.js#L271-L275](../js/projects.js#L271-L275) 필터 버튼 **이벤트 위임**(부모 하나에 리스너 1개, `event.target.closest('.filter-btn')`로 누른 버튼 찾기). 리스너 15곳을 파일별로 모은 표는 [README 9.5](../README.md#95-이벤트-목록).

**꼬리 질문 대비**
- *"이벤트 위임이 뭔가요?"* → 클릭 이벤트는 누른 요소에서 부모 쪽으로 올라갑니다(버블링). 그래서 버튼마다 리스너를 달지 않고 항상 존재하는 부모에 하나만 달아 두면, JS가 나중에 만들어 넣은 버튼 클릭도 처리됩니다.
- *"위임은 `onclick`으로는 못 하나요?"* → `parent.onclick = (e) => ...`로도 됩니다. 위임은 버블링 덕분이지 `addEventListener`만의 기능은 아닙니다. 차이는 자리가 하나라 다른 코드가 대입하면 덮어써진다는 점입니다.
- *"`onclick="a(); b()"`로 여러 개 부르면 되잖아요?"* → 한 속성 안에서 여러 함수를 부를 수는 있지만 자리는 여전히 하나라, 다른 파일이 `el.onclick = ...`으로 대입하면 통째로 바뀝니다. HTML 속성과 `el.onclick` 프로퍼티는 같은 자리를 씁니다.
- *"`passive`는 무슨 효과가 있나요?"* → "이 리스너는 `preventDefault()`로 막지 않는다"는 약속입니다. `scroll`은 원래 취소가 안 되는 이벤트라 여기서는 성능 효과보다 의도 표시이고, 효과가 큰 건 `wheel`·`touchmove`입니다.
- *"왜 `event.target.closest`를 쓰나요?"* → 버튼 안의 개수 `<span class="filter-btn__count">`([js/projects.js#L161](../js/projects.js#L161))를 누르면 `event.target`이 버튼이 아니라 span이 되기 때문입니다. `closest`로 가장 가까운 `.filter-btn`을 찾습니다([L272](../js/projects.js#L272)).
- *"템플릿에 onclick을 넣으면 뭐가 위험한가요?"* → 데이터가 **JS 코드 안**에 들어갑니다. HTML 이스케이프한 `&#39;`도 속성을 읽을 때 `'`로 풀려서 코드가 될 수 있습니다. 지금은 이스케이프한 언어 이름을 `data-filter` **값**으로만 넣고 JS에서 읽습니다([js/projects.js#L159](../js/projects.js#L159)).

---

## 항목 3. 상태 흐름 · 비동기 · 배열 메서드 · Flexbox와 Grid

### 3-1. "이벤트 → 상태 변경 → 화면 업데이트" 흐름을 코드로 따라가 보라

**다크 모드로 설명하기(가장 짧고 명확함).** VS Code에서 [js/theme.js](../js/theme.js)를 열고 위에서 아래로 짚습니다.

```js
// ① 이벤트: 버튼 클릭 (L56)
themeToggle.addEventListener('click', () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  // ... (지원 브라우저는 startViewTransition으로 감싸서 호출, L60-L64)
  setTheme(nextTheme, { save: true });
});

// ② 상태 변경: 테마는 반드시 이 함수로만 바꾼다 (L49)
const setTheme = (nextTheme, { save = false } = {}) => {
  currentTheme = nextTheme;          // 상태 변경
  if (save) saveTheme(nextTheme);    // localStorage에 저장
  renderTheme();                     // 바꿨으면 반드시 다시 그린다
};

// ③ 화면 업데이트: 상태를 DOM에 반영 (L42)
const renderTheme = () => {
  document.documentElement.setAttribute('data-theme', currentTheme);
  themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
};
```

> "① 버튼을 **클릭**하면 ② `setTheme`이 `currentTheme` **상태를 바꾸고** 저장한 뒤 ③ `renderTheme`이 `<html data-theme="dark">`로 **화면에 반영**합니다. 그러면 CSS의 `[data-theme="dark"]` 변수들이 적용되어 페이지 전체 색이 바뀝니다. 새로고침하면 [L39](../js/theme.js#L39)에서 저장된 값을 먼저 읽고 [L73](../js/theme.js#L73)에서 첫 렌더를 하기 때문에 유지됩니다."

- **화면으로 보여 주기**: `F12` → Elements에서 맨 위 `<html ... data-theme="light">` 줄이 보이게 두고 토글을 누르면 `data-theme` 값이 반짝이며 바뀝니다(= ③). (선택) Sources에서 [js/theme.js#L50](../js/theme.js#L50) `currentTheme = nextTheme`에 중단점을 걸고 클릭하면 ① → ② 순간에 멈춥니다. (L63에 걸면 안 멈춥니다. 동작 줄이기가 꺼진 Chrome은 View Transition 쪽인 L61로 갑니다)
- *"`// ...`에는 뭐가 있나요?"* → 지원 브라우저에서는 `document.startViewTransition`으로 바뀌기 전후 화면을 크로스페이드하고, 그 콜백 안에서 `setTheme`을 실행할 뿐 흐름은 같습니다([js/theme.js#L60-L64](../js/theme.js#L60-L64)).

**API로 설명해야 한다면** → [js/projects.js](../js/projects.js): 페이지 로드([L293](../js/projects.js#L293) `loadRepos()`) → `setProjectState({ status: 'loading' })`([L252](../js/projects.js#L252)) → `renderProjects()`가 스피너 표시 → 요청 성공 시 `status: 'success'`([L260](../js/projects.js#L260)) → 카드 표시, 실패 시 `status: 'error'`([L263](../js/projects.js#L263)) → 에러 + 다시 시도.

**폼으로 설명해야 한다면** → [js/contact.js](../js/contact.js): 칸을 벗어남(`focusout`, [L148](../js/contact.js#L148)) → `setFormState({ touched })` / 글자 입력(`input`, [L137](../js/contact.js#L137)) → `setFormState({ values })` → `renderForm()`([L85](../js/contact.js#L85))이 `validateForm(values)`로 에러 계산([L87](../js/contact.js#L87)) → `touched`인 칸만 표시([L94](../js/contact.js#L94)) → 문구·`invalid` 클래스·`aria-invalid` 갱신([L96-L98](../js/contact.js#L96-L98)). "입력하는데 왜 에러가 안 떠요?"의 답이 `touched`입니다.

### 3-2. `async/await`와 `try/catch`로 성공과 실패를 어떻게 나눴는가?

[js/projects.js#L251-L265](../js/projects.js#L251-L265) `loadRepos`를 열고 따라갑니다.

```js
const loadRepos = async () => {
  setProjectState({ status: 'loading', errorMessage: '' });   // 1. 먼저 로딩 화면

  try {
    const data = await fetchRepos();                          // 2. 응답을 기다린다
    const repos = data.filter(({ fork }) => !fork);
    // ...
    setProjectState({ status: 'success', repos, /* ... */ }); // 3-a. 성공 → 카드
  } catch (error) {
    setProjectState({ status: 'error', errorMessage: toErrorMessage(error) }); // 3-b. 실패 → 에러 + 다시 시도
  }
};
```

> "먼저 상태를 `loading`으로 바꿔 스피너를 보여 주고, `await`로 응답을 기다립니다. 문제가 생기면 어디서든 에러를 **던지고(throw)**, `catch`가 받아서 상태를 `error`로 바꿉니다. 중요한 점은 `fetch`가 404나 403 같은 **HTTP 에러에서는 실패로 처리되지 않는다**는 것입니다. 그래서 `fetchRepos` 안에서 `response.ok`를 직접 확인하고, 아니면 제가 직접 에러를 던지게 했습니다."

`fetchRepos`([L213-L249](../js/projects.js#L213-L249)) 안에서 실패가 만들어지는 곳:

| 상황 | 처리 | 화면 문구 |
|---|---|---|
| 네트워크 끊김 | `fetch`가 스스로 실패(`TypeError`) | 네트워크에 연결할 수 없습니다. Wi-Fi나 데이터 연결을 확인한 뒤 '다시 시도'를 눌러 주세요. |
| 10초 무응답 | `AbortSignal.timeout(10000)`이 중단([L227](../js/projects.js#L227)) | 서버가 10초 안에 응답하지 않았습니다. 네트워크가 느리거나 GitHub가 혼잡할 수 있으니 잠시 후 '다시 시도'를 눌러 주세요. |
| 403/429 + 남은 횟수 0 | `response.ok`가 false → 직접 `throw`([L233-L240](../js/projects.js#L233-L240)) | GitHub API 요청 한도(시간당 60회)를 초과했습니다. (시각) 이후에 다시 시도해 주세요. 그동안은 'GitHub에서 보기'로 저장소를 볼 수 있습니다. |
| 404 | 직접 `throw`([L242](../js/projects.js#L242)) | GitHub 사용자 'ADOHI'를 찾을 수 없습니다. 'GitHub에서 보기'로 직접 확인해 주세요. |
| 500 등 | 직접 `throw`([L243](../js/projects.js#L243)) | GitHub 서버에서 오류가 발생했습니다. (HTTP 500) 잠시 후 '다시 시도'를 눌러 주세요. |
| 응답이 배열이 아님 | 직접 `throw`([L247](../js/projects.js#L247)) | GitHub에서 예상하지 못한 형식의 응답을 받았습니다. 잠시 후 '다시 시도'를 눌러 주세요. |

> 문구는 모두 "원인 + 지금 할 일" 구조입니다. 레이트 리밋만 "다시 시도" 대신 풀리는 시각과 "GitHub에서 보기"를 안내하는 이유는, 한도가 풀리기 전에는 다시 눌러도 같은 결과이기 때문입니다.

**꼬리 질문 대비**
- *"await를 안 쓰면?"* → `fetch`는 결과가 아니라 **나중에 결과를 주겠다는 약속(Promise)**을 바로 돌려줍니다. 예를 들어 [L255](../js/projects.js#L255)에서 `await`를 빼면 `data`에 배열이 아니라 Promise가 들어가서 `data.filter is not a function` `TypeError`가 납니다.
- *"finally는 왜 없나요?"* → 성공이든 실패든 `status`를 `success`/`error`로 바꾸는 것 자체가 로딩 종료라서 따로 끌 것이 없습니다.
- *"기다리는 동안 화면이 멈추지 않나요?"* → `await`는 그 함수만 잠시 멈추고 브라우저에 제어권을 돌려주기 때문에 스크롤·클릭은 계속 됩니다. Unity 코루틴의 `yield return`과 비슷합니다.
- *"같은 패턴이 또 있나요?"* → 폼 전송도 같습니다. `status: 'submitting'` → `try { await sendMessage(...) }` → 성공/실패로 상태 변경([js/contact.js#L171-L180](../js/contact.js#L171-L180)).
- (알아 두면 좋은 한계) `try` 안에서 나는 `TypeError`는 렌더 코드 실수여도 [L209](../js/projects.js#L209)에서 "네트워크에 연결할 수 없습니다" 문구로 바뀝니다. 진짜 원인은 [L262](../js/projects.js#L262)의 `console.error`로 Console에서 확인합니다.

### 3-3. `map`, `filter`로 GitHub 데이터를 카드 UI로 바꾸는 과정은?

> "받은 배열을 `filter`로 걸러서 필요한 저장소만 남기고, `map`으로 저장소 하나를 카드 HTML 하나로 바꾼 뒤, `join`으로 합쳐서 화면에 넣습니다."

| 단계 | 코드 | 결과(작성 시점) |
|---|---|---|
| ① 응답 받기 | `await response.json()` [L246](../js/projects.js#L246) | 저장소 객체 배열 47개 |
| ② 포크 제외 | `data.filter(({ fork }) => !fork)` [L256](../js/projects.js#L256) | 직접 만든 27개 |
| ③ 언어 필터(선택 시) | `repos.filter(({ language }) => language === filter)` [L68](../js/projects.js#L68) | 예: C# 10개 |
| ④ 보여 줄 만큼 자르기 | `filteredRepos.slice(0, visibleCount)` [L177](../js/projects.js#L177) | 앞에서 6개(더 보기로 +6) |
| ⑤ 객체 → 카드 HTML | `shownRepos.map(createProjectCard)` [L195](../js/projects.js#L195) | HTML 문자열 6개짜리 배열 |
| ⑥ 합쳐서 화면에 | `.join('')` → `innerHTML` [L195](../js/projects.js#L195) | 카드 6장 표시 |

⑤의 `createProjectCard`([L100](../js/projects.js#L100))는 **구조분해 할당**으로 필요한 값만 꺼내고(`html_url: repoUrl`처럼 이름도 바꿈), **템플릿 리터럴**로 `<article>` HTML을 만듭니다. 이름·설명은 `escapeHTML`을 거쳐 넣어서 악성 HTML이 실행되지 않게 했습니다.

> 필터 버튼의 언어별 개수는 `reduce`로 셉니다([L151](../js/projects.js#L151)). 선택된 버튼 강조는 `forEach`로 버튼을 돌며 `classList.toggle('active', ...)`를 합니다([L188-L192](../js/projects.js#L188-L192)).

**꼬리 질문 대비**
- *"map과 forEach 차이는?"* → `map`은 **새 배열을 돌려주고**(변환), `forEach`는 **돌려주는 값 없이 하나씩 실행만** 합니다(반복 작업). 카드를 만드는 건 결과가 필요해서 `map`, 버튼 강조는 결과가 필요 없어서 `forEach`입니다.
- *"for문으로 해도 되지 않나요?"* → 됩니다. 다만 `filter`/`map`은 '무엇을 하려는지'가 이름에 드러나고, 원본 배열을 바꾸지 않아서 실수가 적습니다. C# LINQ의 `Where`/`Select`와 같은 역할입니다.
- *"전체는 27인데 언어 버튼 숫자를 더하면 왜 25인가요?"* → 언어가 없는(`null`) 저장소 2개는 '전체'에만 들어갑니다. `reduce`에서 `if (language)`로 건너뛰기 때문입니다([L152](../js/projects.js#L152)).
- *"`map(createProjectCard)`에는 왜 괄호가 없나요?"* → 함수를 **값으로** 넘기면 `map`이 저장소마다 대신 호출합니다. 괄호를 붙이면 지금 바로 실행한 결과를 넘기게 됩니다.
- *"포크 제외와 언어 필터는 왜 다른 곳에 있나요?"* → 포크 제외는 받자마자 한 번 해서 상태에 저장하고([L256](../js/projects.js#L256)), 언어 필터는 렌더할 때마다 계산하는 파생 값입니다([L66-L69](../js/projects.js#L66-L69)). 4-1의 "계산할 수 있는 값은 저장하지 않는다"와 같은 원칙입니다.

### 3-4. Flexbox와 Grid를 어디에 썼고, 왜 그렇게 골랐는가?

> "**한 줄로 늘어놓는 것**(1차원)은 Flexbox, **행과 열을 같이 맞추는 것**(2차원)은 Grid를 썼습니다. 헤더는 로고·메뉴·버튼을 한 줄에 놓고 메뉴를 오른쪽으로 미는 것이라 Flexbox가 맞고, 프로젝트 카드는 여러 줄에 걸쳐 열 너비를 똑같이 맞춰야 해서 Grid를 썼습니다."

| 방식 | 적용한 곳 | 고른 이유 |
|---|---|---|
| **Flexbox** | 헤더 [L362](../css/style.css#L362) (로고 왼쪽 · 메뉴·버튼 오른쪽) | 한 줄 배치(`align-items: center`) + `.nav { margin-left: auto }`([L381](../css/style.css#L381))가 남는 공간을 차지해 메뉴·버튼을 오른쪽으로 민다 |
| | 메뉴 [L386](../css/style.css#L386) (모바일 세로 → 768px부터 가로) | `flex-direction`만 바꾸면 방향 전환 |
| | Hero 버튼 [L559](../css/style.css#L559), 기술 태그 [L728](../css/style.css#L728), 필터 버튼 [L755](../css/style.css#L755) | 개수가 들쭉날쭉해도 `flex-wrap`으로 자연스럽게 줄바꿈 |
| | 프로젝트 카드 내부 [L810](../css/style.css#L810), 폼 [L1112](../css/style.css#L1112), 푸터 [L1237](../css/style.css#L1237) | 세로로 쌓고 남는 공간 채우기(설명이 짧아도 카드 아래 정보줄이 바닥에 붙음) |
| **Grid** | 프로젝트 카드 목록 [L804](../css/style.css#L804) | `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`로 미디어 쿼리 없이 1→2→3열, 모든 카드 열 너비 동일 |
| | 스킬 카드 [L681](../css/style.css#L681) | 1열 → 2열 → 4열을 열 개수로 딱 지정 |
| | About [L627](../css/style.css#L627), Contact [L1056](../css/style.css#L1056) | [사진 \| 소개], [연락처 \| 폼]처럼 칸 크기를 먼저 정하는 레이아웃 |

코드에서 바로 보여 줄 곳: 헤더 [L363](../css/style.css#L363) · 카드 [L812](../css/style.css#L812) · About [L628](../css/style.css#L628) · Skills [L682](../css/style.css#L682)의 `display` 줄 끝에 **왜 Flex/Grid인지 한 줄 주석**을 달아 두었습니다.

**꼬리 질문 대비**
- *"카드 목록도 flex-wrap으로 되지 않나요?"* → 되지만 마지막 줄 카드가 혼자 넓게 늘어나거나 열이 안 맞기 쉽습니다. Grid는 열을 먼저 정하고 카드를 칸에 넣기 때문에 모든 줄이 반듯합니다.
- *"auto-fit과 auto-fill 차이는?"* → 카드가 적을 때 `auto-fit`은 빈 열을 0으로 접어 카드를 늘리고, `auto-fill`은 빈 열을 그대로 남겨 둡니다. 그래서 PowerShell처럼 저장소가 1개인 언어를 누르면 카드가 가로로 꽉 찹니다(`auto-fill`이면 1/3 폭으로 남음). 7장일 때 마지막 한 장은 1/3 폭 그대로라, flex-wrap처럼 마지막 줄만 늘어나는 문제는 없습니다. 과제 요구가 `auto-fit`이라 그것을 썼습니다. (1개짜리 언어가 5개라 필터 시연 중 이 장면이 자주 나옵니다)
- *"About 2열은 flex로도 되지 않나요?"* → 됩니다. 다만 Grid는 부모에서 `220px 1fr` 한 줄로 칸 크기를 정하고, 브레이크포인트에서는 그 한 줄만 바꿉니다([L1355](../css/style.css#L1355), [L1419](../css/style.css#L1419)). flex면 자식마다 너비를 따로 줘야 합니다.

---

## 항목 4. 상태 객체 · 모바일 퍼스트

### 4-1. 상태 객체를 따로 만든 이유는? 그냥 변수로 처리하면 안 되는가?

> "변수로도 **동작은 합니다.** 문제는 '값이 여기저기서 직접 바뀌는 것'입니다. 저는 관련된 값을 `projectState` 같은 객체 하나로 묶고, **`setProjectState` 한 함수로만 바꾸고, 바꾸면 반드시 다시 그리도록** 했습니다. 첫째, 함께 바뀌어야 할 값을 한 번에 바꿉니다. 로딩으로 바꿀 때 이전 에러 문구를 같이 지우고, 성공하면 저장소·필터·표시 개수를 한꺼번에 바꿔서 '로딩 중인데 에러 문구가 남은' 상태나 '새 데이터인데 옛 필터가 남은' 상태가 생기지 않습니다. 둘째, 이 창구로만 바꾼다는 규칙을 지키면 **화면 갱신을 빠뜨릴 일이 없습니다.** 셋째, `console.log(projectState)` 하나로 지금 화면이 왜 이런지 설명됩니다."

```js
// 흩어진 변수로 하면: 여러 곳에서 각자 바꾸고, 각자 화면을 고쳐야 한다
status = 'error';
errorMessage = '...';
// renderProjects();  ← 이 한 줄을 빠뜨리면 데이터와 화면이 어긋난다

// 이 프로젝트: 한 번에, 한 창구로 바꾸고, 항상 다시 그린다 (js/projects.js L42)
setProjectState({ status: 'error', errorMessage: toErrorMessage(error) });
```

- 상태 객체: [js/projects.js#L33](../js/projects.js#L33) `projectState`(status·repos·errorMessage·filter·visibleCount), [js/contact.js#L62](../js/contact.js#L62) `formState`(values·touched·status)
- 상태 변경 창구: [js/projects.js#L42-L45](../js/projects.js#L42-L45) `setProjectState`, [js/contact.js#L68](../js/contact.js#L68) `setFormState`
- 함께 바꾸는 예: [js/projects.js#L252](../js/projects.js#L252) `{ status: 'loading', errorMessage: '' }`, [js/projects.js#L260](../js/projects.js#L260) `{ status: 'success', repos, filter: ALL_FILTER, visibleCount: PAGE_SIZE }`

**꼬리 질문 대비**
- *"`isLoading`, `isError` 불리언으로 나누면 안 되나요?"* → 두 개로 나누면 둘 다 `true`인 말이 안 되는 상태가 생길 수 있습니다. `status` 한 칸이면 동시에 참일 수 없습니다.
- *"React랑 비슷하네요?"* → 네. `setState`를 거쳐야 다시 그려진다는 발상이 같습니다. (다만 `useState`의 setter는 객체를 병합하지 않고 통째로 바꿉니다)
- *"그런데 다크 모드는 그냥 변수(`currentTheme`)던데요?"* → 값이 **하나뿐**이라 객체로 묶을 필요가 없었습니다. 대신 규칙은 같습니다. `setTheme` 한 함수로만 바꾸고, 바꾸면 반드시 `renderTheme`을 부릅니다. 핵심은 객체냐 변수냐가 아니라 **바꾸는 창구를 하나로 모은 것**입니다.
- *"폼 에러 메시지는 왜 상태에 없나요?"* → 에러는 입력값만 있으면 **계산해서 알 수 있는 값**이라 따로 저장하지 않았습니다(`validateForm(values)`, [js/contact.js#L51](../js/contact.js#L51)). 저장하면 값을 고칠 때 에러 갱신을 빠뜨리는 버그가 생길 수 있습니다.
- *"`{ ...projectState, ...changes }`는 뭔가요?"* → 기존 상태를 복사한 새 객체에 바뀐 값만 덮어쓰는 **스프레드 문법**입니다. 원본을 직접 고치지 않는 방식이라 React에서도 똑같이 씁니다.
- *"render 밖에서 필터 버튼 `innerHTML`을 바꾸네요?"*([js/projects.js#L259](../js/projects.js#L259)) → 의도적인 예외입니다. 매 렌더마다 버튼을 새로 만들면 방금 누른 버튼의 키보드 포커스가 사라집니다. 그래서 버튼 목록은 데이터가 바뀔 때만 만들고, 선택 표시는 `renderProjects`가 상태를 보고 그립니다([L188-L192](../js/projects.js#L188-L192)).
- *"평가표는 STATE 객체라는데 왜 하나로 안 합쳤나요?"* → 테마·프로젝트·폼은 서로 독립된 기능이라 파일마다 자기 상태를 가집니다. 합치면 폼에 한 글자 칠 때 프로젝트까지 다시 그리게 됩니다.
- *"전역 스코프를 공유하는데 이름이 겹치거나 다른 파일이 상태를 건드리면요?"* → 이름은 `{기능}State` · `set{기능}State` · `render{기능}`, 상수는 `UPPER_SNAKE_CASE`로 기능을 드러내고, **상태는 선언한 파일만 읽고 쓴다**는 경계 규칙을 지킵니다([README 9.3](../README.md#일반-스크립트는-전역-스코프를-공유한다--이름-충돌을-어떻게-피했나)). 이름이 겹치면 자동 검증이 FAIL을 냅니다.
- *"왜 `const`가 아니라 `let`인가요?"* → set 함수가 상태를 새 객체로 통째로 교체하기 때문입니다([js/projects.js#L43](../js/projects.js#L43)).
- *"매번 전체를 다시 그리면 비효율 아닌가요?"* → 카드가 수십 개 수준이라 단순함이 더 이득입니다. 규모가 커지면 바뀐 부분만 찾아 갱신해야 하고, 그게 React 가상 DOM이 하는 일입니다.

### 4-2. 모바일 퍼스트로 작성한 이유는?

> "가장 제약이 큰 **작은 화면부터** 설계하면 꼭 필요한 내용만 남기게 되고, 화면이 커질 때 레이아웃을 **덧붙이기만** 하면 됩니다. 기본 CSS는 1열이라 단순하고, 768px·1024px에서 `min-width`로 열을 늘리고 메뉴를 펼치는 규칙만 추가했습니다. 반대로 데스크톱부터 만들면 작은 화면에서 열·여백을 **되돌리는 코드**가 계속 늘어납니다. 요즘 방문자 상당수가 모바일이라는 점도 이유입니다."

| 구간 | 적용되는 것 |
|---|---|
| 기본(모바일) | 햄버거 메뉴, 모든 섹션 1열, 제출 버튼 가로 꽉 채움 |
| `min-width: 768px` [L1323](../css/style.css#L1323) | 햄버거 숨김·메뉴 가로 배치, About 2열, 스킬 2열, 필터와 개수 한 줄 |
| `min-width: 1024px` [L1413](../css/style.css#L1413) | 스킬 4열, Contact 2열, About 사진 칸 넓힘 |

**꼬리 질문 대비**
- *"왜 768과 1024인가요?"* → 과제 지정값이기도 하고, 태블릿 세로 폭(768px)과 태블릿 가로·작은 노트북 폭(1024px)의 관례적인 기준입니다.
- *"min-width와 max-width 차이는?"* → `min-width`는 '이 너비 **이상**이면 추가 적용'이라 모바일 퍼스트, `max-width`는 '이 너비 **이하**면 적용'이라 데스크톱 퍼스트에서 주로 씁니다.
- *"768px 블록에서도 메뉴를 되돌리던데요?"*([css/style.css#L1337-L1348](../css/style.css#L1337-L1348)) → 맞습니다. 햄버거 드롭다운처럼 **모바일에만 있는 UI**는 어느 방식이든 한쪽에서 되돌려야 합니다(position·padding·background·border·box-shadow·opacity·visibility·transform 8개). 대신 열 수·여백은 늘리는 방향으로만 추가했고(스킬 1→2→4열, 좌우 여백 16→24px), `max-width` 쿼리는 0개입니다.
- *"viewport meta는 왜 필요한가요?"*([index.html#L5](../index.html#L5)) → 없으면 모바일 브라우저가 약 980px 폭으로 그린 뒤 축소해서 보여 주므로 미디어 쿼리가 의도대로 안 걸립니다.
- *"1024 블록이 768 블록 아래 있어야 하는 이유는?"* → 1024px 이상에서는 두 블록이 모두 적용되고 명시도가 같아서, 나중에 선언한 규칙이 이깁니다. 순서가 바뀌면 스킬이 4열이 아니라 2열로 남습니다.

---

## 항목 5. 보너스 과제

네 개 모두 구현했습니다.

| 보너스 | 시연 방법 | 코드 |
|---|---|---|
| 1. 언어별 필터 | Projects의 `C#`, `Python` 등 버튼 클릭 → 해당 언어 카드만 보이고 개수 표시 변경. `전체`로 복귀 | [js/projects.js#L68](../js/projects.js#L68) `filter()`, [#L271](../js/projects.js#L271) |
| 2. 타이핑 효과 | Hero의 역할 문구가 한 글자씩 써지고 지워지며 4개 문구 반복 | [js/effects.js#L51](../js/effects.js#L51) `runTypingEffect` |
| 3. Formspree 실제 전송 | 폼 제출 → 성공 메시지 → **실제 메일 수신**(받은 메일 화면을 보여 주면 확실) | [index.html#L317](../index.html#L317), [js/contact.js#L115](../js/contact.js#L115) `sendMessage` |
| 4. 시스템 다크 모드 감지 | 아래 순서 참고 | [js/theme.js#L39](../js/theme.js#L39), [#L68](../js/theme.js#L68) |

**4번(시스템 다크 모드) 시연 순서.** 사용자가 직접 고른 값이 **우선**이라, 먼저 저장값을 지워야 합니다.
1. `F12` → **Application** → **Local Storage** → `theme` 항목 삭제 → `F5`(이제 OS 설정을 따른다)
2. `Ctrl`+`Shift`+`P` → `Show Rendering` 입력(또는 DevTools ⋮ → More tools → Rendering) → **Emulate CSS media feature prefers-color-scheme**을 **지금 화면과 반대**로(라이트면 `dark`). 같은 값을 고르면 변화가 없어 보인다.
3. 새로고침 없이 바로 바뀐다(OS 설정 변화를 실시간으로 감지). 다시 반대로 바꾸면 되돌아온다.
4. 시연 중 토글 버튼을 누르면 값이 다시 저장되어 OS를 따르지 않으므로, 다시 하려면 1번부터.

> "처음 방문해서 아직 고른 적이 없으면 OS 설정을 따르고, 한 번이라도 버튼을 누르면 그 선택을 저장해서 우선합니다. 저장값이 없을 때는 `matchMedia`의 `change` 이벤트로 OS 설정이 바뀌는 것도 실시간으로 따라갑니다."

---

## 막혔을 때 답하는 법

- **모르는 것을 아는 척하지 않기**: "그 부분은 정확히 모르겠습니다. 제가 확인한 건 여기까지입니다" 하고 **코드를 열어 같이 보기**. 코드 위치를 아는 것 자체가 좋은 답입니다.
- **한 문장 결론부터**: 질문을 받으면 먼저 "네, ~ 때문입니다"로 시작하고 코드로 보여 줍니다.
- **흐름 질문은 전부 같은 모양**: 어떤 기능이든 "이벤트 → `setXxx`로 상태 변경 → `renderXxx`로 화면 갱신"으로 설명할 수 있습니다. 다크 모드(`theme.js`)가 가장 짧으니 헷갈리면 그것으로 설명하세요.
- 더 많은 질문: [QNA.md](QNA.md) (110문항) · 개념 복습: [CONCEPTS.md](CONCEPTS.md)
