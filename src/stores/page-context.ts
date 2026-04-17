import { create } from 'zustand';

interface PageContextState {
  // For delivery detail page
  selectedDeliveryId: string | null;
  setSelectedDeliveryId: (id: string | null) => void;

  // For order view/edit page
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;

  // Parent page to return to
  returnTo: string | null;
  setReturnTo: (page: string | null) => void;
}

export const usePageContext = create<PageContextState>()((set) => ({
  selectedDeliveryId: null,
  setSelectedDeliveryId: (id) => set({ selectedDeliveryId: id }),
  selectedOrderId: null,
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  returnTo: null,
  setReturnTo: (page) => set({ returnTo: page }),
}));
