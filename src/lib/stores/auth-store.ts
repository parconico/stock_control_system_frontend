/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { authApi } from "@/lib/api";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set) => ({
      //Estado inicial
      user: null,
      token: null,
      loading: false,
      error: null,

      //Acciones
      login: async (email: string, password: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });
        try {
          const response = await authApi.login(email, password);
          const { access_token, user } = response;

          // Guardar token en cookies
          Cookies.set("auth-token", access_token, { expires: 7 });

          set((state) => {
            state.user = user;
            state.token = access_token;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error =
              error.response?.data?.message || "Error al iniciar sesion";
            state.loading = false;
          });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove("auth-token");
        set((state) => {
          state.user = null;
          state.token = null;
          state.error = null;
        });
      },

      setUser: (user: User) => {
        set((state) => {
          state.user = user;
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

      initializeAuth: async () => {
        const token = Cookies.get("auth-token");

        if (token) {
          set((state) => {
            state.token = token;
            state.loading = true;
          });

          try {
            const user = await authApi.getProfile();
            set((state) => {
              state.user = user;
              state.loading = false;
            });
          } catch {
            // Token invalido, limpiar
            Cookies.remove("auth-token");
            set((state) => {
              state.token = null;
              state.loading = false;
            });
          }
        }
      },
    })),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
