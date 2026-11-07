'use client';
import { useState } from 'react';
import type { SubmitEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

const LOGIN_MENUS = [
  { label: '아이디 찾기' },
  { label: '비밀번호 찾기' },
  { label: '회원가입', href: '/signup' },
] as const;

export default function LoginForm() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = loginId.trim() !== '' && password !== '';

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    // TODO(API 연동): 로그인 요청 → 토큰 저장 → 광장으로 이동
  };

  const handleKakaoLogin = () => {
    // TODO(API 연동): 카카오 로그인
  };

  return (
    <section className="flex w-[480px] flex-col items-center gap-7 rounded-[20px] border-3 border-b-8 border-brown-dark bg-ivory p-10">
      <h1 className="w-full text-[32px] text-black">로그인</h1>

      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-7">
        <div className="flex w-full flex-col gap-3.5">
          <Input
            aria-label="아이디"
            placeholder="아이디"
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
          <Input
            type="password"
            aria-label="비밀번호"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" variant="bank" size="empty" disabled={!canSubmit}>
          로그인
        </Button>
      </form>

      <nav aria-label="계정 메뉴">
        <ul className="flex items-center gap-5 text-xl text-brown-light">
          {LOGIN_MENUS.map((menu, index) => (
            <li key={menu.label} className="flex items-center gap-5">
              {index > 0 && <span aria-hidden="true" className="h-2.5 w-px bg-brown-light" />}
              {'href' in menu ? (
                <Link href={menu.href} className="hover:text-brown-muted">
                  {menu.label}
                </Link>
              ) : (
                <span>{menu.label}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={handleKakaoLogin}
        aria-label="카카오로 로그인"
        className="cursor-pointer rounded-full focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brown-dark"
      >
        <Image src="/assets/ui/kakao-logo.svg" alt="" width={60} height={60} />
      </button>
    </section>
  );
}
