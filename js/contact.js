/**
 * contact.js — 문의 폼 유효성 검사 + 전송
 *
 * [상태 → 렌더링 흐름 ③]
 *   input  → values 상태 변경 ─┐
 *   focusout → touched 상태 변경 ├→ renderForm(): 에러 메시지 표시/숨김, 글자 수, 버튼, 결과 메시지
 *   submit → status 상태 변경 ─┘
 *
 * 에러 메시지는 values에서 계산되는 값(파생 값)이라 상태로 따로 저장하지 않는다.
 * → 값과 에러가 서로 어긋나는 버그가 생길 수 없다.
 */

const contactForm = document.querySelector('.contact-form');
const submitButton = contactForm.querySelector('.contact-form__submit');
const formStatus = contactForm.querySelector('.form-status');
const messageCounter = contactForm.querySelector('.message-counter');

const FIELD_NAMES = ['name', 'email', 'message'];
const NAME_MIN_LENGTH = 2;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 1000;
// 아이디@도메인.최상위도메인(2자 이상) — 도메인의 각 부분은 비어 있을 수 없다 (a@b..com, a@.com 거부)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;
const SEND_TIMEOUT = 10000;

// Formspree 주소는 index.html의 form action 한 곳에서만 관리한다
const isFormspreeReady = !contactForm.action.includes('YOUR_FORM_ID');


/* ---------- 검증 규칙: 값을 받아 에러 메시지를 돌려준다 (문제없으면 빈 문자열) ---------- */

const validators = {
  name: (value) => {
    if (!value) return '이름을 입력해 주세요.';
    if (value.length < NAME_MIN_LENGTH) return `이름은 ${NAME_MIN_LENGTH}자 이상 입력해 주세요.`;
    return '';
  },
  email: (value) => {
    if (!value) return '이메일을 입력해 주세요.';
    if (!EMAIL_PATTERN.test(value)) return '올바른 이메일 형식이 아닙니다. (예: name@example.com)';
    return '';
  },
  message: (value) => {
    if (!value) return '메시지를 입력해 주세요.';
    if (value.length < MESSAGE_MIN_LENGTH) return `메시지는 ${MESSAGE_MIN_LENGTH}자 이상 입력해 주세요.`;
    return '';
  },
};

// { name: '...', email: '...', message: '...' } → { name: '에러 또는 빈 문자열', ... }
const validateForm = (values) =>
  Object.fromEntries(FIELD_NAMES.map((field) => [field, validators[field](values[field].trim())]));

const createEmptyValues = () => ({ name: '', email: '', message: '' });
const createTouched = (isTouched) => ({ name: isTouched, email: isTouched, message: isTouched });
const readValuesFromInputs = () =>
  Object.fromEntries(FIELD_NAMES.map((field) => [field, contactForm.elements[field].value]));


/* ---------- 상태 ---------- */

let formState = {
  values: createEmptyValues(),
  touched: createTouched(false), // 한 번이라도 벗어난(또는 제출한) 필드만 에러를 보여 준다
  status: 'idle',                // 'idle' | 'submitting' | 'success' | 'error'
};

const setFormState = (changes) => {
  formState = { ...formState, ...changes };
  renderForm();
};

const STATUS_MESSAGES = {
  idle: '',
  submitting: '',
  success: isFormspreeReady
    ? '메시지가 전송되었습니다. 확인 후 답장드릴게요. 감사합니다!'
    : '메시지가 접수되었습니다! (데모 모드라 실제 메일은 전송되지 않았어요. 급한 연락은 이메일로 부탁드립니다.)',
  error: '전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락해 주세요.',
};


/* ---------- 렌더 ---------- */

const renderForm = () => {
  const { values, touched, status } = formState;
  const errors = validateForm(values);
  const isSubmitting = status === 'submitting';

  // 필드별 에러 메시지 표시/숨김 + 빨간 테두리 + 스크린 리더용 aria-invalid
  FIELD_NAMES.forEach((field) => {
    const input = contactForm.elements[field];
    const errorElement = contactForm.querySelector(`#contact-${field}-error`);
    const message = touched[field] ? errors[field] : '';

    errorElement.textContent = message;
    input.classList.toggle('invalid', message !== '');
    input.setAttribute('aria-invalid', String(message !== ''));
    input.readOnly = isSubmitting; // 전송 중에 고친 내용이 초기화로 사라지지 않도록 잠근다
  });

  messageCounter.textContent = `${values.message.length} / ${MESSAGE_MAX_LENGTH}`;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? '전송 중...' : '메시지 보내기';

  formStatus.textContent = STATUS_MESSAGES[status];
  formStatus.classList.toggle('success', status === 'success');
  formStatus.classList.toggle('error', status === 'error');
};


/* ---------- 전송 ---------- */

const sendMessage = async (formData) => {
  if (!isFormspreeReady) {
    // Formspree 주소를 아직 설정하지 않았다면 실제 전송 없이 '전송 중 → 성공' 흐름만 보여 준다
    await sleep(800);
    console.info('[Contact] 데모 모드: form action에 Formspree 주소를 넣으면 실제로 전송됩니다.');
    return;
  }

  const response = await fetch(contactForm.action, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' }, // JSON으로 응답받아 페이지 이동 없이 결과만 확인
    signal: AbortSignal.timeout(SEND_TIMEOUT),
  });

  if (!response.ok) throw new Error(`Formspree 응답 오류 (HTTP ${response.status})`);
};


/* ---------- 이벤트 ---------- */

// input: 글자를 입력할 때마다 값 상태를 갱신 → 에러가 보이던 필드는 고치는 즉시 에러가 사라진다
contactForm.addEventListener('input', (event) => {
  const { name, value } = event.target;
  if (!FIELD_NAMES.includes(name)) return;

  setFormState({
    values: { ...formState.values, [name]: value }, // [name]: 계산된 속성 이름
    status: formState.status === 'submitting' ? 'submitting' : 'idle', // 새로 입력하면 이전 결과 메시지는 지운다
  });
});

// focusout: 필드를 벗어나면 그때부터 해당 필드의 에러를 보여 준다 (입력 도중에 미리 재촉하지 않기)
contactForm.addEventListener('focusout', (event) => {
  const { name } = event.target;
  if (!FIELD_NAMES.includes(name) || formState.touched[name]) return;

  setFormState({ touched: { ...formState.touched, [name]: true } });
});

// submit: 기본 제출을 막고 → 전체 검증 → 통과하면 전송
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // 페이지 이동(새로고침)을 막고 JS로 직접 처리한다
  if (formState.status === 'submitting') return; // 중복 제출 방지

  // 제출 시에는 모든 필드를 '건드린' 것으로 보고 에러를 한꺼번에 보여 준다
  const values = readValuesFromInputs();
  setFormState({ values, touched: createTouched(true), status: 'idle' });

  const errors = validateForm(values);
  const firstInvalidField = FIELD_NAMES.find((field) => errors[field]);
  if (firstInvalidField) {
    contactForm.elements[firstInvalidField].focus(); // 첫 번째로 잘못된 칸으로 커서 이동
    return;
  }

  setFormState({ status: 'submitting' });

  try {
    await sendMessage(new FormData(contactForm));
    contactForm.reset();
    setFormState({ values: createEmptyValues(), touched: createTouched(false), status: 'success' });
  } catch (error) {
    console.error('[Contact] 메시지 전송에 실패했습니다.', error);
    setFormState({ status: 'error' });
  }

  // 전송 중 버튼이 비활성화되며 포커스가 사라졌다면 버튼으로 되돌린다 (키보드·스크린 리더 사용자 배려)
  if (document.activeElement === document.body) submitButton.focus();
});

// 첫 렌더
renderForm();
