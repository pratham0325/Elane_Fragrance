import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import toast from './toast';

interface CartItem {
  _id: string;
  product: { _id: string; name: string; slug: string; thumbnail: string; sizes: { size: string; price: number; stock: number }[] };
  size: string;
  quantity: number;
  priceAtAdd: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, size: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    try {
      const { data } = await apiClient.get('/cart');
      set({ items: data.data.items ?? [] });
    } catch { /* user not logged in */ }
  },

  addItem: async (productId, size, quantity = 1) => {
    try {
      const { data } = await apiClient.post('/cart', { productId, size, quantity });
      set({ items: data.data.items ?? [] });
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Could not add to cart');
      throw err;
    }
  },

  updateItem: async (itemId, quantity) => {
    const { data } = await apiClient.put(`/cart/${itemId}`, { quantity });
    set({ items: data.data.items ?? [] });
  },

  removeItem: async (itemId) => {
    const { data } = await apiClient.delete(`/cart/${itemId}`);
    set({ items: data.data.items ?? [] });
    toast.success('Removed from cart');
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () => get().items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0)
}));
