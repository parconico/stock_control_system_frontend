"use client";

import type { Analytics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";

interface SalesComparisonProps {
  analytics: Analytics | null;
}

export default function SalesComparison({ analytics }: SalesComparisonProps) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">
              Cargando comparación...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number | undefined) => {
    if (!change && change !== 0)
      return <Minus className="h-4 w-4 text-gray-600" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendBadge = (change: number | undefined) => {
    if (!change && change !== 0) return <Badge variant="secondary">N/A</Badge>;

    if (change > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          +{change.toFixed(1)}%
        </Badge>
      );
    }

    if (change < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          {change.toFixed(1)}%
        </Badge>
      );
    }

    return <Badge variant="secondary">0%</Badge>;
  };

  const getPerformanceStatus = () => {
    const revenueChange = analytics.revenueChange || 0;
    const quantityChange = analytics.quantityChange || 0;

    if (revenueChange > 0 && quantityChange > 0) {
      return { text: "📈 Excelente", color: "text-green-600" };
    }
    if (revenueChange > 0 || quantityChange > 0) {
      return { text: "📊 Bueno", color: "text-blue-600" };
    }
    if (revenueChange < 0 || quantityChange < 0) {
      return { text: "📉 Necesita atención", color: "text-red-600" };
    }
    return { text: "📊 Estable", color: "text-gray-600" };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación de Rendimiento</CardTitle>
        <p className="text-sm text-muted-foreground">
          {analytics.periodLabel} {analytics.comparisonLabel}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ingresos */}
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos
              </p>
              <p className="text-xl font-bold">
                ${analytics.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.revenueChange)}
              {getTrendBadge(analytics.revenueChange)}
            </div>
          </div>

          {/* Productos Vendidos */}
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Productos Vendidos
              </p>
              <p className="text-xl font-bold">
                {analytics.totalQuantity || 0}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.quantityChange)}
              {getTrendBadge(analytics.quantityChange)}
            </div>
          </div>

          {/* Transacciones */}
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Transacciones
              </p>
              <p className="text-xl font-bold">{analytics.totalSales || 0}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Promedio: $
                {analytics.totalSales && analytics.totalSales > 0
                  ? Math.round(
                      analytics.totalRevenue / analytics.totalSales
                    ).toLocaleString()
                  : 0}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de rendimiento */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rendimiento general:</span>
            <span className={`font-medium ${performanceStatus.color}`}>
              {performanceStatus.text}
            </span>
          </div>

          {/* Información adicional */}
          <div className="mt-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Cambio en ingresos:</span>
              <span
                className={
                  analytics.revenueChange && analytics.revenueChange > 0
                    ? "text-green-600"
                    : analytics.revenueChange && analytics.revenueChange < 0
                    ? "text-red-600"
                    : ""
                }
              >
                {analytics.revenueChange
                  ? `${
                      analytics.revenueChange > 0 ? "+" : ""
                    }${analytics.revenueChange.toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cambio en cantidad:</span>
              <span
                className={
                  analytics.quantityChange && analytics.quantityChange > 0
                    ? "text-green-600"
                    : analytics.quantityChange && analytics.quantityChange < 0
                    ? "text-red-600"
                    : ""
                }
              >
                {analytics.quantityChange
                  ? `${
                      analytics.quantityChange > 0 ? "+" : ""
                    }${analytics.quantityChange.toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
