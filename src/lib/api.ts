import axios from "axios";
import Cookies from "js-cookie";
import {
  Analytics,
  ApiResponse,
  CreateProductForm,
  CreateSaleForm,
  Product,
  ProductFilters,
  Sale,
  SaleFilters,
} from "./types";

//Configuracion base con axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api",
  timeout: 10000,
});

// Interceptor para agregar token de autenticacion
api.interceptors.request.use((config) => {
  const token = Cookies.get("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//Interceptor para manejar errores de autenticacion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("auth-token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API de Autenticacion
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("auth/profile");
    return response.data;
  },
};

// API de Productos
export const productApi = {
  getAll: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    const response = await api.get("/products", { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByBarcode: async (barcode: string): Promise<Product> => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get("/products/low-stock");
    return response.data;
  },

  create: async (data: CreateProductForm): Promise<Product> => {
    const response = await api.post("/products", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateProductForm>
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
  updateStock: async (
    id: string,
    quantity: number,
    reason: string
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}/stock`, {
      quantity,
      reason,
    });
    return response.data;
  },
};

// API de Ventas
export const salesApi = {
  getAll: async (filters?: SaleFilters): Promise<ApiResponse<Sale[]>> => {
    const response = await api.get("/sales", { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  getDaily: async (date?: string) => {
    const response = await api.get("/sales/daily", { params: { date } });
    return response.data;
  },

  getMonthly: async (year?: number, month?: number) => {
    const response = await api.get("/sales/monthly", {
      params: { year, month },
    });
    return response.data;
  },

  create: async (data: CreateSaleForm): Promise<Sale> => {
    const response = await api.post("/sales", data);
    return response.data;
  },
};

//API de Analytics
export const analyticsApi = {
  getAnalytics: async (
    period: "day" | "month" = "month"
  ): Promise<Analytics> => {
    const response = await api.get("/analytics", { params: { period } });
    return response.data;
  },

  getTopProducts: async (
    period: "day" | "week" | "month" = "month",
    limit = 10
  ) => {
    const response = await api.get("analytics/top-products", {
      params: { period, limit },
    });
    return response.data;
  },

  getSalesReport: async (startDate: string, endDate: string) => {
    const response = await api.get("/analytics/sales-report", {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
