/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateProductForm, Product, ProductFilters } from "../types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { productApi } from "../api";

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

interface ProductsActions {
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  fetchProductByBarcode: (barcode: string) => Promise<Product>;
  createProduct: (data: CreateProductForm) => Promise<Product>;
  updateProduct: (
    id: string,
    data: Partial<CreateProductForm>
  ) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (
    id: string,
    quantity: number,
    reason: string
  ) => Promise<Product>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  setSelectedProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProductsStore = create<ProductsState & ProductsActions>()(
  immer((set, get) => ({
    // Estado inicial
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
    filters: {},
    meta: null,

    //Acciones
    fetchProducts: async (filters?: ProductFilters) => {
      set((state) => {
        state.loading = true;
        state.error = null;
        if (filters) state.filters = { ...state.filters, ...filters };
      });

      try {
        const response = await productApi.getAll(get().filters);
        set((state) => {
          state.products = response.data;
          state.meta = response.meta || null;
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al cargar productos";
          state.loading = false;
        });
      }
    },

    fetchProductById: async (id: string) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const product = await productApi.getById(id);
        set((state) => {
          state.selectedProduct = product;
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al cargar producto";
          state.loading = false;
        });
      }
    },

    fetchProductByBarcode: async (barcode: string) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const product = await productApi.getByBarcode(barcode);
        set((state) => {
          state.selectedProduct = product;
          state.loading = false;
        });
        return product;
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Producto no encontrado";
          state.loading = false;
        });
        throw error;
      }
    },

    createProduct: async (data: CreateProductForm) => {
      try {
        const newProduct = await productApi.create(data);
        set((state) => {
          state.products.unshift(newProduct);
        });
        return newProduct;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Error al crear producto";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },

    updateProduct: async (id: string, data: Partial<CreateProductForm>) => {
      try {
        const updatedProduct = await productApi.update(id, data);
        set((state) => {
          // Actualiza el producto en el array de productos
          const index = state.products.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.products[index] = updatedProduct;
          }
          // Si el producto actualizado es el seleccionado, actualízalo también
          if (state.selectedProduct?.id === id) {
            state.selectedProduct = updatedProduct;
          }
        });
        return updatedProduct;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Error al actualizar producto";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },

    deleteProduct: async (id: string) => {
      try {
        await productApi.delete(id);
        set((state) => {
          // Elimina el producto del array de productos
          state.products = state.products.filter((p) => p.id !== id);
          // Si el producto eliminado es el seleccionado, lo deselecciona
          if (state.selectedProduct?.id === id) {
            state.selectedProduct = null;
          }
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Error al eliminar producto";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },

    updateStock: async (id: string, quantity: number, reason: string) => {
      try {
        const updatedProduct = await productApi.updateStock(
          id,
          quantity,
          reason
        );
        set((state) => {
          // Actualiza el producto en el array de productos
          const index = state.products.findIndex((p) => p.id === id);
          if (index !== -1) {
            state.products[index] = updatedProduct;
          }
          // Si el producto actualizado es el seleccionado, actualízalo también
          if (state.selectedProduct?.id === id) {
            state.selectedProduct = updatedProduct;
          }
        });
        return updatedProduct;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Error al actualizar el stock del producto";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },

    setFilters: (filters: Partial<ProductFilters>) => {
      set((state) => {
        state.filters = { ...state.filters, ...filters };
      });
    },

    clearFilters: () => {
      set((state) => {
        state.filters = {};
      });
    },

    setSelectedProduct: (product: Product | null) => {
      set((state) => {
        state.selectedProduct = product;
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
  }))
);
