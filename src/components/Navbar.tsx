"use client";

import useAuth from "@/hooks/useAuth";
import {
  BarChart3,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user || pathname === "/login") return null;

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Productos", href: "/products", icon: Package },
    { name: "Ventas", href: "/sales", icon: ShoppingCart },
    { name: "Reportes", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Sistema de Stock
          </Link>

          <div className="hidden md:flex space-x-4 ">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`${
                      isActive ? "" : "text-gray-600 hover:text-gray-900"
                    } cursor-pointer`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user.role === "ADMIN" && (
            <Link href="/admin/users">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  pathname === "/admin/users" ? "bg-gray-100" : ""
                } cursor-pointer`}
              >
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p>
                    {user.role === "ADMIN" ? "👨‍💼 Administrador" : "👥 Empleado"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuracion</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
