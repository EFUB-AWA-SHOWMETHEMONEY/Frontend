import { createStore } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { bankAccount, bankProductGroups } from '../constants/bank';
import { createMockBankSubscription, type MockBankSubscription } from '../utils/bank';

interface BankState {
  balance: number;
  savings: number;
  subscriptions: (MockBankSubscription & { requestId: string })[];
  hydrated: boolean;
  finishHydration: () => void;
  subscribe: (productId: string, amount: number, months: number, requestId: string) => boolean;
}

/** Bank-only mock ledger; it does not mutate the shop store or call an API. */
export const createBankStore = (storage?: StateStorage) =>
  createStore<BankState>()(
    persist(
      (set, get) => ({
        balance: bankAccount.balance,
        savings: bankAccount.savings,
        subscriptions: [],
        hydrated: false,
        finishHydration: () => set({ hydrated: true }),
        subscribe: (productId, amount, months, requestId) => {
          const state = get();
          if (
            !state.hydrated ||
            !requestId ||
            state.subscriptions.some((entry) => entry.requestId === requestId)
          )
            return false;
          const product = bankProductGroups
            .flatMap((group) => group.products)
            .find((item) => item.id === productId);
          if (!product) return false;
          const subscription = createMockBankSubscription(product, amount, months, state.balance);
          if (!subscription) return false;
          // For installments, amount is only the first monthly payment, not the term principal.
          set({
            balance: state.balance - amount,
            savings: state.savings + amount,
            subscriptions: [...state.subscriptions, { ...subscription, requestId }],
          });
          return true;
        },
      }),
      {
        name: 'moamoa-bank-mock-v1',
        version: 1,
        storage: createJSONStorage(() => storage ?? localStorage),
        skipHydration: true,
        partialize: ({ balance, savings, subscriptions }) => ({ balance, savings, subscriptions }),
        onRehydrateStorage: () => (state) => state?.finishHydration(),
      },
    ),
  );

export const bankStore = createBankStore();
