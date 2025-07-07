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

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendBadge = (change: number) => {
    if (change > 0) return;
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      +{change.toFixed(1)}%
    </Badge>;
    if (change < 0) return;
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      {change.toFixed(1)}%
    </Badge>;
    return <Badge variant="secondary">0%</Badge>;
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación de rendimiento</CardTitle>
        <p className="text-sm text-muted-foreground">
          {analytics.periodLabel} {analytics.comparisonLabel}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ingresos
              </p>
              <p className="text-xl font-bold">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.revenueChange)}
              {getTrendBadge(analytics.revenueChange)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Productos vendidos
              </p>
              <p className="text-xl font-bold">{analytics.totalQuantity}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(analytics.quantityChange)}
              {getTrendBadge(analytics.quantityChange)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Transacciones
              </p>
              <p className="text-xl font-bold">{analytics.totalSales}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div>
                Promedio: $
                {analytics.totalSales > 0
                  ? Math.round(
                      analytics.totalRevenue / analytics.totalSales
                    ).toLocaleString()
                  : 0}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rendimiento general:</span>
            <span
              className={`font-medium ${
                analytics.revenueChange > 0 && analytics.quantityChange > 0
                  ? "text-green-600"
                  : analytics.revenueChange > 0 || analytics.quantityChange > 0
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {analytics.revenueChange > 0 && analytics.quantityChange > 0
                ? "📈 Excelente"
                : analytics.revenueChange > 0 || analytics.quantityChange > 0
                ? "📊 Bueno"
                : "📉 Necesita atención"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
