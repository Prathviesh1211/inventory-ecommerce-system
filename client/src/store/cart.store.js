import { create } from 'zustand';
import api from '../services/api';

export const useCartStore = create((set) => ({
  cart: { items: [], totalItems: 0, subtotal: 0 },
  isLoading: false,
  fetchCart: async () => {
    set({ isLoading: true });
    try { const { data } = await api.get('/cart'); set({ cart: data.cart }); }
    finally { set({ isLoading: false }); }
  },
  addItem: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    set({ cart: data.cart });
  },
  updateItem: async (productId, quantity) => {
    const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
    set({ cart: data.cart });
  },
  removeItem: async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    set({ cart: data.cart });
  },
  clear: async () => {
    const { data } = await api.delete('/cart');
    set({ cart: data.cart });
  },
}));
