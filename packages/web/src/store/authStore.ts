// Zustand Auth Store - 用户认证状态管理（姓名+密码）

import { create } from 'zustand';
import type { IUserProfile } from '@medical/service/db/models';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  mobile?: string;
  avatar?: string;
  profile: IUserProfile;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<IUserProfile & { name?: string; mobile?: string }>) => Promise<void>;
  setUser: (user: AuthUser, token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user: AuthUser, token: string) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  login: async (name: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '登录失败');
      }
      const data = await res.json();
      get().setUser(data.user, data.token);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '注册失败');
      }
      const data = await res.json();
      get().setUser(data.user, data.token);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    const { token } = get();
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true });
      } else {
        get().logout();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<IUserProfile & { name?: string; mobile?: string }>) => {
    const { token } = get();
    if (!token) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      set({ user: updated.user });
    }
  },
}));
