/**
 * theme.js — 다크 모드
 *
 * [상태 → 렌더링 흐름 ①]
 *   토글 버튼 click → currentTheme 상태 변경 → renderTheme()가 <html data-theme="..."> 갱신
 *   → CSS의 [data-theme="dark"] 변수들이 적용되어 페이지 전체 색이 바뀐다.
 *
 * 처음 테마를 정하는 우선순위
 *   1) 사용자가 직접 골라 localStorage에 저장한 값
 *   2) 저장한 값이 없으면 OS 설정 (prefers-color-scheme)  ← 보너스 과제
 *   3) 둘 다 해당 없으면 light
 */

const THEME_STORAGE_KEY = 'theme';
const themeToggle = document.querySelector('.theme-toggle');
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// localStorage는 시크릿 모드나 저장소 차단 환경에서 에러를 던질 수 있으므로 try/catch로 감싼다
const readSavedTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    themeToggle.title = '이 브라우저에서는 테마 설정을 저장할 수 없어 이번 방문에만 적용됩니다.'; // 저장 불가(시크릿·저장소 차단) 안내
  }
};

const getSystemTheme = () => (systemDarkQuery.matches ? 'dark' : 'light');

// ---------- 상태 ----------
let currentTheme = readSavedTheme() ?? getSystemTheme();

// ---------- 렌더: 상태를 화면(DOM)에 반영 ----------
const renderTheme = () => {
  document.documentElement.setAttribute('data-theme', currentTheme);
  // 토글 버튼이 '눌린 상태(다크 모드 켜짐)'인지 스크린 리더에도 알려 준다
  themeToggle.setAttribute('aria-pressed', String(currentTheme === 'dark'));
};

// ---------- 상태 변경: 테마는 반드시 이 함수로만 바꾼다 (React의 setState 역할) ----------
const setTheme = (nextTheme, { save = false } = {}) => {
  currentTheme = nextTheme;
  if (save) saveTheme(nextTheme);
  renderTheme();
};

// ---------- 이벤트 ----------
themeToggle.addEventListener('click', () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // View Transitions API를 지원하면 화면 전체가 부드럽게 바뀌고, 아니면 즉시 바뀐다
  if (document.startViewTransition && !prefersReducedMotion()) {
    document.startViewTransition(() => setTheme(nextTheme, { save: true }));
  } else {
    setTheme(nextTheme, { save: true });
  }
});

// 사용자가 직접 고른 적이 없을 때만 OS 테마 변경을 실시간으로 따라간다
systemDarkQuery.addEventListener('change', () => {
  if (readSavedTheme() === null) setTheme(getSystemTheme());
});

// 첫 렌더
renderTheme();
