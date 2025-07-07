/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuth from "@/hooks/useAuth";
import { AlertCircle, Eye, EyeOff, Info, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const router = useRouter();

  //Zustand
  const {
    user,
    login,
    loading: globalLoading,
    error: globalError,
    clearError,
  } = useAuth();

  // Redirigir si ya esta autenticado
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  //Limpiar errores cuando el usuario empiece a escribir
  useEffect(() => {
    if (localError) setLocalError("");
    if (globalError) clearError();
  }, [email, password, clearError, globalError, localError]);

  const validateForm = () => {
    if (!email.trim()) {
      setLocalError("El email es requerido");
      return false;
    }
    if (!email.includes("@")) {
      setLocalError("Ingresa un email valido");
      return false;
    }
    if (!password.trim()) {
      setLocalError("La contraseña es requerida");
      return false;
    }
    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //Validacion local con useState
    if (!validateForm()) return;

    setLocalLoading(true);
    setLocalError("");

    try {
      // Accion global con zustand
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      // El error global ya se maneja con zustand
      console.error("Error de login:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Mostrar error local o global
  const displayError = localError || globalError;
  const isLoading = localLoading || globalLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Sistema de Stock
          </CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informacion de credenciales de prueba */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Credenciales de prueba:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    // onClick={() => fillCredentials("admin")}
                    className="h-auto p-2 flex flex-col"
                  >
                    <span className="fontt-medium">👨‍💼 Admin</span>
                    <span className="text-xs opacity-70">
                      admin@sistema-stock.com
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    // onClick={() => fillCredentials("employee")}
                    className="h-auto p-2 flex flex-col"
                  >
                    <span className="font-medium">👥 Empleado</span>
                    <span className="text-xs opacity-70">
                      empleado@sistema-stock.com
                    </span>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sistema-stock.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={localError && !email ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={localError && !password ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
