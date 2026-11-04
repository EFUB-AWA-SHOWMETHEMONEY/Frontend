import { createStore } from 'zustand/vanilla';
import { findProduct } from '../constants/shop';

export interface OwnedItem {
  instanceId: string;
  productId: string;
}

export type TransactionResult =
  { ok: true } | { ok: false; reason: 'insufficient-funds' | 'not-found' | 'already-owned' };

export interface ShopState {
  balance: number;
  inventory: OwnedItem[];
  nextInstanceId: number;
  purchase: (productId: string) => TransactionResult;
  sell: (instanceId: string) => TransactionResult;
}

// In-memory mock adapter. Replace these actions when the API becomes available.
// Instance IDs keep stale sale actions from selling a newly repurchased item.
export const createShopStore = () =>
  createStore<ShopState>()((set, get) => ({
    balance: 1000,
    inventory: [
      { instanceId: 'owned-1', productId: 'ribbon' },
      { instanceId: 'owned-2', productId: 'sun' },
    ],
    nextInstanceId: 3,
    purchase: (productId) => {
      const product = findProduct(productId);
      if (!product) return { ok: false, reason: 'not-found' };
      const state = get();
      if (state.inventory.some((entry) => entry.productId === productId))
        return { ok: false, reason: 'already-owned' };
      if (state.balance < product.purchasePrice) return { ok: false, reason: 'insufficient-funds' };
      set({
        balance: state.balance - product.purchasePrice,
        inventory: [...state.inventory, { instanceId: `owned-${state.nextInstanceId}`, productId }],
        nextInstanceId: state.nextInstanceId + 1,
      });
      return { ok: true };
    },
    sell: (instanceId) => {
      const state = get();
      const owned = state.inventory.find((entry) => entry.instanceId === instanceId);
      const product = owned && findProduct(owned.productId);
      if (!product) return { ok: false, reason: 'not-found' };
      set({
        balance: state.balance + product.salePrice,
        inventory: state.inventory.filter((entry) => entry.instanceId !== instanceId),
      });
      return { ok: true };
    },
  }));
