import { create } from 'zustand';

let nextToastId = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  showToast: (message, type = 'info', duration = 3500) => {
    const id = ++nextToastId;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    window.setTimeout(() => get().dismissToast(id), duration);
    return id;
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
