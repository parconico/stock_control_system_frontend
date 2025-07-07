"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = Cookies.get("auth-token");

      if (savedToken) {
        setToken(savedToken);
        try {
          const userData = await authApi.getProfile();
          setUser(userData);
        } catch (error) {
          console.error("Error al obtener perfil:", error);
          Cookies.remove("auth-token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const { access_token, user: userData } = response;

      setToken(access_token);
      setUser(userData);
      setError(null);

      // Guardar token en cookies 7 dias
      Cookies.set("auth-token", access_token, { expires: 7 });
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "message" in error) {
        setError(
          (error as { message?: string }).message || "Error al iniciar sesión"
        );
      } else {
        setError("Error al iniciar sesión");
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove("auth-token");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, error, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
