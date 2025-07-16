import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { salesApi } from "@/lib/api";
import type { Sale, SaleFilters, CreateSaleForm, Product } from "@/lib/types";

interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string; // Agregamos esta propiedad para la talla seleccionada
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
  addToCart: (
    product: Product,
    quantity: number,
    selectedSize?: string
  ) => void; // Modificado para aceptar selectedSize
  removeFromCart: (productId: string, selectedSize?: string) => void; // Modificado para aceptar selectedSize
  updateCartQuantity: (
    productId: string,
    quantity: number,
    selectedSize?: string
  ) => void; // Modificado para aceptar selectedSize
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
    // Estado inicial
    sales: [],
    cart: [],
    loading: false,
    error: null,
    filters: {},
    meta: null,

    // Acciones
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
      console.log("💰 Creando venta:", data);

      try {
        const newSale = await salesApi.create(data);
        console.log("✅ Venta creada exitosamente:", newSale);

        set((state) => {
          state.sales.unshift(newSale);
        });

        // ✅ Importar y actualizar el stock en el store de productos
        try {
          const { useProductsStore } = await import("./products-store");
          const productsStore = useProductsStore.getState();

          console.log("🔄 Actualizando stock local:", {
            productId: data.productId,
            size: data.size,
            quantityChange: -data.quantity,
          });

          if (productsStore.updateProductStock) {
            productsStore.updateProductStock(
              data.productId,
              data.size,
              -data.quantity
            );
            console.log("✅ Stock actualizado localmente");
          } else {
            console.warn("⚠️ updateProductStock no disponible");
          }
        } catch (importError) {
          console.error("❌ Error importando products store:", importError);
        }
        return newSale;
      } catch (error: any) {
        console.error("❌ Error creando venta:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al registrar venta";
        set((state) => {
          state.error = errorMessage;
        });
        throw new Error(errorMessage);
      }
    },
    // Modificado para aceptar selectedSize
    addToCart: (product: Product, quantity: number, selectedSize?: string) => {
      console.log("🛒 Intentando agregar al carrito:", {
        productId: product.id,
        productName: product.name,
        quantity,
        selectedSize,
        productTotalStock: product.totalStock,
        productVariants: product.variants,
      });

      set((state) => {
        let maxStockForSize = 0;
        let variantFound = false;

        if (selectedSize && product.variants) {
          const variant = product.variants.find((v) => v.size === selectedSize);
          if (variant) {
            maxStockForSize = variant.stock;
            variantFound = true;
          }
        } else {
          // Fallback for products without explicit sizes or if no size is selected
          maxStockForSize =
            product.totalStock ||
            product.variants?.reduce((sum, v) => sum + v.stock, 0) ||
            0;
          variantFound = true; // Consider it found if we're using total stock
        }

        if (!variantFound || maxStockForSize <= 0) {
          state.error = `${product.name}${
            selectedSize ? ` (Talla: ${selectedSize})` : ""
          } no tiene stock disponible`;
          console.log("❌ Sin stock disponible");
          return;
        }

        // Buscar si el item ya existe en el carrito con la misma talla
        const existingItem = state.cart.find(
          (item) =>
            item.product.id === product.id && item.selectedSize === selectedSize
        );

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity <= maxStockForSize) {
            existingItem.quantity = newQuantity;
            console.log("✅ Cantidad actualizada en carrito:", newQuantity);
          } else {
            state.error = `Solo hay ${maxStockForSize} unidades disponibles de ${
              product.name
            }${selectedSize ? ` (Talla: ${selectedSize})` : ""}`;
            console.log("❌ Excede stock disponible");
          }
        } else {
          if (quantity <= maxStockForSize) {
            // Asegurar que el producto tenga totalStock calculado
            const productWithStock = {
              ...product,
              totalStock:
                product.totalStock ||
                product.variants?.reduce((sum, v) => sum + v.stock, 0) ||
                0,
            };
            state.cart.push({
              product: productWithStock,
              quantity,
              selectedSize,
            });
            console.log("✅ Producto agregado al carrito");
          } else {
            state.error = `Solo hay ${maxStockForSize} unidades disponibles de ${
              product.name
            }${selectedSize ? ` (Talla: ${selectedSize})` : ""}`;
            console.log("❌ Cantidad excede stock");
          }
        }

        // Limpiar error anterior si la operación fue exitosa
        if (
          state.error &&
          (existingItem
            ? existingItem.quantity + quantity <= maxStockForSize
            : quantity <= maxStockForSize)
        ) {
          state.error = null;
        }
      });
    },
    // Modificado para aceptar selectedSize
    removeFromCart: (productId: string, selectedSize?: string) => {
      set((state) => {
        state.cart = state.cart.filter(
          (item) =>
            !(
              item.product.id === productId &&
              item.selectedSize === selectedSize
            )
        );
        console.log(
          "🗑️ Producto removido del carrito:",
          productId,
          selectedSize
        );
      });
    },
    // Modificado para aceptar selectedSize
    updateCartQuantity: (
      productId: string,
      quantity: number,
      selectedSize?: string
    ) => {
      set((state) => {
        const item = state.cart.find(
          (item) =>
            item.product.id === productId && item.selectedSize === selectedSize
        );
        if (!item) return;

        if (quantity <= 0) {
          state.cart = state.cart.filter(
            (i) =>
              !(i.product.id === productId && i.selectedSize === selectedSize)
          );
          console.log(
            "🗑️ Producto removido por cantidad 0:",
            productId,
            selectedSize
          );
        } else {
          let maxStockForSize = 0;
          if (item.selectedSize && item.product.variants) {
            const variant = item.product.variants.find(
              (v) => v.size === item.selectedSize
            );
            if (variant) {
              maxStockForSize = variant.stock;
            }
          } else {
            maxStockForSize =
              item.product.totalStock ||
              item.product.variants?.reduce((sum, v) => sum + v.stock, 0) ||
              0;
          }

          if (quantity <= maxStockForSize) {
            item.quantity = quantity;
            console.log("📝 Cantidad actualizada:", quantity);
            state.error = null; // Limpiar error si la actualización fue exitosa
          } else {
            state.error = `Solo hay ${maxStockForSize} unidades disponibles para la talla ${
              item.selectedSize || "Única"
            }`;
            console.log("❌ Cantidad excede stock en actualización");
          }
        }
      });
    },
    clearCart: () => {
      set((state) => {
        state.cart = [];
        state.error = null;
        console.log("🧹 Carrito limpiado");
      });
    },
    processCart: async () => {
      const { cart } = get();
      if (cart.length === 0) {
        const error = "El carrito está vacío";
        console.log("❌", error);
        set((state) => {
          state.error = error;
        });
        throw new Error(error);
      }
      console.log(
        "🔄 Iniciando procesamiento del carrito con",
        cart.length,
        "items"
      );
      set((state) => {
        state.loading = true;
        state.error = null;
      });
      try {
        // ✅ Procesar cada item del carrito secuencialmente
        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          console.log(`📦 Procesando item ${i + 1}/${cart.length}:`, {
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            selectedSize: item.selectedSize, // Log the selected size
          });

          const saleData: CreateSaleForm = {
            productId: item.product.id,
            size: item.selectedSize, // Usar la talla seleccionada del item del carrito
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * item.quantity,
          };
          console.log("📋 Datos de venta a enviar:", saleData);
          await get().createSale(saleData);
          console.log(`✅ Item ${i + 1} procesado exitosamente`);
        }
        set((state) => {
          state.cart = [];
          state.loading = false;
        });
        console.log("🎉 Carrito procesado completamente");
        // Refrescar ventas
        await get().fetchSales();
        console.log("🔄 Lista de ventas actualizada");
      } catch (error: any) {
        console.error("❌ Error procesando carrito:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Error al procesar venta";
        set((state) => {
          state.error = errorMessage;
          state.loading = false;
        });
        throw new Error(errorMessage);
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
