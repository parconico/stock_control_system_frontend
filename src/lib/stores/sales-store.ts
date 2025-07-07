/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { CreateSaleForm, Product, Sale, SaleFilters } from "../types";
import { salesApi } from "../api";

interface CartItem {
  product: Product;
  quantity: number;
}

interface SalesState {
  sales: Sale[];
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  filters: SaleFilters;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

interface SalesActions {
  fetchSales: (filters?: SaleFilters) => Promise<void>;
  createSale: (data: CreateSaleForm) => Promise<Sale>;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  processCart: () => Promise<void>;
  setFilters: (filters: Partial<SaleFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useSalesStore = create<SalesState & SalesActions>()(
  immer((set, get) => ({
    //Estado inicial
    sales: [],
    cart: [],
    loading: false,
    error: null,
    filters: {},
    meta: null,

    //Acciones
    fetchSales: async (filters?: SaleFilters) => {
      set((state) => {
        state.loading = true;
        state.error = null;
        if (filters) state.filters = { ...state.filters, ...filters };
      });

      try {
        const response = await salesApi.getAll(get().filters);
        set((state) => {
          state.sales = response.data;
          state.meta = response.meta || null;
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al cargar ventas";
          state.loading = false;
        });
      }
    },

    createSale: async (data: CreateSaleForm) => {
      try {
        const newSale = await salesApi.create(data);
        set((state) => {
          state.sales.unshift(newSale);
        });
        return newSale;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Error al registrar venta";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },

    addToCart: (product: Product, quantity: number) => {
      set((state) => {
        const existingItem = state.cart.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= product.stock) {
            existingItem.quantity = newQuantity;
          } else {
            state.error = "No hay  suficiente stock disponible";
          }
        } else {
          if (quantity <= product.stock) {
            state.cart.push({ product, quantity });
          } else {
            state.error = "No hay suficiente stock disponible";
          }
        }
      });
    },

    removeFromCart: (productId: string) => {
      set((state) => {
        state.cart = state.cart.filter((item) => item.product.id !== productId);
      });
    },

    updateCartQuantity: (productId: string, quantity: number) => {
      set((state) => {
        if (quantity <= 0) {
          state.cart = state.cart.filter(
            (item) => item.product.id !== productId
          );
        } else {
          const item = state.cart.find((item) => item.product.id === productId);
          if (item) {
            if (quantity <= item.product.stock) {
              item.quantity = quantity;
            } else {
              state.error = "No hay suficiente stock disponible";
            }
          }
        }
      });
    },

    clearCart: () => {
      set((state) => {
        state.cart = [];
      });
    },

    processCart: async () => {
      const { cart } = get();

      if (cart.length === 0) {
        throw new Error("El carrito esta vacio");
      }

      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        //Procesar cada item del carrito
        for (const item of cart) {
          await salesApi.create({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * item.quantity,
          });
        }

        set((state) => {
          state.cart = [];
          state.loading = false;
        });

        //Refrescar ventas
        await get().fetchSales();
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response.data.message || "Error al procesar venta";
          state.loading = false;
        });
        throw error;
      }
    },

    setFilters: (filters: Partial<SaleFilters>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      });
    },

    clearFilters: () => {
      set((state) => {
        state.filters = {};
      });
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.loading = loading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    getCartTotal: () => {
      const { cart } = get();
      return cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
    },

    getCartItemCount: () => {
      const { cart } = get();
      return cart.reduce((total, item) => total + item.quantity, 0);
    },
  }))
);
