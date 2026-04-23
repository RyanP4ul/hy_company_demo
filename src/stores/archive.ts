import { create } from 'zustand';

export type ArchivedEntityType = 'inventory' | 'order' | 'delivery' | 'user' | 'driver' | 'customer' | 'category' | 'warehouse';

export interface ArchivedItem {
  id: string;            // entity id (e.g. SKU-001, ORD-2847)
  type: ArchivedEntityType;
  data: Record<string, unknown>;  // original entity data
  archivedAt: string;    // ISO date string
  label: string;         // display name for the entity
}

interface ArchiveState {
  items: ArchivedItem[];
  archiveItem: (type: ArchivedEntityType, data: Record<string, unknown>, id: string, label: string) => void;
  restoreItem: (type: ArchivedEntityType, id: string) => ArchivedItem | undefined;
  permanentlyDelete: (type: ArchivedEntityType, id: string) => void;
  getArchivedByType: (type: ArchivedEntityType) => ArchivedItem[];
  clearAll: (type?: ArchivedEntityType) => void;
}

export const useArchiveStore = create<ArchiveState>()((set, get) => ({
  items: [],

  archiveItem: (type, data, id, label) => {
    set((state) => ({
      items: [
        { id, type, data, archivedAt: new Date().toISOString(), label },
        ...state.items.filter((i) => !(i.id === id && i.type === type)),
      ],
    }));
  },

  restoreItem: (type, id) => {
    const item = get().items.find((i) => i.id === id && i.type === type);
    if (item) {
      set((state) => ({
        items: state.items.filter((i) => !(i.id === id && i.type === type)),
      }));
    }
    return item;
  },

  permanentlyDelete: (type, id) => {
    set((state) => ({
      items: state.items.filter((i) => !(i.id === id && i.type === type)),
    }));
  },

  getArchivedByType: (type) => {
    return get().items.filter((i) => i.type === type);
  },

  clearAll: (type) => {
    set((state) => ({
      items: type ? state.items.filter((i) => i.type !== type) : [],
    }));
  },
}));
