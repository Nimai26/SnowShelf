import { create } from 'zustand';
import { userService } from '../services/user.service';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrement: (by?: number) => void;
  refresh: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrement: (by = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - by) })),
  refresh: async () => {
    try {
      const count = await userService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // silent
    }
  },
}));
