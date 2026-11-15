import {
  ENTRANCE_RADIUS,
  NICKNAME_COLORS,
  PLAYER_FOOT,
  PLAZA_BLOCKED,
  PLAZA_ENTRANCES,
  PLAZA_SPAWN_ID,
  PLAZA_WALKABLE,
  type PlazaEntrance,
  type PlazaRect,
} from '@/constants/plaza';

export const px = (value: number) => `calc(${value}px * var(--s))`;

export const getNicknameColor = (memberId: number) =>
  NICKNAME_COLORS[memberId % NICKNAME_COLORS.length];

const inRect = (x: number, y: number, r: PlazaRect) =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const isWalkablePoint = (x: number, y: number) => PLAZA_WALKABLE.some((r) => inRect(x, y, r));

const overlaps = (a: PlazaRect, b: PlazaRect) =>
  a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;

export function canStandAt(x: number, y: number) {
  const half = PLAYER_FOOT.w / 2;
  const foot = { x: x - half, y: y - PLAYER_FOOT.h, w: PLAYER_FOOT.w, h: PLAYER_FOOT.h };
  return (
    isWalkablePoint(x - half, y) &&
    isWalkablePoint(x + half, y) &&
    isWalkablePoint(x - half, y - PLAYER_FOOT.h) &&
    isWalkablePoint(x + half, y - PLAYER_FOOT.h) &&
    !PLAZA_BLOCKED.some((r) => overlaps(foot, r))
  );
}

export function moveWithCollision(x: number, y: number, dx: number, dy: number) {
  let nx = x;
  let ny = y;
  if (dx !== 0 && canStandAt(x + dx, ny)) nx = x + dx;
  if (dy !== 0 && canStandAt(nx, y + dy)) ny = y + dy;
  return { x: nx, y: ny };
}

export function findEntranceAt(x: number, y: number): PlazaEntrance | null {
  return (
    PLAZA_ENTRANCES.find(
      (e) => e.id !== PLAZA_SPAWN_ID && Math.hypot(e.x - x, e.y - y) <= ENTRANCE_RADIUS,
    ) ?? null
  );
}

export function getSpawnPoint(returnId: string | null) {
  const entrance =
    PLAZA_ENTRANCES.find((e) => e.id === returnId) ??
    PLAZA_ENTRANCES.find((e) => e.id === PLAZA_SPAWN_ID)!;
  const x = entrance.id === PLAZA_SPAWN_ID ? entrance.x + 24 : entrance.x;
  for (let d = 0; d <= 6; d += 1) {
    if (canStandAt(x, entrance.y + d)) return { x, y: entrance.y + d };
    if (canStandAt(x, entrance.y - d)) return { x, y: entrance.y - d };
  }
  return { x, y: entrance.y };
}
