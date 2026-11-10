import { createStore } from 'zustand/vanilla';
import type { PlazaEvent, PlazaParticipant } from '@/types/socket';

interface PlazaState {
  participants: Record<number, PlazaParticipant>;
  myMemberId: number | null;
  setParticipants: (list: PlazaParticipant[]) => void;
  setMyMemberId: (memberId: number) => void;
  applyEvent: (event: PlazaEvent) => void;
  reset: () => void;
}

export const plazaStore = createStore<PlazaState>()((set) => ({
  participants: {},
  myMemberId: null,
  setParticipants: (list) =>
    set({ participants: Object.fromEntries(list.map((p) => [p.memberId, p])) }),
  setMyMemberId: (memberId) => set({ myMemberId: memberId }),
  applyEvent: (event) =>
    set((state) => {
      const { participants } = state;
      switch (event.type) {
        case 'user_joined': {
          const { memberId, nickname, equippedItem, x, y } = event;
          return {
            participants: {
              ...participants,
              [memberId]: { memberId, nickname, equippedItem, x, y },
            },
          };
        }
        case 'user_left': {
          const rest = { ...participants };
          delete rest[event.memberId];
          return { participants: rest };
        }
        case 'position_update':
        case 'equipment_update': {
          const current = participants[event.memberId];
          if (!current) return state;
          const next =
            event.type === 'position_update'
              ? { ...current, x: event.x, y: event.y }
              : { ...current, equippedItem: event.equippedItem };
          return { participants: { ...participants, [event.memberId]: next } };
        }
        default:
          return state;
      }
    }),
  reset: () => set({ participants: {}, myMemberId: null }),
}));
