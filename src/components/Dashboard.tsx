"use client";

import { useAnalytics } from "@/hooks/useStores";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarIcon,
  Info,
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
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SalesDetail from "./SalesDetail";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Zustand
  const {
    analytics,
    loading,
    selectedPeriod,
    fetchAnalytics,
    setSelectedPeriod,
    selectedDate,
    setSelectedDate,
  } = useAnalytics();

  useEffect(() => {
    fetchAnalytics(selectedPeriod, selectedDate ?? undefined);
  }, [selectedPeriod, selectedDate, fetchAnalytics]);

  const handlePeriodChange = (period: "day" | "month" | "custom") => {
    setSelectedPeriod(period);
    if (period !== "custom") {
      setSelectedDate(null);
    }
    fetchAnalytics(
      period,
      period === "custom" ? selectedDate ?? undefined : undefined
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setSelectedPeriod("custom");
      setDatePickerOpen(false);
      fetchAnalytics("custom", date);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics(selectedPeriod, selectedDate ?? undefined);
    setActiveTab("sales-history");
  };

  const handleProductAdded = () => {
    handleRefresh();
    setActiveTab("products");
  };

  const handleSaleAdded = () => {
    handleRefresh();
    setActiveTab("sales-history");
  };

  // Función para deshabilitar fechas en el calendario
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    // Deshabilitar hoy y fechas futuras, y fechas muy antiguas
    return compareDate >= today || date < new Date("1900-01-01");
  };

  // Opciones de tabs para el dropdown
  const tabOptions = [
    { value: "overview", label: "Resumen" },
    { value: "products", label: "Productos" },
    { value: "sales", label: "Ventas" },
    { value: "sales-history", label: "Historial de ventas" },
    { value: "scanner", label: "Scanner" },
    { value: "add-product", label: "Agregar" },
  ];

  const getCurrentTabLabel = () => {
    return (
      tabOptions.find((tab) => tab.value === activeTab)?.label || "Resumen"
    );
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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Selector de período y fecha */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="inline-flex rounded-lg border bg-background p-1">
            <button
              onClick={() => handlePeriodChange("day")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                selectedPeriod === "day"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Hoy
            </button>
            <button
              onClick={() => handlePeriodChange("month")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                selectedPeriod === "month"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Este Mes
            </button>
          </div>
          {/* Date Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={selectedPeriod === "custom" ? "default" : "outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal cursor-pointer",
                  !selectedDate &&
                    selectedPeriod === "custom" &&
                    "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate && selectedPeriod === "custom" ? (
                  format(selectedDate, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar fecha específica</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate || undefined}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Metricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">
                  Ventas {analytics?.periodLabel}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Número total de transacciones de venta realizadas en el
                      período seleccionado. Incluye el porcentaje de cambio
                      comparado con el dia anterior.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos {analytics?.periodLabel}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Monto total de dinero generado por las ventas en el
                      período seleccionado. Muestra el crecimiento o
                      decrecimiento comparado con el dia anterior.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
          <Card className=" hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">
                  Stock Bajo
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Cantidad de productos que tienen stock actual por debajo
                      del stock mínimo establecido. Estos productos necesitan
                      reposición urgente.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AlertTriangle className=" h-4 w-4 text-red-500" />
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
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-medium">
                  Productos Activos
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Número total de productos diferentes disponibles en el
                      inventario. Incluye el total de unidades individuales en
                      stock.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
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

        {/* Tabs principales */}
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-6 space-x-2">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Productos
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Ventas
            </TabsTrigger>
            <TabsTrigger
              value="sales-history"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Historial de ventas
            </TabsTrigger>
            <TabsTrigger
              value="scanner"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Scanner
            </TabsTrigger>
            <TabsTrigger
              value="add-product"
              className="flex items-center space-x-2 cursor-pointer"
            >
              Agregar
            </TabsTrigger>
          </TabsList>

          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    <span>{getCurrentTabLabel()}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map((tab) => (
                  <SelectItem
                    key={tab.value}
                    value={tab.value}
                    className="cursor-pointer"
                  >
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="space-y-4">
            {/* Comparacion de rendimiento */}
            <SalesComparison analytics={analytics} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top productos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Productos Mas Vendidos {analytics?.periodLabel}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Lista de los productos con mayor cantidad de ventas en
                          el período seleccionado, ordenados por ingresos
                          generados.
                        </p>
                      </TooltipContent>
                    </Tooltip>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Productos que han alcanzado o están por debajo del
                          stock mínimo establecido. Requieren reposición
                          inmediata para evitar quedarse sin inventario.
                        </p>
                      </TooltipContent>
                    </Tooltip>
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
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock actual: {product.totalStock} | Minimo:{" "}
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
            <ProductList />
          </TabsContent>
          <TabsContent value="sales">
            <SalesForm onSaleComplete={handleSaleAdded} />
          </TabsContent>
          <TabsContent value="sales-history">
            <SalesDetail />
          </TabsContent>
          <TabsContent value="scanner">
            <BarcodeScanner onSaleComplete={handleRefresh} />
          </TabsContent>
          <TabsContent value="add-product">
            <AddProductForm onProductAdded={handleProductAdded} />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
