import Image from 'next/image';
import type { ReactNode } from 'react';

// TODO: 로딩 UI 브랜치 머지 후 LOADING_SCENES.login.backgroundImage로 교체
const AUTH_BG = '/assets/backgrounds/login-bg.png';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center">
      <Image
        src={AUTH_BG}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover [image-rendering:pixelated]"
      />
      <Image
        src="/assets/ui/logo-sub.png"
        alt="MoaMoa"
        width={201}
        height={58}
        priority
        className="absolute top-[60px] left-20"
      />
      {children}
    </main>
  );
}
