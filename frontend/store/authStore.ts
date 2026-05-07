'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User, LoginCredentials, SignupCredentials } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateProfile: (data: { name: string; email: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', credentials);
          if (data.success) {
            localStorage.setItem('taskflow_token', data.token);
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signup: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/signup', credentials);
          if (data.success) {
            localStorage.setItem('taskflow_token', data.token);
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Signup failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('taskflow_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          if (data.success) {
            set({ user: data.data, isAuthenticated: true });
          }
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.patch('/users/me', profileData);
          if (data.success) {
            set({ user: data.data, isLoading: false });
          }
        } catch (err: unknown) {
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed';
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
