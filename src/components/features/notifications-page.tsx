'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { useNotificationStore } from '@/stores/notifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-l-blue-500',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-l-green-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-l-yellow-500',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-l-red-500',
  },
};

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = typeConfig[notification.type];
  const TypeIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'group relative cursor-pointer rounded-lg border bg-card p-4 transition-all',
        !notification.read && 'border-l-4',
        !notification.read ? config.border : 'border-l-4 border-l-transparent',
        'hover:bg-muted/30'
      )}
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
      }}
    >
      {/* Dismiss button - top right, visible on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-7 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Dismiss notification"
      >
        <X className="size-3.5" />
      </Button>

      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', config.bg)}>
          <TypeIcon className={cn('size-5', config.color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn('text-sm font-semibold', !notification.read && 'font-bold')}>
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
            {!notification.read && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <BellOff className="size-3" />
                Click to mark as read
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter((n) => !n.read);
      case 'info':
      case 'success':
      case 'warning':
      case 'error':
        return notifications.filter((n) => n.type === activeFilter);
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    unread: unreadCount,
    info: notifications.filter((n) => n.type === 'info').length,
    success: notifications.filter((n) => n.type === 'success').length,
    warning: notifications.filter((n) => n.type === 'warning').length,
    error: notifications.filter((n) => n.type === 'error').length,
  }), [notifications, unreadCount]);

  const handleDeleteNotification = (id: string) => {
    deleteNotification(id);
    toast.success('Notification dismissed');
  };

  const handleDeleteAll = () => {
    deleteAllNotifications();
    toast.success('All notifications cleared');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                View and manage your system notifications.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDeleteAll}
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete all
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="size-4" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Stats Bar */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold">{notifications.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
            {(['unread', 'warning', 'error'] as const).map((type) => {
              const count = filterCounts[type];
              const colorMap = {
                unread: { bg: 'bg-primary/10', text: 'text-primary', label: 'Unread' },
                warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: 'Warnings' },
                error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'Errors' },
              }[type];
              const iconMap = {
                unread: Bell,
                warning: AlertTriangle,
                error: XCircle,
              }[type];
              const Icon = iconMap;
              return (
                <div key={type} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg', colorMap.bg)}>
                    <Icon className={cn('size-4', colorMap.text)} />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{colorMap.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* Filter Tabs */}
        <FadeIn delay={0.1}>
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterTab)}>
            <TabsList className="flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'unread', label: 'Unread' },
                { value: 'info', label: 'Info' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                  {tab.label}
                  {filterCounts[tab.value as keyof typeof filterCounts] > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {filterCounts[tab.value as keyof typeof filterCounts]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </FadeIn>

        {/* Notification List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={handleDeleteNotification}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-lg border bg-card py-16"
              >
                <BellOff className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {activeFilter === 'all'
                    ? 'No notifications yet.'
                    : `No ${activeFilter} notifications.`}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
