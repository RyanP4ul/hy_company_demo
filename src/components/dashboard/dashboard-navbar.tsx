'use client';

import { cn } from '@/lib/utils';
import { useNavigationStore, NAV_ITEMS } from '@/stores/navigation';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notifications';
import { useTranslation } from '@/lib/i18n/use-translation';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  onSearchOpen: () => void;
}

export function DashboardNavbar({ onMobileMenuToggle, onSearchOpen }: NavbarProps) {
  const { currentView } = useNavigationStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { t } = useTranslation();

  // i18n-aware page title
  const currentItem = NAV_ITEMS.find((item) => item.id === currentView);
  const pageTitle = currentItem ? (() => {
    const key = `nav.${currentItem.id}`;
    const translated = t(key);
    return translated !== key ? translated : currentItem.label;
  })() : t('nav.dashboard');

  const notificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:gap-4 sm:h-16 sm:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm font-semibold truncate sm:text-lg">
          {pageTitle}
        </h1>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Search — desktop: wide button; mobile: icon only */}
        <Button
          variant="outline"
          size="sm"
          className="hidden h-9 w-56 justify-start gap-2 text-muted-foreground lg:flex xl:w-64"
          onClick={onSearchOpen}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">{t('common.search')}...</span>
          <kbd className="ml-auto hidden pointer-events-none inline-flex h-5 shrink-0 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground xl:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden"
          onClick={onSearchOpen}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden h-9 w-9 shrink-0 sm:inline-flex"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications — uses Radix Popover with portal to escape header's backdrop-blur stacking context */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 shrink-0"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-0 shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{t('common.notifications')}</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={markAllAsRead}
                >
                  {t('common.markAllRead')}
                </Button>
              )}
            </div>

            {/* Scrollable notification list */}
            <ScrollArea className="h-80">
              <div className="px-2 py-2">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('common.noNotifications')}
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        'flex w-full gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent',
                        !notification.read && 'bg-primary/5'
                      )}
                    >
                      <span className="mt-0.5 text-sm">
                        {notificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {notification.timestamp}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 shrink-0 px-1 sm:px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'AJ'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:block max-w-[120px] truncate">
                {user?.name || 'Alex Johnson'}
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
