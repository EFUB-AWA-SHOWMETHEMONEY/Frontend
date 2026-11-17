import { createStore } from 'zustand/vanilla';
import { CHAT_HISTORY_LIMIT } from '@/constants/plaza';
import type { ChatMessageEvent, PlazaEvent, PlazaParticipant } from '@/types/socket';

interface PlazaState {
  participants: Record<number, PlazaParticipant>;
  myMemberId: number | null;
  messages: ChatMessageEvent[];
  setParticipants: (list: PlazaParticipant[]) => void;
  setMyMemberId: (memberId: number) => void;
  applyEvent: (event: PlazaEvent) => void;
  reset: () => void;
}

export const plazaStore = createStore<PlazaState>()((set) => ({
  participants: {},
  myMemberId: null,
  messages: [],
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
        case 'chat_message':
          return { messages: [...state.messages, event].slice(-CHAT_HISTORY_LIMIT) };
        default:
          return state;
      }
    }),
  reset: () => set({ participants: {}, myMemberId: null, messages: [] }),
}));
