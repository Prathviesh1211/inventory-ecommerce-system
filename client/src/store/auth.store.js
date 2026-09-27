import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    set({ user: data.user });
    return data.user;
  },

  register: async (values) => {
    const { data } = await api.post('/auth/register', values);
    set({ user: data.user });
    return data.user;
  },

  logout: async () => {
    await api.post('/auth/logout');
    set({ user: null });
  },
}));
