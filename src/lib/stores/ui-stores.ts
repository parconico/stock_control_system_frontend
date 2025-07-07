/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
}

interface UIState {
  toasts: Toast[];
  modals: Modal[];
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  loading: {
    global: boolean;
    [key: string]: boolean;
  };
}

interface UIActions {
  // Toasts
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Modals
  openModal: (modal: Omit<Modal, "id">) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
  immer((set, get) => ({
    // Estado inicial
    toasts: [],
    modals: [],
    sidebarOpen: false,
    theme: "system",
    loading: {
      global: false,
    },

    // Acciones para Toasts
    addToast: (toast) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...toast, id };

      set((state) => {
        state.toasts.push(newToast);
      });

      // Auto-remove después del duration
      if (toast.duration !== 0) {
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 5000);
      }
    },

    removeToast: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter((toast) => toast.id !== id);
      });
    },

    clearToasts: () => {
      set((state) => {
        state.toasts = [];
      });
    },

    // Acciones para Modals
    openModal: (modal) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newModal = { ...modal, id };

      set((state) => {
        state.modals.push(newModal);
      });
    },

    closeModal: (id) => {
      set((state) => {
        state.modals = state.modals.filter((modal) => modal.id !== id);
      });
    },

    closeAllModals: () => {
      set((state) => {
        state.modals = [];
      });
    },

    // Acciones para Sidebar
    toggleSidebar: () => {
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      });
    },

    setSidebarOpen: (open) => {
      set((state) => {
        state.sidebarOpen = open;
      });
    },

    // Acciones para Theme
    setTheme: (theme) => {
      set((state) => {
        state.theme = theme;
      });

      // Aplicar tema al DOM
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        // System theme
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        document.documentElement.classList.toggle("dark", isDark);
      }
    },

    // Acciones para Loading
    setGlobalLoading: (loading) => {
      set((state) => {
        state.loading.global = loading;
      });
    },

    setLoading: (key, loading) => {
      set((state) => {
        state.loading[key] = loading;
      });
    },

    clearLoading: () => {
      set((state) => {
        state.loading = { global: false };
      });
    },
  }))
);
