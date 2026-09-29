/**
 * utils.js — 여러 파일에서 함께 쓰는 작은 도우미 함수
 *
 * <script defer>로 연결한 일반 스크립트들은 "전역 스코프"를 공유한다.
 * 그래서 같은 이름을 두 파일에서 const로 선언하면 에러가 나므로,
 * 여러 곳에서 쓰는 함수는 이 파일 한 곳에만 선언하고 가장 먼저 불러온다(index.html 참고).
 */

// 지정한 시간(ms)만큼 기다리는 Promise를 돌려준다 → await sleep(1000) 처럼 사용
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 사용자가 OS 설정에서 '애니메이션 줄이기'를 켰는지 확인한다
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
