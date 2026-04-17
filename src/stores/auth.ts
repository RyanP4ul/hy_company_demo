import { create } from 'zustand';
import { users as allUsers } from '@/lib/mock-data';

// Store user credentials (password) separately in-memory
// In production this would be handled by a backend auth service
const userCredentials: Record<string, { password: string; name: string; email: string; role: string }> = {};

// Initialize default users with passwords
allUsers.forEach((u) => {
  userCredentials[u.email] = {
    password: 'password123', // Default password for all mock users
    name: u.name,
    email: u.email,
    role: u.role,
  };
});

// Public helper to register a new user credential (used by Users page)
export function registerUserCredentials(email: string, password: string, name: string, role: string) {
  userCredentials[email] = { password, name, email, role };
}

// Public helper to change an existing user's password (used by Users page)
export function changeUserPassword(email: string, newPassword: string): boolean {
  if (!userCredentials[email]) return false;
  userCredentials[email].password = newPassword;
  return true;
}

// Public helper to get all registered emails
export function getRegisteredEmails(): string[] {
  return Object.keys(userCredentials);
}

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
  login: async (email: string, password: string) => {
    set({ isLoading: true });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const creds = userCredentials[email];

    if (!creds) {
      set({ isLoading: false });
      throw new Error('No account found with this email address.');
    }

    if (creds.password !== password) {
      set({ isLoading: false });
      throw new Error('Incorrect password. Please try again.');
    }

    set({
      isAuthenticated: true,
      isLoading: false,
      user: {
        name: creds.name,
        email: creds.email,
        avatar: '',
        role: creds.role,
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false, user: null });
  },
}));
