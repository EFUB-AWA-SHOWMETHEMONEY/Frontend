'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUILDING_ROUTES, PLAYER_SPEED, PLAZA_RETURN_KEY } from '@/constants/plaza';
import { findEntranceAt, getSpawnPoint, moveWithCollision } from '@/utils/plaza';

const KEY_DIRECTIONS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// StrictMode에서 effect가 두 번 돌아서, 읽을 때 지우지 않고 첫 이동 때 지운다
const readReturnId = () => {
  try {
    return sessionStorage.getItem(PLAZA_RETURN_KEY);
  } catch {
    return null;
  }
};

const writeReturnId = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(PLAZA_RETURN_KEY, id);
    else sessionStorage.removeItem(PLAZA_RETURN_KEY);
  } catch {
    return;
  }
};

export function usePlayerMovement() {
  const router = useRouter();
  const playerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const [pendingEntranceId, setPendingEntranceId] = useState<string | null>(null);

  useEffect(() => {
    const pressed = new Set<string>();
    const spawn = getSpawnPoint(readReturnId());
    positionRef.current = spawn;
    let armed = findEntranceAt(spawn.x, spawn.y) === null;
    let currentEntranceId: string | null = null;
    let leaving = false;
    let moved = false;
    let frame = 0;
    let last = performance.now();

    const render = () => {
      const el = playerRef.current;
      if (!el) return;
      const { x, y } = positionRef.current;
      el.style.setProperty('--x', String(x));
      el.style.setProperty('--y', String(y));
      el.style.zIndex = String(Math.round(y));
    };

    const checkEntrance = () => {
      const { x, y } = positionRef.current;
      const entrance = findEntranceAt(x, y);
      const id = entrance?.id ?? null;
      if (id === currentEntranceId) return;
      currentEntranceId = id;
      if (!id) {
        armed = true;
        setPendingEntranceId(null);
        return;
      }
      if (!armed) return;
      const route = BUILDING_ROUTES[id];
      if (!route) {
        setPendingEntranceId(id);
        return;
      }
      leaving = true;
      writeReturnId(id);
      router.push(route);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!leaving) {
        let dx = 0;
        let dy = 0;
        pressed.forEach((code) => {
          const dir = KEY_DIRECTIONS[code];
          if (dir) {
            dx += dir[0];
            dy += dir[1];
          }
        });
        if (dx !== 0 || dy !== 0) {
          if (!moved) {
            moved = true;
            writeReturnId(null);
          }
          const length = Math.hypot(dx, dy);
          const step = PLAYER_SPEED * dt;
          const { x, y } = positionRef.current;
          positionRef.current = moveWithCollision(x, y, (dx / length) * step, (dy / length) * step);
          render();
          checkEntrance();
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!KEY_DIRECTIONS[event.code] || isTyping(event.target)) return;
      event.preventDefault();
      pressed.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
    const onBlur = () => pressed.clear();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    render();
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [router]);

  return { playerRef, positionRef, pendingEntranceId };
}
