/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useProducts, useSales, useUI } from "@/hooks/useStores";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Scan, ShoppingCart, AlertCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PAYMENT_METHOD_OPTIONS, DISCOUNT_TYPE_OPTIONS } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BarcodeScannerProps {
  onSaleComplete: () => void;
}

export default function BarcodeScanner({
  onSaleComplete,
}: BarcodeScannerProps) {
  // Estados locales del formulario
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("EFECTIVO");

  // Estados para descuentos
  const [discountType, setDiscountType] = useState<
    "PERCENTAGE" | "FIXED_AMOUNT"
  >("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);

  // Zustand para estado global
  const {
    fetchProductByBarcode,
    selectedProduct,
    setSelectedProduct,
    loading: productLoading,
    error: productError,
  } = useProducts();
  const { createSale, loading: saleLoading } = useSales();
  const { addToast } = useUI();

  const handleScan = async () => {
    if (!barcode.trim()) return;

    try {
      const product = await fetchProductByBarcode(barcode);
      setSelectedSize("");
      // Limpiar descuentos al escanear nuevo producto
      setHasDiscount(false);
      setDiscountValue("");

      addToast({
        type: "success",
        title: "Producto encontrado",
        description: `${product.brand?.name} ${product.name}`,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Producto no encontrado",
        description: error.message,
      });
    }
  };

  // Calcular precios con descuento
  const calculatePrices = () => {
    if (!selectedProduct) return { subtotal: 0, discountAmount: 0, total: 0 };

    const subtotal = selectedProduct.price * quantity;
    let discountAmount = 0;

    if (hasDiscount && discountValue && Number.parseFloat(discountValue) > 0) {
      const discount = Number.parseFloat(discountValue);
      if (discountType === "PERCENTAGE") {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = Math.min(discount, subtotal);
      }
    }

    const total = subtotal - discountAmount;

    return { subtotal, discountAmount, total };
  };

  const { subtotal, discountAmount, total } = calculatePrices();

  const handleApplyDiscount = () => {
    const value = Number.parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      addToast({
        type: "warning",
        title: "Valor inválido",
        description: "Ingresa un valor válido para el descuento",
      });
      return;
    }

    if (discountType === "PERCENTAGE" && value > 100) {
      addToast({
        type: "warning",
        title: "Descuento inválido",
        description: "El porcentaje no puede ser mayor a 100%",
      });
      return;
    }

    setHasDiscount(true);
    addToast({
      type: "success",
      title: "Descuento aplicado",
      description: `Descuento de ${
        discountType === "PERCENTAGE" ? `${value}%` : formatCurrency(value)
      } aplicado`,
    });
  };

  const handleRemoveDiscount = () => {
    setHasDiscount(false);
    setDiscountValue("");
    addToast({
      type: "info",
      title: "Descuento removido",
      description: "El descuento ha sido removido",
    });
  };

  const handleSale = async () => {
    if (!selectedProduct || quantity <= 0) return;

    const totalStock =
      selectedProduct.totalStock ||
      selectedProduct.variants?.reduce(
        (sum, variant) => sum + variant.stock,
        0
      ) ||
      0;

    if (
      selectedProduct.variants &&
      selectedProduct.variants.length > 0 &&
      !selectedSize
    ) {
      addToast({
        type: "error",
        title: "Selecciona una talla",
        description: "Debes seleccionar una talla antes de procesar la venta",
      });
      return;
    }

    let availableStock = totalStock;
    if (selectedSize && selectedProduct.variants) {
      const selectedVariant = selectedProduct.variants.find(
        (v) => v.size === selectedSize
      );
      availableStock = selectedVariant?.stock || 0;
    }

    if (quantity > availableStock) {
      addToast({
        type: "error",
        title: "Stock insuficiente",
        description: `Solo hay ${availableStock} unidades disponibles${
          selectedSize ? ` en talla ${selectedSize}` : ""
        }`,
      });
      return;
    }

    try {
      const saleData = {
        productId: selectedProduct.id,
        size: selectedSize || undefined,
        quantity,
        unitPrice: selectedProduct.price,
        subtotal: subtotal,
        discountType: hasDiscount ? discountType : undefined,
        discountValue: hasDiscount ? Number.parseFloat(discountValue) : 0,
        discountAmount: hasDiscount ? discountAmount : 0,
        totalPrice: total,
        paymentMethod: paymentMethod as
          | "EFECTIVO"
          | "TRANSFERENCIA"
          | "TARJETA_DEBITO"
          | "TARJETA_CREDITO"
          | "QR",
      };

      await createSale(saleData);

      addToast({
        type: "success",
        title: "Venta registrada",
        description: `${quantity} x ${selectedProduct.name}${
          selectedSize ? ` (${selectedSize})` : ""
        } - ${formatCurrency(total)}${
          hasDiscount ? ` (Descuento: ${formatCurrency(discountAmount)})` : ""
        }`,
      });

      // Limpiar formulario
      setSelectedProduct(null);
      setBarcode("");
      setQuantity(1);
      setSelectedSize("");
      setHasDiscount(false);
      setDiscountValue("");
      onSaleComplete();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error al registrar venta",
        description: error.message,
      });
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const isLoading = productLoading || saleLoading;

  const getAvailableStock = () => {
    if (!selectedProduct) return 0;

    const totalStock =
      selectedProduct.totalStock ||
      selectedProduct.variants?.reduce(
        (sum, variant) => sum + variant.stock,
        0
      ) ||
      0;

    if (selectedSize && selectedProduct.variants) {
      const selectedVariant = selectedProduct.variants.find(
        (v) => v.size === selectedSize
      );
      return selectedVariant?.stock || 0;
    }

    return totalStock;
  };

  const availableStock = getAvailableStock();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Scanner de Código de Barras</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Escanee o ingrese el código de barras"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyUp={handleBarcodeKeyPress}
              className="font-mono"
              autoFocus
            />
            <Button
              onClick={handleScan}
              disabled={isLoading || !barcode.trim()}
            >
              {productLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Producto Escaneado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedProduct.name}
                </h3>
                <p className="text-muted-foreground">
                  {selectedProduct.brand?.name}
                </p>
                <div className="flex space-x-2 mt-2">
                  <Badge variant="outline">{selectedProduct.gender}</Badge>
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                  {selectedProduct.color && (
                    <Badge variant="outline">{selectedProduct.color}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p>
                  <strong>Precio:</strong>{" "}
                  {formatCurrency(selectedProduct.price)}
                </p>
                <p>
                  <strong>Stock total:</strong>{" "}
                  {selectedProduct.totalStock ||
                    selectedProduct.variants?.reduce(
                      (sum, variant) => sum + variant.stock,
                      0
                    ) ||
                    0}
                </p>
                <p>
                  <strong>Código:</strong>{" "}
                  <span className="font-mono">{selectedProduct.barcode}</span>
                </p>
              </div>
            </div>

            {/* Selector de tallas */}
            {selectedProduct.variants &&
              selectedProduct.variants.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-sm font-medium">
                    Seleccionar talla:
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedProduct.variants
                      .filter((variant) => variant.stock > 0)
                      .map((variant) => (
                        <Button
                          key={variant.id}
                          variant={
                            selectedSize === variant.size
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSize(variant.size)}
                          className="flex flex-col h-auto py-2 cursor-pointer"
                        >
                          <span className="font-medium">{variant.size}</span>
                          <span className="text-xs opacity-75">
                            Stock: {variant.stock}
                          </span>
                        </Button>
                      ))}
                  </div>

                  {selectedProduct.variants.filter((v) => v.stock > 0)
                    .length === 0 && (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        No hay tallas con stock disponible
                      </span>
                    </div>
                  )}
                </div>
              )}

            {/* Información de talla seleccionada */}
            {selectedSize && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    Talla seleccionada: {selectedSize}
                  </span>
                  <span className="text-sm text-blue-600">
                    Stock disponible: {availableStock}
                  </span>
                </div>
              </div>
            )}

            {/* Sección de descuentos */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-3 block">
                Aplicar Descuento (Opcional)
              </Label>

              {hasDiscount ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-medium">
                      ✓ Descuento aplicado:{" "}
                      {discountType === "PERCENTAGE"
                        ? `${discountValue}%`
                        : formatCurrency(Number.parseFloat(discountValue))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      className="text-xs bg-transparent"
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={discountType}
                      onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Button
                    onClick={handleApplyDiscount}
                    disabled={
                      !discountValue || Number.parseFloat(discountValue) <= 0
                    }
                    className="w-full cursor-pointer bg-transparent"
                    variant="outline"
                  >
                    Aplicar Descuento
                  </Button>
                </div>
              )}
            </div>

            {/* Resumen de precios */}
            <div className="border-t pt-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {hasDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Cantidad:
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Number.parseInt(e.target.value) || 1)
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Método de pago:</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue placeholder="Seleccionar método de pago" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSale}
                  disabled={
                    isLoading ||
                    quantity <= 0 ||
                    quantity > availableStock ||
                    (selectedProduct.variants &&
                      selectedProduct.variants.length > 0 &&
                      !selectedSize)
                  }
                  className="flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {saleLoading ? "Procesando..." : "Registrar Venta"}
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no se encuentra producto */}
      {productError && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground">
                No se encontró el producto: {barcode}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifica el código de barras e intenta nuevamente
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
