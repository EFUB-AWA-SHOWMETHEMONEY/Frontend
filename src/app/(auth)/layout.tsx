import Image from 'next/image';
import type { ReactNode } from 'react';
import { LOADING_SCENES } from '@/constants/loadingScenes';

const AUTH_BG = LOADING_SCENES.login.backgroundImage;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center gap-6 px-4 py-8">
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
        className="self-start min-[1080px]:absolute min-[1080px]:top-[60px] min-[1080px]:left-20"
      />
      <div className="my-auto">{children}</div>
    </main>
  );
}
