'use client';
import { useId, useState } from 'react';
import type { ReactNode, SubmitEvent } from 'react';
import Image from 'next/image';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import {
  AGE_OPTIONS,
  LOGIN_ID_PATTERN,
  NICKNAME_MAX_LENGTH,
  PASSWORD_PATTERN,
} from '@/constants/signup';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import type { DuplicateField, DuplicateStatus } from '@/hooks/useDuplicateCheck';

type SignupType = 'local' | 'social';

interface SignupFormProps {
  // local: 자체 회원가입, social: 소셜 첫 로그인 후 추가 정보 입력
  type: SignupType;
}

interface FieldMessage {
  text: string;
  tone: 'success' | 'error';
}

const DUPLICATE_MESSAGES: Record<DuplicateField, Partial<Record<DuplicateStatus, FieldMessage>>> = {
  loginId: {
    available: { text: '사용 가능한 아이디예요', tone: 'success' },
    taken: { text: '이미 사용 중인 아이디예요', tone: 'error' },
    error: { text: '중복확인에 실패했어요. 다시 시도해 주세요', tone: 'error' },
  },
  nickname: {
    available: { text: '사용 가능한 닉네임이에요', tone: 'success' },
    taken: { text: '이미 사용 중인 닉네임이에요', tone: 'error' },
    error: { text: '중복확인에 실패했어요. 다시 시도해 주세요', tone: 'error' },
  },
};

// 처음 확인하거나, 실패한 뒤 다시 시도할 때만 중복확인 가능
const canRequestCheck = (status: DuplicateStatus) => status === 'idle' || status === 'error';

export default function SignupForm({ type }: SignupFormProps) {
  const isLocal = type === 'local';

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');

  const trimmedNickname = nickname.trim();
  const loginIdCheck = useDuplicateCheck('loginId', loginId);
  const nicknameCheck = useDuplicateCheck('nickname', trimmedNickname);

  const isLoginIdFormatValid = LOGIN_ID_PATTERN.test(loginId);
  const isPasswordValid = PASSWORD_PATTERN.test(password);
  const isLoginIdInvalid = loginId !== '' && !isLoginIdFormatValid;
  const isPasswordInvalid = password !== '' && !isPasswordValid;
  const isPasswordMismatch = passwordConfirm !== '' && password !== passwordConfirm;
  const isNicknameTooLong = trimmedNickname.length > NICKNAME_MAX_LENGTH;
  const isNicknameFormatValid = trimmedNickname !== '' && !isNicknameTooLong;

  const isAccountValid =
    loginIdCheck.status === 'available' && isPasswordValid && password === passwordConfirm;
  const isProfileValid = name.trim() !== '' && nicknameCheck.status === 'available' && age !== '';
  const canSubmit = isProfileValid && (!isLocal || isAccountValid);

  const loginIdMessage: FieldMessage | undefined = isLoginIdInvalid
    ? { text: '4~20자의 영문, 숫자로 입력해 주세요', tone: 'error' }
    : DUPLICATE_MESSAGES.loginId[loginIdCheck.status];

  const nicknameMessage: FieldMessage | undefined = isNicknameTooLong
    ? { text: `닉네임은 ${NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요`, tone: 'error' }
    : DUPLICATE_MESSAGES.nickname[nicknameCheck.status];

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    // TODO(API 연동) 전송 값: loginId, password, nickname(trimmedNickname), age(Number), gender
    // 명세와 차이: name은 명세에 없어 전송하지 않음, gender는 명세상 필수지만 아직 입력 UI 없음
    // local: 회원가입 요청 → 로그인 화면으로 이동
    // social: 임시 가입 토큰과 함께 추가 정보 전송 → 토큰 저장 → 광장으로 이동
  };

  return (
    <section className="flex w-[480px] flex-col items-center gap-7 rounded-[20px] border-3 border-b-8 border-brown-dark bg-ivory p-10">
      <h1 className="w-full text-[32px] text-black">회원가입</h1>

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-7">
        {isLocal && (
          <div className="flex w-full flex-col gap-3.5">
            <Field message={loginIdMessage}>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  aria-label="아이디"
                  placeholder="아이디"
                  autoComplete="username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value.replace(/\s/g, ''))}
                  suffix={
                    <DuplicateCheckButton
                      label="아이디 중복확인"
                      pending={loginIdCheck.status === 'pending'}
                      disabled={!isLoginIdFormatValid || !canRequestCheck(loginIdCheck.status)}
                      onClick={loginIdCheck.check}
                    />
                  }
                />
              )}
            </Field>
            <Field
              message={
                isPasswordInvalid
                  ? { text: '영문, 특수문자를 포함해 8~20자로 입력해 주세요', tone: 'error' }
                  : undefined
              }
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="password"
                  aria-label="비밀번호"
                  placeholder="비밀번호 (영문, 특수문자 포함 8~20자)"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </Field>
            <Field
              message={
                isPasswordMismatch
                  ? { text: '비밀번호가 일치하지 않아요', tone: 'error' }
                  : undefined
              }
            >
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="password"
                  aria-label="비밀번호 재입력"
                  placeholder="비밀번호 재입력"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              )}
            </Field>
          </div>
        )}

        <div className="flex w-full flex-col gap-3.5">
          <Input
            aria-label="이름"
            placeholder="이름"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field message={nicknameMessage}>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                aria-label="닉네임"
                placeholder="닉네임"
                autoComplete="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                suffix={
                  <DuplicateCheckButton
                    label="닉네임 중복확인"
                    pending={nicknameCheck.status === 'pending'}
                    disabled={!isNicknameFormatValid || !canRequestCheck(nicknameCheck.status)}
                    onClick={nicknameCheck.check}
                  />
                }
              />
            )}
          </Field>
          <label className="relative w-full">
            <span className="sr-only">나이</span>
            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`h-[57px] w-full cursor-pointer appearance-none rounded-[12px] border-3 border-brown-muted bg-white pr-14 pl-5 text-[20px] outline-none focus:border-brown-dark ${age === '' ? 'text-brown-light' : 'text-brown-muted focus:text-brown-dark'}`}
            >
              <option value="" disabled>
                나이
              </option>
              {AGE_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-brown-dark">
                  {option}세
                </option>
              ))}
            </select>
            <Image
              src="/assets/ui/bank-select-arrow.png"
              alt=""
              width={32}
              height={32}
              className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2"
            />
          </label>
        </div>

        <Button type="submit" variant="bank" size="empty" disabled={!canSubmit}>
          회원가입
        </Button>
      </form>
    </section>
  );
}

interface FieldControlProps {
  'aria-describedby': string;
  'aria-invalid': boolean;
}

function Field({
  message,
  children,
}: {
  message?: FieldMessage;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const messageId = useId();

  return (
    <div className="flex w-full flex-col">
      {children({
        'aria-describedby': messageId,
        'aria-invalid': message?.tone === 'error',
      })}
      <p
        id={messageId}
        aria-live="polite"
        className={`px-1 text-sm leading-[18px] ${message ? 'mt-[5px]' : ''} ${message?.tone === 'success' ? 'text-green' : 'text-red'}`}
      >
        {message?.text}
      </p>
    </div>
  );
}

function DuplicateCheckButton({
  label,
  pending,
  disabled,
  onClick,
}: {
  label: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={pending}
      disabled={disabled}
      onClick={onClick}
      className="shrink-0 rounded-[20px] bg-brown-dark px-3 py-1 text-[20px] text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brown-dark enabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-brown-muted"
    >
      {pending ? '확인 중' : '중복확인'}
    </button>
  );
}
