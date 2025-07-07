import { useAnalyticsStore } from "@/lib/stores/analytics-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProductsStore } from "@/lib/stores/products-store";
import { useSalesStore } from "@/lib/stores/sales-store";
import { useUIStore } from "@/lib/stores/ui-stores";

//* Hook para acceso facil a todos los stores
export const useStores = () => ({
  auth: useAuthStore(),
  products: useProductsStore(),
  sales: useSalesStore(),
  analytics: useAnalyticsStore(),
  ui: useUIStore(),
});

//* Hooks especificos para cada store (mas performantes)
export const useAuth = () => useAuthStore();
export const useProducts = () => useProductsStore();
export const useSales = () => useSalesStore();
export const useAnalytics = () => useAnalyticsStore();
export const useUI = () => useUIStore();

//* Hooks selectores para evitar re-renders innecesarios
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.loading);
export const useCartItems = () => useSalesStore((state) => state.cart);
export const useCartTotal = () =>
  useSalesStore((state) => state.getCartTotal());
export const useProductsLoading = () =>
  useProductsStore((state) => state.loading);
export const useToasts = () => useUIStore((state) => state.toasts);

// ✅ Selectores específicos para productos (más eficientes)
export const useProductsList = () =>
  useProductsStore((state) => state.products);
export const useSelectedProduct = () =>
  useProductsStore((state) => state.selectedProduct);
export const useProductsError = () => useProductsStore((state) => state.error);
export const useProductsFilters = () =>
  useProductsStore((state) => state.filters);
