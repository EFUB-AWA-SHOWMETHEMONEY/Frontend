import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { bankProductGroups } from '../constants/bank';
import { createMockBankSubscription, type MockBankSubscription } from '../utils/bank';
import { mockMemberAccount } from '../constants/member';
import { createShopState, type ShopState } from './shopStore';

interface MemberState extends ShopState {
  nickname: string;
  savings: number;
  subscriptions: (MockBankSubscription & { requestId: string })[];
  hydrated: boolean;
  finishHydration: () => void;
  subscribeToBank: (
    productId: string,
    amount: number,
    months: number,
    requestId: string,
  ) => boolean;
}

/** One mock ledger keeps the member balance, inventory and savings consistent. */
export const createMemberStore = (storage?: StateStorage) => {
  const backingStorage: StateStorage = {
    getItem: (name) => {
      const source = storage ?? localStorage;
      // Import the previous bank ledger only when no shared ledger has been saved.
      return Promise.resolve(source.getItem(name)).then(async (saved) => {
        if (saved !== null) return saved;
        return source.getItem('moamoa-bank-mock-v1');
      });
    },
    setItem: (name, value) => (storage ?? localStorage).setItem(name, value),
    removeItem: (name) => (storage ?? localStorage).removeItem(name),
  };
  return createStore<MemberState>()(
    persist(
      (set, get, api) => {
        const shop = createShopState(set, get, api);
        return {
          ...shop,
          nickname: mockMemberAccount.nickname,
          savings: mockMemberAccount.savings,
          subscriptions: [],
          hydrated: false,
          finishHydration: () => set({ hydrated: true }),
          purchase: (id) =>
            get().hydrated ? shop.purchase(id) : { ok: false, reason: 'not-ready' },
          sell: (id) => (get().hydrated ? shop.sell(id) : { ok: false, reason: 'not-ready' }),
          subscribeToBank: (productId, amount, months, requestId) => {
            const state = get();
            if (
              !state.hydrated ||
              !requestId ||
              state.subscriptions.some((s) => s.requestId === requestId)
            )
              return false;
            const product = bankProductGroups
              .flatMap((g) => g.products)
              .find((p) => p.id === productId);
            if (!product) return false;
            const subscription = createMockBankSubscription(product, amount, months, state.balance);
            if (!subscription) return false;
            set({
              balance: state.balance - amount,
              savings: state.savings + amount,
              subscriptions: [...state.subscriptions, { ...subscription, requestId }],
            });
            return true;
          },
        };
      },
      {
        name: 'moamoa-member-mock-v1',
        version: 1,
        storage: createJSONStorage(() => backingStorage),
        skipHydration: true,
        onRehydrateStorage: () => (state, error) => {
          if (!error) state?.finishHydration();
        },
        partialize: ({ balance, savings, subscriptions, inventory, nextInstanceId }) => ({
          balance,
          savings,
          subscriptions,
          inventory,
          nextInstanceId,
        }),
      },
    ),
  );
};

export const memberStore = createMemberStore();
let hydration: Promise<void> | undefined;
export function hydrateMemberStore() {
  return (hydration ??= Promise.resolve(memberStore.persist.rehydrate()));
}
