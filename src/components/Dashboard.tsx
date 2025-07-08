"use client";

import { useAnalytics } from "@/hooks/useStores";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesComparison from "./SalesComparison";
import { Badge } from "./ui/badge";
import ProductList from "./ProductList";
import SalesForm from "./SalesForm";
import AddProductForm from "./AddProductForm";
import BarcodeScanner from "./BarcodeScanner";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  // Zustand
  const {
    analytics,
    loading,
    selectedPeriod,
    fetchAnalytics,
    setSelectedPeriod,
  } = useAnalytics();

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod, fetchAnalytics]);

  const handlePeriodChange = (period: "day" | "month") => {
    setSelectedPeriod(period);
    fetchAnalytics(period);
  };

  const handleRefresh = () => {
    fetchAnalytics(selectedPeriod);
  };

  const handleProductAdded = () => {
    handleRefresh();
    setActiveTab("products");
  };

  const handleSaleAdded = () => {
    handleRefresh();
    setActiveTab("overview");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border bg-background p-1">
          <button
            onClick={() => handlePeriodChange("day")}
            className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${
              selectedPeriod === "day"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Hoy{" "}
          </button>
          <button
            onClick={() => handlePeriodChange("month")}
            className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${
              selectedPeriod === "month"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Este Mes
          </button>
        </div>
      </div>

      {/* Metricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas {analytics?.periodLabel}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalSales || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalQuantity || 0} productos vendidos
              {analytics?.quantityChange !== undefined && (
                <span
                  className={`ml-2 ${
                    analytics.quantityChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analytics?.quantityChange >= 0 ? "↗" : "↘"}{" "}
                  {Math.abs(analytics?.quantityChange)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos {analytics?.periodLabel}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.comparisonLabel}
              {analytics?.revenueChange !== undefined && (
                <span
                  className={`ml-2 ${
                    analytics.revenueChange >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analytics.revenueChange >= 0 ? "↗" : "↘"}{" "}
                  {Math.abs(analytics.revenueChange)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className=" h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics?.lowStockProducts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Productos necesitan reposición
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Activos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.activeProductsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.totalInventoryItems || 0} Unidades en inventario
            </p>
          </CardContent>
        </Card>
      </div>

      {/*Tabs prinicipales */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5 space-x-2">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="add-product">Agregar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Comparacion de rendimiento */}
          <SalesComparison analytics={analytics} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top productos */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Productos Mas Vendidos {analytics?.periodLabel}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                  {analytics?.topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge className="secondary">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantitySold} vendidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${product.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock bajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Productos con Stock Bajo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.lowStockProducts?.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {product.model?.brand?.name} {product.model?.name}{" "}
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Stock actual: {product.stock} | Minimo:{" "}
                          {product.minStock}
                        </p>
                      </div>
                      <Badge variant="destructive">Bajo</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <ProductList onRefresh={handleRefresh} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesForm onSaleComplete={handleSaleAdded} />
        </TabsContent>
        <TabsContent value="scanner">
          <BarcodeScanner onSaleComplete={handleRefresh} />
        </TabsContent>
        <TabsContent value="add-product">
          <AddProductForm onProductAdded={handleProductAdded} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
