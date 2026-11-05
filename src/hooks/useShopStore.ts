'use client';

import { useStore } from 'zustand';
import { createShopStore, type ShopState } from '../stores/shopStore';

const shopStore = createShopStore();
export const useShopStore = <T>(selector: (state: ShopState) => T) => useStore(shopStore, selector);
