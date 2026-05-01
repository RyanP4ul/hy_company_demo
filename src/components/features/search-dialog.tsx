'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCheck,
  X,
  Contact,
  Warehouse,
  Receipt,
} from 'lucide-react';
import { useNavigationStore, type NavItem } from '@/stores/navigation';
import { useSearchStore, type SearchEntityType } from '@/stores/search';
import {
  inventoryItems,
  orders,
  deliveries,
  users,
  drivers,
  customers,
  warehouses,
  salesTransactions,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  entityType: SearchEntityType;
  navView: NavItem;
  icon: React.ReactNode;
}

const typeLabels: Record<SearchEntityType, string> = {
  inventory: 'Inventory',
  order: 'Order',
  delivery: 'Delivery',
  user: 'User',
  driver: 'Driver',
  customer: 'Customer',
  warehouse: 'Warehouse',
  sale: 'Sale',
};

const typeColors: Record<SearchEntityType, string> = {
  inventory: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  order: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delivery: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  user: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  driver: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  customer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  warehouse: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  sale: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const iconColors: Record<SearchEntityType, string> = {
  inventory: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  order: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  delivery: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  user: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  driver: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  customer: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  warehouse: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  sale: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { setCurrentView } = useNavigationStore();
  const { setTarget } = useSearchStore();

  // Build searchable items from all entity types
  const allItems = useMemo<SearchResult[]>(() => [
    ...inventoryItems.map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: `${item.id} · ${item.types.length} type${item.types.length > 1 ? 's' : ''} · ${item.warehouse}`,
      entityType: 'inventory' as SearchEntityType,
      navView: 'inventory' as NavItem,
      icon: <Package className="h-4 w-4" />,
    })),
    ...orders.map((order) => ({
      id: order.id,
      title: `${order.id} — ${order.customer}`,
      subtitle: `${order.items} items · ₱${order.total.toFixed(2)} · ${order.status}`,
      entityType: 'order' as SearchEntityType,
      navView: 'orders' as NavItem,
      icon: <ShoppingCart className="h-4 w-4" />,
    })),
    ...deliveries.map((delivery) => ({
      id: delivery.id,
      title: `${delivery.id} — ${delivery.driver}`,
      subtitle: `${delivery.stops.length} stops · ${delivery.totalOrders} orders · ${delivery.status}`,
      entityType: 'delivery' as SearchEntityType,
      navView: 'deliveries' as NavItem,
      icon: <Truck className="h-4 w-4" />,
    })),
    ...users.map((user) => ({
      id: user.id,
      title: user.name,
      subtitle: `${user.id} · ${user.role} · ${user.email}`,
      entityType: 'user' as SearchEntityType,
      navView: 'users' as NavItem,
      icon: <Users className="h-4 w-4" />,
    })),
    ...drivers.map((driver) => ({
      id: driver.id,
      title: driver.name,
      subtitle: `${driver.id} · ${driver.vehicle} · ${driver.phone}`,
      entityType: 'driver' as SearchEntityType,
      navView: 'drivers' as NavItem,
      icon: <UserCheck className="h-4 w-4" />,
    })),
    ...customers.map((customer) => ({
      id: customer.id,
      title: customer.name,
      subtitle: `${customer.id} · ${customer.totalOrders} orders · ₱${customer.totalSpent.toLocaleString()}`,
      entityType: 'customer' as SearchEntityType,
      navView: 'customers' as NavItem,
      icon: <Contact className="h-4 w-4" />,
    })),
    ...warehouses.map((warehouse) => ({
      id: warehouse.id,
      title: warehouse.name,
      subtitle: `${warehouse.id} · ${warehouse.city} · ${warehouse.type.replace('_', ' ')} · ${warehouse.status}`,
      entityType: 'warehouse' as SearchEntityType,
      navView: 'warehouses' as NavItem,
      icon: <Warehouse className="h-4 w-4" />,
    })),
    ...salesTransactions.map((sale) => ({
      id: sale.id,
      title: `${sale.id} — ${sale.customer}`,
      subtitle: `₱${sale.total.toFixed(2)} · ${sale.paymentMethod.toUpperCase()} · ${sale.status}`,
      entityType: 'sale' as SearchEntityType,
      navView: 'sales' as NavItem,
      icon: <Receipt className="h-4 w-4" />,
    })),
  ], []);

  // Filter results by query
  const filtered = useMemo(() => {
    if (query.length === 0) return [];
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  // Group filtered results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const item of filtered) {
      if (!groups[item.entityType]) groups[item.entityType] = [];
      groups[item.entityType].push(item);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => Object.values(groupedResults).flat(), [groupedResults]);

  const handleSelect = useCallback((result: SearchResult) => {
    // Set the search target so the page knows which item to show
    setTarget({ type: result.entityType, id: result.id });
    // Navigate to the appropriate page
    setCurrentView(result.navView);
    setQuery('');
    setSelectedIndex(-1);
    onClose();
  }, [setTarget, setCurrentView, onClose]);

  // Dispatch search:navigate event after dialog closes and page has transitioned
  useEffect(() => {
    if (!open) {
      const target = useSearchStore.getState().target;
      if (target) {
        const timer = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('search:navigate'));
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < flatResults.length) {
        e.preventDefault();
        handleSelect(flatResults[selectedIndex]);
      }
    },
    [onClose, flatResults, selectedIndex, handleSelect]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  // Group order
  const groupOrder: SearchEntityType[] = ['order', 'sale', 'delivery', 'inventory', 'driver', 'customer', 'warehouse', 'user'];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-1/2 top-[12%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border bg-popover shadow-2xl">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b px-4">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search orders, deliveries, inventory, customers, drivers, warehouses, sales..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                {query && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setQuery('')}
                    className="rounded-md p-1 hover:bg-accent"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {query.length > 0 && filtered.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <Search className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    <p>No results found for &quot;{query}&quot;</p>
                    <p className="mt-1 text-xs">Try searching by name, ID, or description</p>
                  </div>
                )}

                {groupOrder.map((entityType) => {
                  const items = groupedResults[entityType];
                  if (!items) return null;
                  return (
                    <div key={entityType}>
                      {/* Group header */}
                      <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-sm px-4 pt-3 pb-1">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeColors[entityType]}`}>
                          {typeLabels[entityType]}
                          <span className="opacity-60">({items.length})</span>
                        </span>
                      </div>
                      {/* Group items */}
                      {items.map((result) => {
                        const globalIdx = flatResults.indexOf(result);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <motion.button
                            key={`${result.entityType}-${result.id}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: globalIdx * 0.015 }}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              isSelected
                                ? 'bg-accent'
                                : 'hover:bg-accent/50'
                            )}
                          >
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColors[result.entityType]}`}>
                              {result.icon}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {result.subtitle}
                              </p>
                            </div>
                            <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wide">
                              {result.entityType}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                    Open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                    Close
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
