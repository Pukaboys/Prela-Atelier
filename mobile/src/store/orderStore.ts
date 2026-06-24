import { create } from 'zustand';
import { fetchCustomerOrders } from '../services/orders';
import type { ClientOrder } from '../types';

interface OrderState {
  orders: ClientOrder[];
  loading: boolean;
  error: string | null;
  fetchOrders: (email: string) => Promise<void>;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (email) => {
    set({ loading: true, error: null });

    try {
      const orders = await fetchCustomerOrders(email);
      set({ orders, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch orders';
      set({ error: message, loading: false });
      throw error;
    }
  },

  clearOrders: () => {
    set({ orders: [], loading: false, error: null });
  },
}));
