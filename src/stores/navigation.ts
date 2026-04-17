import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavItem = 
  | 'dashboard'
  | 'inventory'
  | 'orders'
  | 'deliveries'
  | 'analytics'
  | 'users'
  | 'customers'
  | 'roles'
  | 'drivers'
  | 'audit-logs'
  | 'notifications'
  | 'settings'
  | 'reports'
  | 'payments'
  | 'archived'
  | 'central-inbox'
  // Sub-pages (no sidebar nav item)
  | 'create-order'
  | 'create-delivery'
  | 'delivery-detail';

interface NavigationState {
  currentView: NavItem;
  mobileMenuOpen: boolean;
  sidebarCollapsed: boolean;
  setCurrentView: (view: NavItem) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentView: 'dashboard',
      mobileMenuOpen: false,
      sidebarCollapsed: false,
      setCurrentView: (view) => set({ currentView: view, mobileMenuOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'nav-storage',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);

// Only sidebar-visible nav items
export const NAV_ITEMS: { id: NavItem; label: string; icon: string; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', group: 'Main' },
  { id: 'inventory', label: 'Inventory', icon: 'Package', group: 'Main' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart', group: 'Main' },
  { id: 'deliveries', label: 'Deliveries', icon: 'Truck', group: 'Main' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', group: 'Insights' },
  { id: 'reports', label: 'Reports', icon: 'FileText', group: 'Insights' },
  { id: 'payments', label: 'Payments', icon: 'CreditCard', group: 'Main' },
  { id: 'users', label: 'Users', icon: 'Users', group: 'Management' },
  { id: 'customers', label: 'Customers', icon: 'Contact', group: 'Management' },
  { id: 'roles', label: 'Roles & Permissions', icon: 'Shield', group: 'Management' },
  { id: 'drivers', label: 'Drivers', icon: 'UserCheck', group: 'Management' },
  { id: 'audit-logs', label: 'Audit Logs', icon: 'ScrollText', group: 'System' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', group: 'System' },
  { id: 'settings', label: 'Settings', icon: 'Settings', group: 'System' },
  { id: 'archived', label: 'Archived', icon: 'Archive', group: 'System' },
  { id: 'central-inbox', label: 'Central Inbox', icon: 'MessageSquare', group: 'Main' },
];
