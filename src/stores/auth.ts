import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({
      isAuthenticated: true,
      isLoading: false,
      user: {
        name: 'Alex Johnson',
        email: email,
        avatar: '',
        role: 'Admin',
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}));
