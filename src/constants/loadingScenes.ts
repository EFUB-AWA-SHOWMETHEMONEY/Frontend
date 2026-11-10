export interface LoadingScene {
  label: string; // 현재 받침있는 단어만 사용
  backgroundImage: string;
  fallbackColor: string;
  textClassName?: string;
}

export const MAIN_LOGO = '/assets/ui/logo-main.svg';

export const LOADING_SCENES = {
  login: {
    label: '로그인 화면',
    backgroundImage: '/assets/backgrounds/login-bg.png',
    fallbackColor: '#D2ECF6',
    textClassName: 'text-brown-muted',
  },
  'my-home': {
    label: '마이홈',
    backgroundImage: '/assets/backgrounds/my-home-bg.png',
    fallbackColor: '#93A6AD',
  },
  shop: {
    label: '상점',
    backgroundImage: '/assets/backgrounds/shop-bg.png',
    fallbackColor: '#9C7A58',
  },
  bank: {
    label: '은행',
    backgroundImage: '/assets/backgrounds/bank-bg.png',
    fallbackColor: '#A3AAA4',
  },
  auction: {
    label: '경매장',
    backgroundImage: '/assets/backgrounds/auction-bg.png',
    fallbackColor: '#292134',
  },
} as const satisfies Record<string, LoadingScene>;

export type LoadingSceneKey = keyof typeof LOADING_SCENES;
