import { create } from 'zustand';
import api from '@/lib/api';

export interface Notification {
  _id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type?: 'task' | 'project' | 'system';
}

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      // For now, we'll fetch from activity log as a proxy for notifications
      const { data } = await api.get('/dashboard/stats');
      const activities = data.data.recentActivity || [];
      
      const mappedNotifications: Notification[] = activities.map((act: any) => ({
        _id: act._id,
        title: act.action.charAt(0).toUpperCase() + act.action.slice(1),
        description: `${act.user?.name || 'Someone'} ${act.action} ${act.entityTitle}`,
        time: act.createdAt,
        isRead: false, // Defaulting to false for demo
        type: act.entityType,
      }));

      set({ 
        notifications: mappedNotifications, 
        unreadCount: mappedNotifications.length,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => 
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
