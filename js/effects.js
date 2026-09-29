/**
 * effects.js — 시각 효과
 *
 *  1. 스크롤 애니메이션: Intersection Observer로 .reveal 요소가 화면에 들어오면 나타나게 한다
 *  2. Hero 타이핑 효과 (보너스): 역할 문구를 한 글자씩 쓰고 지우기를 반복한다
 */


/* ---------- 1. 스크롤 애니메이션 ---------- */

// 요소가 20% 이상 보일 때 애니메이션 실행 (README에 명시한 기준값)
const REVEAL_THRESHOLD = 0.2;

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('revealed');
      observer.unobserve(target); // 한 번 나타난 요소는 더 이상 지켜보지 않는다 (성능)
    });
  },
  { threshold: REVEAL_THRESHOLD },
);

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));


/* ---------- 2. 타이핑 효과 ---------- */

const TYPING_WORDS = ['Indie Game Developer', 'Unity & Godot Creator', 'Game Jam Lover', 'Web Developer in Progress'];
const TYPE_DELAY = 90;     // 한 글자를 쓰는 간격(ms)
const ERASE_DELAY = 45;    // 한 글자를 지우는 간격(ms)
const HOLD_DELAY = 1800;   // 단어를 다 쓴 뒤 멈춰 있는 시간(ms)

const typingTarget = document.querySelector('.hero__typing');

const typeWord = async (word) => {
  for (let length = 1; length <= word.length; length += 1) {
    typingTarget.textContent = word.slice(0, length);
    await sleep(TYPE_DELAY);
  }
};

const eraseWord = async (word) => {
  for (let length = word.length - 1; length >= 0; length -= 1) {
    typingTarget.textContent = word.slice(0, length);
    await sleep(ERASE_DELAY);
  }
};

const runTypingEffect = async () => {
  // '동작 줄이기' 설정이면 HTML에 적힌 첫 문구를 그대로 둔다
  if (prefersReducedMotion()) return;

  let wordIndex = 0; // HTML에 첫 단어가 이미 적혀 있으므로 '지우기'부터 시작한다

  // await가 매번 제어권을 브라우저에 돌려주므로, 무한 반복이어도 화면이 멈추지 않는다
  while (true) {
    await sleep(HOLD_DELAY);
    await eraseWord(TYPING_WORDS[wordIndex]);
    wordIndex = (wordIndex + 1) % TYPING_WORDS.length;
    await typeWord(TYPING_WORDS[wordIndex]);
  }
};

runTypingEffect();
