import { create } from 'zustand';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
  setOpen: (open: boolean) => void;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Low Stock Alert',
    message: 'Widget Pro X200 is running low on stock (5 units remaining)',
    type: 'warning',
    read: false,
    timestamp: '2 min ago',
  },
  {
    id: '2',
    title: 'New Order Received',
    message: 'Order #ORD-2847 has been placed by Acme Corp',
    type: 'info',
    read: false,
    timestamp: '15 min ago',
  },
  {
    id: '3',
    title: 'Delivery Completed',
    message: 'Delivery #DEL-1092 has been successfully delivered',
    type: 'success',
    read: false,
    timestamp: '1 hour ago',
  },
  {
    id: '4',
    title: 'Payment Failed',
    message: 'Invoice #INV-4521 payment processing failed',
    type: 'error',
    read: true,
    timestamp: '3 hours ago',
  },
  {
    id: '5',
    title: 'New User Registered',
    message: 'Sarah Miller has been added as a staff member',
    type: 'info',
    read: true,
    timestamp: '5 hours ago',
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: initialNotifications,
  unreadCount: initialNotifications.filter((n) => !n.read).length,
  isOpen: false,
  addNotification: (notification) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: 'Just now',
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAsRead: (id) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    });
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  deleteNotification: (id) => {
    set((state) => {
      const newNotifications = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.read).length,
      };
    });
  },
  deleteAllNotifications: () => set({ notifications: [], unreadCount: 0 }),
  setOpen: (open) => set({ isOpen: open }),
}));
