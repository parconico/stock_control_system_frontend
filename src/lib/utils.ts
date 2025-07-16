import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStockStatus(
  stock: number,
  minStock: number
): {
  status: "high" | "medium" | "low" | "out";
  label: string;
  className: string;
} {
  if (stock === 0) {
    return {
      status: "out",
      label: "Sin Stock",
      className: "stock-out",
    };
  }
  if (stock < minStock) {
    return {
      status: "low",
      label: "Stock Bajo",
      className: "stock-low",
    };
  }
  if (stock < minStock * 1) {
    return {
      status: "medium",
      label: "Stock Medio",
      className: "stock-medium",
    };
  }
  return {
    status: "high",
    label: "Stock Alto",
    className: "stock-high",
  };
}
