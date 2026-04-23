import { create } from 'zustand';

export type SearchEntityType = 'inventory' | 'order' | 'delivery' | 'user' | 'driver' | 'customer' | 'category' | 'warehouse';

interface SearchTarget {
  type: SearchEntityType;
  id: string;
}

interface SearchState {
  target: SearchTarget | null;
  setTarget: (target: SearchTarget | null) => void;
  clearTarget: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  clearTarget: () => set({ target: null }),
}));
