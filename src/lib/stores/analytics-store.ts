/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { Analytics } from "../types";

import { analyticsApi } from "../api";
import { immer } from "zustand/middleware/immer";

interface AnalyticsState {
  analytics: Analytics | null;
  topProducts: any[];
  salesReport: any | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: "day" | "month";
}

interface AnalyticsActions {
  fetchAnalytics: (period?: "day" | "month") => Promise<void>;
  fetchTopProducts: (
    period?: "day" | "week" | "month",
    limit?: number
  ) => Promise<void>;
  fetchSalesReport: (startDate: string, endDate: string) => Promise<void>;
  setSelectedPeriod: (period: "day" | "month") => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>()(
  immer((set, get) => ({
    //Estado inicial
    analytics: null,
    topProducts: [],
    salesReport: null,
    loading: false,
    error: null,
    selectedPeriod: "day",

    //Acciones
    fetchAnalytics: async (period?: "day" | "month") => {
      const selectedPeriod = period || get().selectedPeriod;

      set((state) => {
        state.loading = true;
        state.error = null;
        if (period) state.selectedPeriod = period;
      });

      try {
        const analytics = await analyticsApi.getAnalytics(selectedPeriod);
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

    setSelectedPeriod: (period: "day" | "month") => {
      set((state) => {
        state.selectedPeriod = period;
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
