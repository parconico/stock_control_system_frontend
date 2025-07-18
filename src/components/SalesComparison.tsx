"use client";

import type { Analytics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Minus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Target,
  Info,
  BarChart3,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          +{change.toFixed(1)}%
        </Badge>
      );
    }
    if (change < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
          {change.toFixed(1)}%
        </Badge>
      );
    }
    return <Badge variant="secondary">0%</Badge>;
  };

  const getPerformanceStatus = () => {
    const revenueChange = analytics.revenueChange || 0;
    const quantityChange = analytics.quantityChange || 0;

    if (revenueChange > 10 && quantityChange > 10) {
      return {
        text: "🚀 Excepcional",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        progress: 100,
      };
    }
    if (revenueChange > 0 && quantityChange > 0) {
      return {
        text: "📈 Excelente",
        color: "text-green-600",
        bgColor: "bg-green-50",
        progress: 85,
      };
    }
    if (revenueChange > 0 || quantityChange > 0) {
      return {
        text: "📊 Bueno",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        progress: 65,
      };
    }
    if (revenueChange < -10 || quantityChange < -10) {
      return {
        text: "🔴 Crítico",
        color: "text-red-600",
        bgColor: "bg-red-50",
        progress: 20,
      };
    }
    if (revenueChange < 0 || quantityChange < 0) {
      return {
        text: "📉 Necesita atención",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        progress: 40,
      };
    }
    return {
      text: "📊 Estable",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      progress: 50,
    };
  };

  const performanceStatus = getPerformanceStatus();
  const averageTicket =
    analytics.totalSales && analytics.totalSales > 0
      ? analytics.totalRevenue / analytics.totalSales
      : 0;

  // Calcular métricas adicionales
  const productivityScore = Math.min(
    100,
    Math.max(
      0,
      ((analytics.revenueChange || 0) + (analytics.quantityChange || 0)) / 2 +
        50
    )
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header con resumen general */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">
                  Análisis de Rendimiento
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Comparación detallada del rendimiento actual vs período
                      anterior. Incluye métricas clave y análisis de tendencias.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${performanceStatus.bgColor} ${performanceStatus.color}`}
              >
                {performanceStatus.text}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.periodLabel} {analytics.comparisonLabel}
            </p>
          </CardHeader>
        </Card>

        {/* Métricas principales mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ingresos */}
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Ingresos
                  </span>
                </div>
                {getTrendIcon(analytics.revenueChange)}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-700">
                  ${analytics.totalRevenue?.toLocaleString() || 0}
                </p>
                <div className="flex items-center justify-between">
                  {getTrendBadge(analytics.revenueChange)}
                  <span className="text-xs text-muted-foreground">
                    vs período anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos Vendidos */}
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Productos
                  </span>
                </div>
                {getTrendIcon(analytics.quantityChange)}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-700">
                  {analytics.totalQuantity || 0}
                </p>
                <div className="flex items-center justify-between">
                  {getTrendBadge(analytics.quantityChange)}
                  <span className="text-xs text-muted-foreground">
                    unidades vendidas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transacciones */}
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Transacciones
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-purple-700">
                  {analytics.totalSales || 0}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {analytics.totalSales || 0} ventas
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    realizadas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Promedio */}
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Ticket Promedio
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-orange-700">
                  ${Math.round(averageTicket).toLocaleString()}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Por venta
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    promedio
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análisis de rendimiento detallado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Análisis de Productividad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de progreso de rendimiento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Score de Productividad
                </span>
                <span className={`font-medium ${performanceStatus.color}`}>
                  {Math.round(productivityScore)}%
                </span>
              </div>
              <Progress value={productivityScore} className="h-2" />
            </div>

            {/* Métricas de cambio detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Cambio en ingresos:
                  </span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analytics.revenueChange)}
                    <span
                      className={
                        analytics.revenueChange && analytics.revenueChange > 0
                          ? "text-green-600 font-medium"
                          : analytics.revenueChange &&
                            analytics.revenueChange < 0
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {analytics.revenueChange
                        ? `${
                            analytics.revenueChange > 0 ? "+" : ""
                          }${analytics.revenueChange.toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Cambio en cantidad:
                  </span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(analytics.quantityChange)}
                    <span
                      className={
                        analytics.quantityChange && analytics.quantityChange > 0
                          ? "text-green-600 font-medium"
                          : analytics.quantityChange &&
                            analytics.quantityChange < 0
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
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

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Eficiencia de ventas:
                  </span>
                  <span className="font-medium">
                    {analytics.totalQuantity && analytics.totalSales
                      ? (
                          analytics.totalQuantity / analytics.totalSales
                        ).toFixed(1)
                      : "0"}{" "}
                    productos/venta
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Rendimiento general:
                  </span>
                  <span className={`font-medium ${performanceStatus.color}`}>
                    {performanceStatus.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Insights y recomendaciones */}
            <div
              className={`mt-4 p-3 rounded-lg ${performanceStatus.bgColor} border`}
            >
              <div className="flex items-start space-x-2">
                <div className="mt-0.5">
                  {analytics.revenueChange && analytics.revenueChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : analytics.revenueChange && analytics.revenueChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="text-sm">
                  <p className={`font-medium ${performanceStatus.color}`}>
                    {analytics.revenueChange && analytics.revenueChange > 10
                      ? "¡Excelente rendimiento! Las ventas están creciendo significativamente."
                      : analytics.revenueChange && analytics.revenueChange > 0
                      ? "Buen rendimiento. Las ventas muestran una tendencia positiva."
                      : analytics.revenueChange && analytics.revenueChange < -10
                      ? "Rendimiento crítico. Se requiere atención inmediata para mejorar las ventas."
                      : analytics.revenueChange && analytics.revenueChange < 0
                      ? "Las ventas han disminuido. Considera revisar estrategias de marketing."
                      : "Rendimiento estable. Mantén las estrategias actuales."}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Ticket promedio: $
                    {Math.round(averageTicket).toLocaleString()} •
                    Productividad: {Math.round(productivityScore)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
