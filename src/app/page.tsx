'use client';

import React, { useState, useEffect, lazy, Suspense, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore, type NavItem } from '@/stores/navigation';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardNavbar } from '@/components/dashboard/dashboard-navbar';
import { SearchDialog } from '@/components/features/search-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load all page components for performance
const LoginPage = lazy(() => import('@/components/features/login-page'));
const DashboardPage = lazy(() => import('@/components/features/dashboard-page'));
const InventoryPage = lazy(() => import('@/components/features/inventory-page'));
const OrdersPage = lazy(() => import('@/components/features/orders-page'));
const DeliveriesPage = lazy(() => import('@/components/features/deliveries-page'));
const AnalyticsPage = lazy(() => import('@/components/features/analytics-page'));
const UsersPage = lazy(() => import('@/components/features/users-page'));
const RolesPage = lazy(() => import('@/components/features/roles-page'));
const DriversPage = lazy(() => import('@/components/features/drivers-page'));
const AuditLogsPage = lazy(() => import('@/components/features/audit-logs-page'));
const ReportsPage = lazy(() => import('@/components/features/reports-page'));
const NotificationsPage = lazy(() => import('@/components/features/notifications-page'));
const SettingsPage = lazy(() => import('@/components/features/settings-page'));
const CustomersPage = lazy(() => import('@/components/features/customers-page'));
const ArchivedPage = lazy(() => import('@/components/features/archived-page'));
const CentralInboxPage = lazy(() => import('@/components/features/central-inbox-page'));
const SalesPage = lazy(() => import('@/components/features/sales-page'));
const CategoriesPage = lazy(() => import('@/components/features/categories-page'));
const WarehousesPage = lazy(() => import('@/components/features/warehouses-page'));
const CreateOrderPage = lazy(() => import('@/components/features/create-order-page'));
const DeliveryDetailPage = lazy(() => import('@/components/features/delivery-detail-page'));
const CreateDeliveryPage = lazy(() => import('@/components/features/create-delivery-page'));

// Main navigation pages (shown in sidebar)
const pageComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  dashboard: DashboardPage,
  inventory: InventoryPage,
  orders: OrdersPage,
  deliveries: DeliveriesPage,
  analytics: AnalyticsPage,
  users: UsersPage,
  customers: CustomersPage,
  roles: RolesPage,
  drivers: DriversPage,
  'audit-logs': AuditLogsPage,
  reports: ReportsPage,
  notifications: NotificationsPage,
  settings: SettingsPage,
  archived: ArchivedPage,
  'central-inbox': CentralInboxPage,
  sales: SalesPage,
  categories: CategoriesPage,
  warehouses: WarehousesPage,
};

// Sub-page components (no sidebar highlight)
const subPageComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'create-order': CreateOrderPage,
  'create-delivery': CreateDeliveryPage,
  'delivery-detail': DeliveryDetailPage,
};

// All views combined
const allViews = new Set([...Object.keys(pageComponents), ...Object.keys(subPageComponents)]);

function isSubPage(view: string): boolean {
  return view in subPageComponents;
}

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-32 w-64" />
          <Skeleton className="h-32 w-64" />
          <Skeleton className="h-32 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const currentView = useNavigationStore((s) => s.currentView);
  const mobileMenuOpen = useNavigationStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useNavigationStore((s) => s.setMobileMenuOpen);
  const toggleMobileMenu = useNavigationStore((s) => s.setMobileMenuOpen);
  const [searchOpen, setSearchOpen] = useState(false);
  const mounted = useHydrated();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  if (!mounted) {
    return null;
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    );
  }

  // Determine which component to render
  const isSub = isSubPage(currentView);
  const PageComponent = isSub
    ? subPageComponents[currentView]
    : pageComponents[currentView];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - hide for sub-pages on mobile */}
      <DashboardSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar - always show */}
        <DashboardNavbar
          onMobileMenuToggle={() => toggleMobileMenu(!mobileMenuOpen)}
          onSearchOpen={() => setSearchOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <Suspense fallback={<PageLoader />}>
                  {PageComponent && <PageComponent />}
                </Suspense>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global search dialog */}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
