import Image from 'next/image';
import LoginForm from '@/components/login/LoginForm';

// TODO: 로딩 UI 브랜치 머지 후 LOADING_SCENES.login.backgroundImage로 교체
const LOGIN_BG = '/assets/backgrounds/login-bg.png';

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center [image-rendering:pixelated]"
      style={{ backgroundImage: `url(${LOGIN_BG})` }}
    >
      <Image
        src="/assets/ui/logo-sub.png"
        alt="MoaMoa"
        width={201}
        height={58}
        priority
        className="absolute top-[60px] left-20 [image-rendering:auto]"
      />
      <LoginForm />
    </main>
  );
}
