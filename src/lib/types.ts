export interface Brand {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  brand?: Brand;
  barcode: string;
  gender: "HOMBRE" | "MUJER";
  category:
    | "BUZO"
    | "CAMPERA"
    | "PANTALON"
    | "REMERA"
    | "MEDIAS"
    | "GORRA"
    | "BOTELLA"
    | "RINONERA"
    | "OTROS";
  size?: string;
  color?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  variants?: ProductVariant[];
  totalStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  [x: string]: any;
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod:
    | "EFECTIVO"
    | "TRANSFERENCIA"
    | "TARJETA_DEBITO"
    | "TARJETA_CREDITO"
    | "QR";
  saleDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  period: "day" | "month";
  totalRevenue: number;
  totalQuantity: number;
  totalSales: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    product?: Product;
  }>;
  lowStockProducts: Product[];
  revenueChange: number;
  quantityChange: number;
  periodLabel: string;
  comparisonLabel: string;
  activeProductsCount: number;
  totalInventoryItems: number;
}

// DTOs para requests
// Actualizar CreateProductForm para que coincida

export interface ProductVariantInput {
  size: string;
  stock: number;
}

export type Category =
  | "BUZO"
  | "CAMPERA"
  | "PANTALON"
  | "REMERA"
  | "MEDIAS"
  | "GORRA"
  | "BOTELLA"
  | "RINONERA"
  | "OTROS";

export interface CreateProductForm {
  name: string;
  brandId: string;
  barcode: string;
  gender: "HOMBRE" | "MUJER" | "UNISEX";
  category: Category;
  color?: string;
  price: number;
  cost: number;
  variants: ProductVariantInput[];
  minStock: number;
}

export interface CreateSaleForm {
  productId: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Filtros y paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductFilters extends PaginationParams {
  search?: string;
  brandId?: string;
  // modelId?: string;
  gender?: "HOMBRE" | "MUJER";
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean;
  isActive?: boolean;
}

//Tipos para formulario
export interface CreateSaleForm {
  productId: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod:
    | "EFECTIVO"
    | "TRANSFERENCIA"
    | "TARJETA_DEBITO"
    | "TARJETA_CREDITO"
    | "QR";
  saleDate?: string;
}

export interface CreateUserForm {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "EMPLOYEE";
}

export interface SaleFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Constantes para opciones de formularios
export const GENDER_OPTIONS = [
  { value: "HOMBRE", label: "Hombre" },
  { value: "MUJER", label: "Mujer" },
  { value: "UNISEX", label: "Unisex" },
] as const;

export const CATEGORY_OPTIONS = [
  { value: "BUZO", label: "Buzo" },
  { value: "CAMPERA", label: "Campera" },
  { value: "PANTALON", label: "Pantalón" },
  { value: "REMERA", label: "Remera" },
  { value: "MEDIAS", label: "Medias" },
  { value: "GORRA", label: "Gorra" },
  { value: "BOTELLA", label: "Botella" },
  { value: "RINONERA", label: "Riñonera" },
  { value: "OTROS", label: "Otros" },
] as const;

export const SIZE_OPTIONS = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA_DEBITO", label: "Tarjeta de Débito" },
  { value: "TARJETA_CREDITO", label: "Tarjeta de Crédito" },
  { value: "QR", label: "Código QR" },
] as const;

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  size?: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementFilters extends PaginationParams {
  productId?: string;
  type?: "IN" | "OUT" | "ADJUSTMENT";
  startDate?: string;
  endDate?: string;
}
