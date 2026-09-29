/**
 * layout.js — 헤더·네비게이션·스크롤 관련 인터랙션
 *
 *  1. 햄버거 메뉴 토글          (click, keydown)
 *  2. 부드러운 스크롤           (click + preventDefault)
 *  3. 헤더 배경 변경 / 스크롤 탑 버튼 표시 (scroll)
 *  4. 스크롤 탑 버튼 클릭       (click)
 *  5. 현재 보고 있는 섹션을 메뉴에 표시 (IntersectionObserver)
 *  6. 푸터 연도 자동 갱신       (textContent)
 */

// 기준값 (README에 명시)
const HEADER_SCROLL_THRESHOLD = 60;  // 이 값(px) 이상 스크롤하면 헤더 배경이 바뀐다
const SCROLL_TOP_THRESHOLD = 300;    // 이 값(px) 이상 스크롤하면 '맨 위로' 버튼이 나타난다

const siteHeader = document.querySelector('.header');
const navMenu = document.querySelector('.nav__menu');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav__link');
const scrollTopButton = document.querySelector('.scroll-top');

// 스크롤 애니메이션 방식: '동작 줄이기' 설정이면 즉시 이동
const getScrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');


/* ---------- 1. 햄버거 메뉴 ---------- */

// 메뉴가 열렸는지/닫혔는지에 맞춰 버튼의 모양과 접근성 속성을 맞춘다
const syncNavToggle = (isOpen) => {
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
};

const closeNavMenu = () => {
  navMenu.classList.remove('active');
  syncNavToggle(false);
};

navToggle.addEventListener('click', () => {
  // classList.toggle은 클래스를 붙였다 뗐다 하고, 결과(붙었으면 true)를 돌려준다
  const isOpen = navMenu.classList.toggle('active');
  syncNavToggle(isOpen);
  // 메뉴는 HTML에서 버튼보다 앞에 있으므로, 열자마자 첫 링크로 포커스를 옮겨 Tab 순서를 자연스럽게 한다
  if (isOpen) navMenu.querySelector('.nav__link').focus();
});

// 메뉴를 연 채로 화면이 768px 이상이 되면(예: 휴대폰 가로 회전) 메뉴 상태를 초기화한다
window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
  if (event.matches) closeNavMenu();
});

// Esc 키로 메뉴 닫기 (키보드 사용자 배려)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navMenu.classList.contains('active')) {
    closeNavMenu();
    navToggle.focus();
  }
});

// 메뉴 바깥을 클릭하면 닫기
document.addEventListener('click', (event) => {
  if (navMenu.classList.contains('active') && !event.target.closest('.header')) {
    closeNavMenu();
  }
});


/* ---------- 2. 부드러운 스크롤 ---------- */

// 페이지 안으로 이동하는 모든 링크(href="#...")에 적용: 메뉴, 로고, Hero 버튼, 본문 바로가기
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href');
    const target = targetId.length > 1 ? document.querySelector(targetId) : null;
    if (!target) return;

    event.preventDefault(); // 기본 동작(순간 이동)을 막고 직접 부드럽게 이동시킨다
    target.scrollIntoView({ behavior: getScrollBehavior() });
    // 주소창에도 #섹션 반영 (뒤로 가기 지원). 같은 링크를 또 누르면 기록을 쌓지 않고 교체한다
    if (location.hash === targetId) history.replaceState(null, '', targetId);
    else history.pushState(null, '', targetId);

    // 키보드·스크린 리더 사용자를 위해 포커스도 이동한 섹션으로 옮긴다
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });

    closeNavMenu(); // 모바일에서 메뉴를 누르면 메뉴를 닫는다
  });
});


/* ---------- 3. 스크롤 이벤트: 헤더 배경 + 스크롤 탑 버튼 ---------- */

const handleScroll = () => {
  const { scrollY } = window; // 구조분해 할당: window.scrollY를 꺼낸다
  siteHeader.classList.toggle('scrolled', scrollY >= HEADER_SCROLL_THRESHOLD);
  scrollTopButton.classList.toggle('visible', scrollY >= SCROLL_TOP_THRESHOLD);
};

// passive: true → 이 리스너는 preventDefault로 스크롤을 막지 않는다는 표시 (scroll은 원래 취소할 수 없어 효과보다 의도 표시)
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll(); // 새로고침 후 스크롤 위치가 복원된 경우에도 올바른 상태로 시작


/* ---------- 4. 스크롤 탑 버튼 ---------- */

scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: getScrollBehavior() });
  // 버튼이 곧 사라지므로 키보드 포커스를 페이지 맨 위(로고)로 옮긴다
  document.querySelector('.logo').focus({ preventScroll: true });
});


/* ---------- 5. 현재 섹션을 메뉴에 표시 ---------- */

// 화면 세로 중앙 부근(위 45% ~ 아래 50%를 뺀 띠)에 들어온 섹션을 '현재 섹션'으로 본다
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute('href') === `#${target.id}`;
        link.classList.toggle('current', isCurrent);
        if (isCurrent) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  },
  { rootMargin: '-45% 0px -50% 0px' },
);

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));


/* ---------- 6. 푸터 연도 ---------- */

document.querySelector('.footer__year').textContent = new Date().getFullYear();
