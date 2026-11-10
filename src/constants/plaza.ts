import layout from '../../public/assets/plaza/layout.json';

export interface PlazaRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlazaObject extends PlazaRect {
  id: string;
  label?: string;
  image: string;
  zY: number;
}

export interface PlazaEntrance {
  id: string;
  x: number;
  y: number;
}

export const PLAZA_IMAGE_DIR = '/assets/plaza/1x';
export const PLAZA_BACKGROUND = `${PLAZA_IMAGE_DIR}/${layout.background}`;
export const PLAZA_OBJECTS: PlazaObject[] = layout.objects;
export const PLAZA_WALKABLE: PlazaRect[] = layout.walkable;
export const PLAZA_ENTRANCES: PlazaEntrance[] = layout.entrances;

export const BUILDING_ROUTES: Record<string, string | null> = {
  trade: null,
  auction: null,
  shop: '/shop',
  bank: '/bank',
  myhome: '/my-home',
};

export const BUILDING_SIGNS: { id: string; x: number; y: number; size: number }[] = [
  { id: 'trade', x: 80, y: 38.5, size: 7 },
  { id: 'auction', x: 240, y: 56, size: 5 },
  { id: 'shop', x: 404, y: 36.5, size: 7 },
  { id: 'bank', x: 56, y: 172, size: 5 },
  { id: 'myhome', x: 430, y: 184, size: 5 },
];

export const PLAZA_BLOCKED: PlazaRect[] = [
  { x: 212, y: 170, w: 60, h: 36 }, // 분수
  { x: 178, y: 213, w: 20, h: 7 }, // 벤치 1
  { x: 282, y: 213, w: 20, h: 7 }, // 벤치 2
  { x: 106, y: 108, w: 6, h: 5 }, // 가로등 1
  { x: 370, y: 108, w: 6, h: 5 }, // 가로등 2
  { x: 122, y: 254, w: 6, h: 5 }, // 가로등 3
  { x: 370, y: 254, w: 6, h: 5 }, // 가로등 4
];

export const PLAYER_SPEED = 70;
export const PLAYER_FOOT = { w: 8, h: 3 };
export const PLAYER_SPRITE = { w: 16, h: 16 };
export const ENTRANCE_RADIUS = 7;
export const PLAZA_SPAWN_ID = 'plaza_in';
export const PLAZA_RETURN_KEY = 'moamoa-plaza-return';
