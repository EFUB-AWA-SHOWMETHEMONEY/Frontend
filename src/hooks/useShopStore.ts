'use client';

import { useStore } from 'zustand';
import { memberStore } from '../stores/memberStore';
import type { ShopState } from '../stores/shopStore';

export const useShopStore = <T>(selector: (state: ShopState) => T) =>
  useStore(memberStore, selector);
