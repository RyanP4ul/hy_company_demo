import { create } from 'zustand';
import { users as mockUsers } from '@/lib/mock-data';

export type UserRole = 'Admin' | 'Staff';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    name: string;
    email: string;
    avatar: string;
    role: UserRole;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Match email against mock users to get the correct name and role
    const matchedUser = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    set({
      isAuthenticated: true,
      isLoading: false,
      user: {
        name: matchedUser?.name ?? 'Alex Johnson',
        email: email,
        avatar: matchedUser?.avatar ?? '',
        role: (matchedUser?.role as UserRole) ?? 'Staff',
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
  switchRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },
}));
