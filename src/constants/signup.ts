// TODO: 서비스 정책에 맞게 나이 범위 확정
export const AGE_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

// 영문, 숫자만 사용한 4~20자. 중복은 서버에서 대소문자 구분 없이 판단
export const LOGIN_ID_PATTERN = /^[A-Za-z0-9]{4,20}$/;

// 앞뒤 공백을 뺀 길이 기준
export const NICKNAME_MAX_LENGTH = 10;

// TODO: 특수문자 범위 키보드 특수문자로 제한(임시). 서버와 범위 확인 필요
const PASSWORD_SPECIAL_CHARS = '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?`~';
const escapedSpecialChars = PASSWORD_SPECIAL_CHARS.replace(/[\]\\^-]/g, '\\$&');

// 영문, 특수문자를 각각 1개 이상 포함한 8~20자 (숫자 허용)
export const PASSWORD_PATTERN = new RegExp(
  `^(?=.*[A-Za-z])(?=.*[${escapedSpecialChars}])[A-Za-z0-9${escapedSpecialChars}]{8,20}$`,
);
