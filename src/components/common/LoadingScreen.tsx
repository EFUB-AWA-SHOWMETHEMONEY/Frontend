'use client';

import Image from 'next/image';
import ProgressBar from '@/components/common/ProgressBar';
import {
  MAIN_LOGO,
  LOADING_SCENES,
  type LoadingScene,
  type LoadingSceneKey,
} from '@/constants/loadingScenes';
import useFakeProgress from '@/hooks/useFakeProgress';

interface LoadingScreenProps {
  scene: LoadingSceneKey;
  progress?: number;
}

export default function LoadingScreen({ scene, progress }: LoadingScreenProps) {
  const {
    label,
    backgroundImage,
    fallbackColor,
    textClassName = 'text-white',
  }: LoadingScene = LOADING_SCENES[scene];
  const fakeProgress = useFakeProgress();
  const value = progress ?? fakeProgress;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-cover bg-center [image-rendering:pixelated]"
      style={{ backgroundColor: fallbackColor, backgroundImage: `url(${backgroundImage})` }}
    >
      <Image
        src={MAIN_LOGO}
        alt=""
        width={540}
        height={277}
        unoptimized
        priority
        className="h-auto max-w-[80vw] pb-7"
      />
      <ProgressBar value={value} />
      <p role="status" className={`${textClassName} text-[24px]`}>
        {label}으로 이동 중...
      </p>
    </div>
  );
}
