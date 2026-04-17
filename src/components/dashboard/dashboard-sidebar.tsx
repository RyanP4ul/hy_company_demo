'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNavigationStore, NAV_ITEMS, type NavItem } from '@/stores/navigation';
import { useTranslation } from '@/lib/i18n/use-translation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  FileText,
  Users,
  Contact,
  Shield,
  UserCheck,
  ScrollText,
  Bell,
  Settings,
  Archive,
  LogOut,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/auth';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  FileText,
  Users,
  Contact,
  Shield,
  UserCheck,
  ScrollText,
  Bell,
  Settings,
  Archive,
  MessageSquare,
  CreditCard,
};

interface SidebarProps {
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({ className, mobileOpen, onMobileClose }: SidebarProps) {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar } = useNavigationStore();
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();

  // i18n mapping for nav item IDs
  const navLabel = (id: string): string => {
    const key = `nav.${id}`;
    const translated = t(key);
    // Fall back to original label if translation is same as key
    const original = NAV_ITEMS.find(item => item.id === id);
    return translated !== key ? translated : (original?.label ?? id);
  };

  const groupLabel = (group: string): string => {
    const key = `nav.${group.toLowerCase()}`;
    const translated = t(key);
    return translated !== key ? translated : group;
  };

  // Hover expand state (desktop only) — when collapsed, hovering expands temporarily
  const [hoverExpanded, setHoverExpanded] = useState(false);

  // Whether to show expanded labels (either permanently expanded, or temporarily via hover)
  const showLabels = !sidebarCollapsed || hoverExpanded;

  const groups = ['Main', 'Insights', 'Management', 'System'];
  const filteredItems = groups.map((group) => ({
    group,
    items: NAV_ITEMS.filter((item) => item.group === group),
  }));

  const handleNavClick = useCallback((view: NavItem) => {
    setCurrentView(view);
    onMobileClose?.();
  }, [setCurrentView, onMobileClose]);

  const handleMouseEnter = useCallback(() => {
    if (sidebarCollapsed) {
      setHoverExpanded(true);
    }
  }, [sidebarCollapsed]);

  const handleMouseLeave = useCallback(() => {
    setHoverExpanded(false);
  }, []);

  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Logo area with vertical gap */}
      <div
        className={cn(
          'flex items-center border-b px-4 py-5 transition-all duration-300',
          showLabels ? 'justify-between' : 'justify-center px-4 py-5'
        )}
      >
        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="h-5 w-5" />
          </div>
          <AnimatePresence>
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-base font-semibold tracking-tight"
              >
                CloudInventory
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Hamburger / Collapse toggle button — only show when expanded */}
        <AnimatePresence>
          {showLabels && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation — min-h-0 allows ScrollArea to shrink below content size, enabling scroll */}
      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <nav className="space-y-6">
          {filteredItems.map(({ group, items }) => (
            <div key={group}>
              <AnimatePresence>
                {showLabels && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {groupLabel(group)}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = currentView === item.id;
                  const isCollapsed = !showLabels;

                  const navButton = (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-primary/10"
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                      )}
                      {Icon && (
                        <Icon className={cn(
                          'relative z-10 h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )} />
                      )}
                      <AnimatePresence>
                        {showLabels && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 truncate"
                          >
                            {navLabel(item.id)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );

                  // Show tooltips only when fully collapsed (not during hover-expand)
                  if (isCollapsed && !hoverExpanded) {
                    return (
                      <Tooltip key={item.id} delayDuration={0}>
                        <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {navLabel(item.id)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.id}>{navButton}</React.Fragment>;
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer — expand button when collapsed */}
      <div className="border-t p-3">
        <AnimatePresence mode="wait">
          {(!showLabels) ? (
            <motion.div
              key="expand-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-9 text-muted-foreground hover:text-foreground"
                    onClick={toggleSidebar}
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Expand sidebar
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              key="logout-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full gap-3 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span className="truncate">{t('common.logout')}</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar — full expanded, always shows labels */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[260px] border-r bg-sidebar md:hidden"
          >
            {/* Mobile close button */}
            <div className="flex items-center justify-end px-2 pt-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onMobileClose}
                aria-label="Close menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: showLabels ? 260 : 64 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'hidden h-screen border-r bg-sidebar md:block md:relative md:z-auto',
          // Add a subtle shadow when hover-expanded so it floats above content
          hoverExpanded && 'absolute z-40 shadow-xl'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {sidebarContent}
      </motion.div>
    </>
  );
}
