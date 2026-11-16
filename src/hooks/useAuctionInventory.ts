'use client';

import { useStore } from 'zustand';
import { memberStore } from '@/stores/memberStore';
import { useShopStore } from './useShopStore';
import { auctionInventory } from '@/utils/auction';

export function useAuctionInventory() {
  const inventory = useShopStore((state) => state.inventory);
  const hydrated = useStore(memberStore, (state) => state.hydrated);
  return { items: hydrated ? auctionInventory(inventory) : [], hydrated };
}
