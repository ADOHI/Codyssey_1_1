# 자동 검증 보고서

> `node scripts/verify.mjs` 가 자동으로 만든 보고서입니다. 직접 고치지 말고 스크립트를 다시 실행하세요.

- 실행 시각: 2026-09-29 07:05:32 UTC
- 브라우저: Chrome/154.0.8037.58 (headless, CDP) · Node.js v24.15.0
- 뷰포트: 375×812 · 768×1024 · 1024×768 · 1440×900
- 네트워크: api.github.com·formspree.io 요청은 모두 가로채 합성 데이터로 응답 (모의 응답 GitHub 18회 · Formspree 2회, 실제 요청 0건)
- 결과: **74 PASS / 0 FAIL** (총 74개, 7.0초)

| # | 그룹 | 검사 항목 | 결과 | 실패 이유 |
|---|---|---|---|---|
| 1 | A 정적 | JS: var 없이 const/let만 사용 | PASS |  |
| 2 | A 정적 | 인라인 이벤트 없음 (HTML on\*= 속성 · JS 템플릿 on\*= · el.onclick =) | PASS |  |
| 3 | A 정적 | style= 속성과 element.style 사용 없음 (스타일은 CSS 파일에서만) | PASS |  |
| 4 | A 정적 | 모든 &lt;script>에 defer (6개) | PASS |  |
| 5 | A 정적 | 모든 &lt;label for>가 실제 id와 연결됨 | PASS |  |
| 6 | A 정적 | 모든 &lt;img>에 비어 있지 않은 alt | PASS |  |
| 7 | A 정적 | 시맨틱 랜드마크 header·nav·main·section·article·footer 사용 | PASS |  |
| 8 | A 정적 | CSS: :root 디자인 토큰 + [data-theme="dark"] 재정의 블록 | PASS |  |
| 9 | A 정적 | 너비 미디어 쿼리는 min-width 768px · 1024px 두 개뿐 (모바일 퍼스트) | PASS |  |
| 10 | A 정적 | JS 6개를 이어 붙여도 전역 const/let 이름 중복 없음 | PASS |  |
| 11 | B 레이아웃 | 375px: 가로 스크롤(넘침) 없음 | PASS |  |
| 12 | B 레이아웃 | 375px: 햄버거 버튼 보임 / 메뉴 링크 숨김(닫힘) | PASS |  |
| 13 | B 레이아웃 | 375px: 프로젝트 카드 1열 | PASS |  |
| 14 | B 레이아웃 | 375px: 스킬 카드 1열 | PASS |  |
| 15 | B 레이아웃 | 768px: 가로 스크롤(넘침) 없음 | PASS |  |
| 16 | B 레이아웃 | 768px: 햄버거 버튼 숨김 / 메뉴 링크 보임 | PASS |  |
| 17 | B 레이아웃 | 768px: 프로젝트 카드 2열 | PASS |  |
| 18 | B 레이아웃 | 768px: 스킬 카드 2열 | PASS |  |
| 19 | B 레이아웃 | 1024px: 가로 스크롤(넘침) 없음 | PASS |  |
| 20 | B 레이아웃 | 1024px: 햄버거 버튼 숨김 / 메뉴 링크 보임 | PASS |  |
| 21 | B 레이아웃 | 1024px: 프로젝트 카드 3열 | PASS |  |
| 22 | B 레이아웃 | 1024px: 스킬 카드 4열 | PASS |  |
| 23 | B 레이아웃 | 1440px: 가로 스크롤(넘침) 없음 | PASS |  |
| 24 | B 레이아웃 | 1440px: 햄버거 버튼 숨김 / 메뉴 링크 보임 | PASS |  |
| 25 | B 레이아웃 | 1440px: 프로젝트 카드 3열 | PASS |  |
| 26 | B 레이아웃 | 1440px: 스킬 카드 4열 | PASS |  |
| 27 | C 상태 흐름 | 테마: 첫 방문(저장값 없음 · OS 라이트) → light로 시작 | PASS |  |
| 28 | C 상태 흐름 | 테마: 토글 클릭 → data-theme="dark" · aria-pressed="true" · localStorage 저장 | PASS |  |
| 29 | C 상태 흐름 | 테마: 새로고침해도 dark 유지 | PASS |  |
| 30 | C 상태 흐름 | 테마: localStorage 저장이 막혀도 테마는 바뀌고, 버튼 title로 "이번 방문에만 적용" 안내 | PASS |  |
| 31 | C 상태 흐름 | 테마: 저장값 없음 + OS 다크(prefers-color-scheme) → dark로 시작 | PASS |  |
| 32 | C 상태 흐름 | 스크롤 59px: 헤더 .scrolled 없음 | PASS |  |
| 33 | C 상태 흐름 | 스크롤 60px: 헤더 .scrolled 붙음 | PASS |  |
| 34 | C 상태 흐름 | 스크롤 299px: 맨 위로 버튼 .visible 없음 | PASS |  |
| 35 | C 상태 흐름 | 스크롤 300px: 맨 위로 버튼 .visible 붙음 | PASS |  |
| 36 | C 상태 흐름 | 스크롤 애니메이션: 끝까지 스크롤하면 모든 .reveal에 .revealed | PASS |  |
| 37 | C 상태 흐름 | 햄버거(키보드 Enter): 메뉴 열림 · aria-expanded="true" · 라벨 "메뉴 닫기" · 첫 링크로 포커스 | PASS |  |
| 38 | C 상태 흐름 | 햄버거: 열린 메뉴에서 Tab → 두 번째 링크로 이동 | PASS |  |
| 39 | C 상태 흐름 | 햄버거: Esc → 닫힘 · aria-expanded="false" · 라벨 "메뉴 열기" · 포커스가 햄버거 버튼으로 복귀 | PASS |  |
| 40 | C 상태 흐름 | 프로젝트: 합성 데이터 9개 중 포크 제외 8개 → 카드 6개 + 더 보기 버튼 | PASS |  |
| 41 | C 상태 흐름 | 프로젝트: 이름·설명의 XSS 페이로드가 글자로 표시되고 &lt;img>/&lt;script> 요소가 생기지 않음 | PASS |  |
| 42 | C 상태 흐름 | 프로젝트: homepage(http/https)가 있는 저장소에만 Demo 링크 | PASS |  |
| 43 | C 상태 흐름 | 프로젝트: C# 필터 클릭 → 3개로 줄고 aria-pressed="true" | PASS |  |
| 44 | C 상태 흐름 | 프로젝트: 전체 → 더 보기 클릭 → 8개 모두 표시, 버튼 숨김, 포크 저장소 없음 | PASS |  |
| 45 | C 상태 흐름 | ?demo=loading → "프로젝트를 불러오는 중..." + aria-busy="true" | PASS |  |
| 46 | C 상태 흐름 | ?demo=error → 에러 제목 + "다시 시도" · "GitHub에서 보기" 버튼 | PASS |  |
| 47 | C 상태 흐름 | ?demo=error → "다시 시도" 클릭 즉시 로딩 상태로 재진입 | PASS |  |
| 48 | C 상태 흐름 | ?demo=empty → "표시할 프로젝트가 없습니다." | PASS |  |
| 49 | C 상태 흐름 | API: 네트워크 끊김(Fetch.failRequest) → "네트워크에 연결할 수 없습니다…" 안내 | PASS |  |
| 50 | C 상태 흐름 | API: 네트워크 복구 후 "다시 시도" → 카드 목록 표시 | PASS |  |
| 51 | C 상태 흐름 | API: 403 + x-ratelimit-remaining: 0 → 요청 한도 초과 + "HH:MM 이후에 다시 시도" 안내 | PASS |  |
| 52 | C 상태 흐름 | 폼: 빈 채로 제출 → 에러 3개 표시 + 첫 칸(#contact-name)으로 포커스 | PASS |  |
| 53 | C 상태 흐름 | 폼: 입력 중(칸을 벗어나기 전)에는 에러를 보여 주지 않음 | PASS |  |
| 54 | C 상태 흐름 | 폼: 'abc@' 입력 후 focusout → 이메일 형식 에러 + aria-invalid="true" | PASS |  |
| 55 | C 상태 흐름 | 폼: 올바르게 고치면 입력 즉시 에러가 사라짐 | PASS |  |
| 56 | C 상태 흐름 | 폼: 올바른 값 제출(Formspree 200 모의) → 성공 문구 + 입력칸 초기화 | PASS |  |
| 57 | C 상태 흐름 | 폼: Formspree 500 모의 → 실패 문구 | PASS |  |
| 58 | C 상태 흐름 | 네트워크 격리: 허용 목록(로컬·Google Fonts) 밖으로 나간 요청 없음 | PASS |  |
| 59 | D 접근성 | 제목 구조: h1 정확히 1개, 단계 건너뛰기 없음 (h1→h2→h3) | PASS |  |
| 60 | D 접근성 | 모든 버튼·링크에 접근 가능한 이름 (텍스트 · aria-label · sr-only, 27개) | PASS |  |
| 61 | D 접근성 | 폼 입력칸마다 연결된 &lt;label> | PASS |  |
| 62 | D 접근성 | 메뉴 토글: aria-label · aria-expanded · aria-controls(→ 실제 #nav-menu) | PASS |  |
| 63 | D 접근성 | 스킵 링크: 첫 Tab에 포커스 + 화면에 나타남, href="#main" → main#main 존재 | PASS |  |
| 64 | D 접근성 | 스킵 링크: Enter → 키보드 포커스가 main으로 이동 | PASS |  |
| 65 | D 접근성 | 명암비 light · 본문 글자 / 배경 (#16161a / #ffffff) = 18.04:1 ≥ 4.5 | PASS |  |
| 66 | D 접근성 | 명암비 light · 보조 글자 / 배경 (#5b5b66 / #ffffff) = 6.70:1 ≥ 4.5 | PASS |  |
| 67 | D 접근성 | 명암비 light · 강조색 글자 / 배경 (#4353ff / #ffffff) = 5.36:1 ≥ 4.5 | PASS |  |
| 68 | D 접근성 | 명암비 light · 강조 버튼 글자 / 강조색 (#ffffff / #4353ff) = 5.36:1 ≥ 4.5 | PASS |  |
| 69 | D 접근성 | 명암비 light · 에러 글자 / 배경 (#b42318 / #ffffff) = 6.57:1 ≥ 4.5 | PASS |  |
| 70 | D 접근성 | 명암비 dark · 본문 글자 / 배경 (#ececf1 / #0e0f13) = 16.27:1 ≥ 4.5 | PASS |  |
| 71 | D 접근성 | 명암비 dark · 보조 글자 / 배경 (#a3a6b3 / #0e0f13) = 7.90:1 ≥ 4.5 | PASS |  |
| 72 | D 접근성 | 명암비 dark · 강조색 글자 / 배경 (#8c96ff / #0e0f13) = 7.23:1 ≥ 4.5 | PASS |  |
| 73 | D 접근성 | 명암비 dark · 강조 버튼 글자 / 강조색 (#0e0f13 / #8c96ff) = 7.23:1 ≥ 4.5 | PASS |  |
| 74 | D 접근성 | 명암비 dark · 에러 글자 / 배경 (#ff7a6e / #0e0f13) = 7.53:1 ≥ 4.5 | PASS |  |

## 스크린샷

- [bp-375.png](../images/screenshots/bp-375.png)
- [bp-768.png](../images/screenshots/bp-768.png)
- [bp-1024.png](../images/screenshots/bp-1024.png)
- [bp-1440.png](../images/screenshots/bp-1440.png)
- [state-network-error.png](../images/screenshots/state-network-error.png)
- [state-rate-limit.png](../images/screenshots/state-rate-limit.png)
