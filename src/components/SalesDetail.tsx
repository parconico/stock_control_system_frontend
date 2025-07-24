"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Download,
  Search,
  Filter,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/types";
import { useSales, useUI } from "@/hooks/useStores";

export default function SalesDetail() {
  const { sales, loading, fetchSales } = useSales();
  const { addToast } = useUI();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  useEffect(() => {
    fetchSales({
      page: 1,
      limit: 100,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    });
  }, [fetchSales, startDate, endDate]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "EFECTIVO":
        return <Banknote className="h-4 w-4" />;
      case "TRANSFERENCIA":
        return <Smartphone className="h-4 w-4" />;
      case "TARJETA_DEBITO":
      case "TARJETA_CREDITO":
        return <CreditCard className="h-4 w-4" />;
      case "CODIGO_QR":
        return <QrCode className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const option = PAYMENT_METHOD_OPTIONS.find((opt) => opt.value === method);
    return option ? option.label : method;
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "EFECTIVO":
        return "bg-green-100 text-green-800";
      case "TRANSFERENCIA":
        return "bg-blue-100 text-blue-800";
      case "TARJETA_DEBITO":
        return "bg-purple-100 text-purple-800";
      case "TARJETA_CREDITO":
        return "bg-orange-100 text-orange-800";
      case "CODIGO_QR":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesPaymentMethod =
      selectedPaymentMethod === "all" ||
      sale.paymentMethod === selectedPaymentMethod;
    return matchesSearch && matchesPaymentMethod;
  });

  const exportToCSV = () => {
    const csvData = filteredSales.map((sale) => ({
      Fecha: format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", {
        locale: es,
      }),
      Producto: sale.product?.name || "N/A",
      Marca: sale.product?.brand?.name || "N/A",
      Talla: sale.product?.variants?.[0]?.size || "N/A",
      Cantidad: sale.quantity,
      "Precio Unitario": sale.unitPrice,
      Total: sale.totalPrice,
      "Método de Pago": getPaymentMethodLabel(sale.paymentMethod),
      Notas: sale.notes || "",
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ventas_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: "success",
      title: "Exportación exitosa",
      description: "El archivo CSV se ha descargado correctamente",
    });
  };

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + sale.totalPrice,
    0
  );
  const totalQuantity = filteredSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando historial de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar producto</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre del producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-2">
              <label className="text-sm font-medium ">Método de pago</label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div className="space-y-2">
              <label className="text-sm font-medium ">Fecha inicio</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild className="cursor-pointer">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal ",
                      !startDate && "text-muted-foreground "
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "dd/MM/yyyy", { locale: es })
                      : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setStartDateOpen(false);
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha fin</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild className="cursor-pointer">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate
                      ? format(endDate, "dd/MM/yyyy", { locale: es })
                      : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setEndDateOpen(false);
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <span>{filteredSales.length} ventas</span>
              <span>{totalQuantity} productos</span>
              <span>{formatCurrency(totalRevenue)} total</span>
            </div>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Historial de Ventas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron ventas
                </p>
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{sale.product?.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {sale.product?.brand?.name}
                      </Badge>
                      {sale.product?.variants?.[0]?.size && (
                        <Badge variant="outline" className="text-xs">
                          Talla: {sale.product?.variants?.[0]?.size}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Cantidad: {sale.quantity}</span>
                      <span>Precio: {formatCurrency(sale.unitPrice)}</span>
                      <span>
                        {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    {sale.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notas: {sale.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                        getPaymentMethodColor(sale.paymentMethod)
                      )}
                    >
                      {getPaymentMethodIcon(sale.paymentMethod)}
                      <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(sale.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
