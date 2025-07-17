/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { analyticsApi } from "@/lib/api";
import type { Analytics } from "@/lib/types";

interface AnalyticsState {
  analytics: Analytics | null;
  topProducts: any[];
  salesReport: any | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: "day" | "month" | "custom";
  selectedDate: Date | null;
}

interface AnalyticsActions {
  fetchAnalytics: (
    period?: "day" | "month" | "custom",
    date?: Date
  ) => Promise<void>;
  fetchTopProducts: (
    period?: "day" | "week" | "month",
    limit?: number
  ) => Promise<void>;
  fetchSalesReport: (startDate: string, endDate: string) => Promise<void>;
  setSelectedPeriod: (period: "day" | "month" | "custom") => void;
  setSelectedDate: (date: Date | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>()(
  immer((set, get) => ({
    // Estado inicial
    analytics: null,
    topProducts: [],
    salesReport: null,
    loading: false,
    error: null,
    selectedPeriod: "day",
    selectedDate: null,

    // Acciones
    fetchAnalytics: async (
      period?: "day" | "month" | "custom",
      date?: Date
    ) => {
      const selectedPeriod = period || get().selectedPeriod;
      const selectedDate = date !== undefined ? date : get().selectedDate;

      set((state) => {
        state.loading = true;
        state.error = null;
        if (period) state.selectedPeriod = period;
        if (date !== undefined) state.selectedDate = date;
      });

      try {
        const analytics = await analyticsApi.getAnalytics(
          selectedPeriod,
          selectedDate
        );
        set((state) => {
          state.analytics = analytics;
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al cargar analytics";
          state.loading = false;
        });
      }
    },

    fetchTopProducts: async (period = "month", limit = 10) => {
      try {
        const topProducts = await analyticsApi.getTopProducts(period, limit);
        set((state) => {
          state.topProducts = topProducts;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al cargar productos top";
        });
      }
    },

    fetchSalesReport: async (startDate: string, endDate: string) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      try {
        const salesReport = await analyticsApi.getSalesReport(
          startDate,
          endDate
        );
        set((state) => {
          state.salesReport = salesReport;
          state.loading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error =
            error.response?.data?.message || "Error al generar reporte";
          state.loading = false;
        });
      }
    },

    setSelectedPeriod: (period: "day" | "month" | "custom") => {
      set((state) => {
        state.selectedPeriod = period;
      });
    },

    setSelectedDate: (date: Date | null) => {
      set((state) => {
        state.selectedDate = date;
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
