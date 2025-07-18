"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User,
  Settings,
  Users,
  Home,
  Building2,
  Info,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || pathname === "/login") return null;

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      description: "Panel principal con métricas y análisis de ventas",
    },
  ];

  // Páginas en desarrollo (comentadas por ahora)
  const upcomingFeatures = [
    { name: "Productos", icon: "Package", status: "En desarrollo" },
    { name: "Ventas", icon: "ShoppingCart", status: "En desarrollo" },
    { name: "Reportes", icon: "BarChart3", status: "Próximamente" },
  ];

  return (
    <TooltipProvider>
      <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo y navegación principal */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Sistema de Stock
                  </h1>
                  <p className="text-xs text-gray-500">Gestión de Inventario</p>
                </div>
              </Link>

              {/* Navegación activa */}
              <div className="hidden md:flex items-center space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Link href={item.href}>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            className={`cursor-pointer ${
                              isActive
                                ? " text-white shadow-md"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            } transition-all duration-200`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {item.name}
                            {isActive && (
                              <Badge
                                variant="secondary"
                                className="ml-2 bg-blue-100 text-blue-800"
                              >
                                Activo
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Indicador de funciones próximas */}
                {/* <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Info className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Más funciones próximamente
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-2">
                        <p className="font-medium">Funciones en desarrollo:</p>
                        {upcomingFeatures.map((feature) => (
                          <div
                            key={feature.name}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{feature.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {feature.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div> */}
              </div>
            </div>

            {/* Sección de usuario */}
            <div className="flex items-center space-x-4">
              {/* Badge de rol de usuario */}
              <div className="hidden sm:flex items-center space-x-2">
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className={
                    user.role === "ADMIN" ? "bg-green-600 text-white" : ""
                  }
                >
                  {user.role === "ADMIN" ? "👨‍💼 Admin" : "👥 Empleado"}
                </Badge>
              </div>

              {/* Acceso a gestión de usuarios (solo admin) */}
              {user.role === "ADMIN" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/admin/users">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`cursor-pointer ${
                          pathname === "/admin/users"
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:text-gray-900"
                        } transition-colors`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Usuarios
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gestionar usuarios del sistema</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Menú de usuario */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:bg-gray-100 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                      <AvatarFallback className="bg-blue-600 text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          user.role === "ADMIN" ? "default" : "secondary"
                        }
                        className={`w-fit ${
                          user.role === "ADMIN" ? "bg-green-600 text-white" : ""
                        }`}
                      >
                        {user.role === "ADMIN"
                          ? "👨‍💼 Administrador"
                          : "👥 Empleado"}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
