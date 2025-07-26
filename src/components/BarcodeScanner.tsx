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
import { PAYMENT_METHOD_OPTIONS } from "@/lib/types";

interface BarcodeScannerProps {
  onSaleComplete: () => void;
}

export default function BarcodeScanner({
  onSaleComplete,
}: BarcodeScannerProps) {
  // ✅ useState para estado LOCAL del formulario
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("EFECTIVO");

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

      // ✅ Limpiar selección de talla anterior
      setSelectedSize("");

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

  const handleSale = async () => {
    if (!selectedProduct || quantity <= 0) return;

    // ✅ Calcular stock total y validar talla seleccionada
    const totalStock =
      selectedProduct.totalStock ||
      selectedProduct.variants?.reduce(
        (sum, variant) => sum + variant.stock,
        0
      ) ||
      0;

    // Si el producto tiene variantes, debe seleccionar una talla
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

    // Validar stock de la talla específica si está seleccionada
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
      await createSale({
        productId: selectedProduct.id,
        size: selectedSize || undefined,
        quantity,
        unitPrice: selectedProduct.price,
        totalPrice: selectedProduct.price * quantity,
        paymentMethod: paymentMethod as
          | "EFECTIVO"
          | "TRANSFERENCIA"
          | "TARJETA_DEBITO"
          | "TARJETA_CREDITO"
          | "QR",
      });

      addToast({
        type: "success",
        title: "Venta registrada",
        description: `${quantity} x ${selectedProduct.name}${
          selectedSize ? ` (${selectedSize})` : ""
        } - $${(selectedProduct.price * quantity).toLocaleString()}`,
      });

      // Limpiar formulario
      setSelectedProduct(null);
      setBarcode("");
      setQuantity(1);
      setSelectedSize("");
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

  // ✅ Calcular stock disponible para la talla seleccionada
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
                  <strong>Precio:</strong> $
                  {selectedProduct.price.toLocaleString()}
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

            {/* ✅ Selector de tallas */}
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

            {/* ✅ Información de talla seleccionada */}
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

            <div className="border-t pt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
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
                    className="w-20"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Método de pago
                  </label>
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

                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    Total: $
                    {(selectedProduct.price * quantity).toLocaleString()}
                  </p>
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
                  className="flex items-center space-x-2 cursor-pointer"
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

      {/* ✅ Mensaje cuando no se encuentra producto */}
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
