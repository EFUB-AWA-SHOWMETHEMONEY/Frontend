import {
  ENTRANCE_RADIUS,
  PLAYER_FOOT,
  PLAZA_BLOCKED,
  PLAZA_ENTRANCES,
  PLAZA_SPAWN_ID,
  PLAZA_WALKABLE,
  type PlazaEntrance,
  type PlazaRect,
} from '@/constants/plaza';

const inRect = (px: number, py: number, r: PlazaRect) =>
  px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

const isWalkablePoint = (px: number, py: number) =>
  PLAZA_WALKABLE.some((r) => inRect(px, py, r)) && !PLAZA_BLOCKED.some((r) => inRect(px, py, r));

export function canStandAt(x: number, y: number) {
  const half = PLAYER_FOOT.w / 2;
  return (
    isWalkablePoint(x - half, y) &&
    isWalkablePoint(x + half, y) &&
    isWalkablePoint(x - half, y - PLAYER_FOOT.h) &&
    isWalkablePoint(x + half, y - PLAYER_FOOT.h)
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
