"use client";

import { useSales, useUI, useProducts, useAnalytics } from "@/hooks/useStores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/types";
import { useState } from "react";

interface CartSummaryProps {
  onSaleComplete?: () => void;
}

export default function CartSummary({ onSaleComplete }: CartSummaryProps) {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processCart,
    getCartTotal,
    getCartItemCount,
    loading,
    error,
    clearError,
  } = useSales();
  const { addToast } = useUI();
  const { fetchProducts } = useProducts();
  const { fetchAnalytics } = useAnalytics();

  const total = getCartTotal();
  const itemCount = getCartItemCount();
  const [paymentMethod, setPaymentMethod] = useState<string>("EFECTIVO");

  const handleProcessCart = async () => {
    console.log("🚀 Iniciando procesamiento desde CartSummary");

    try {
      clearError();
      await processCart(
        paymentMethod as
          | "EFECTIVO"
          | "TRANSFERENCIA"
          | "TARJETA_DEBITO"
          | "TARJETA_CREDITO"
          | "CODIGO_QR"
      );

      addToast({
        type: "success",
        title: "Venta procesada exitosamente",
        description: `Se procesaron ${itemCount} productos por ${formatCurrency(
          total
        )}`,
      });

      // ✅ Refrescar datos después de la venta
      console.log("🔄 Refrescando datos del sistema...");
      await fetchProducts();
      await fetchAnalytics();
      console.log("✅ Sistema actualizado");

      if (onSaleComplete) {
        onSaleComplete();
      }
    } catch (error: unknown) {
      console.error("❌ Error en handleProcessCart:", error);
      const err = error as { message?: string };
      addToast({
        type: "error",
        title: "Error al procesar venta",
        description: err.message || "Error desconocido",
      });
    }
  };

  const handleUpdateQuantity = (
    productId: string,
    newQuantity: number,
    selectedSize?: string
  ) => {
    const item = cart.find(
      (item) =>
        item.product.id === productId && item.selectedSize === selectedSize
    );
    if (!item) return;

    // ✅ Calcular stock específico para la talla seleccionada
    let maxStock = 0;
    if (item.selectedSize && item.product.variants) {
      const variant = item.product.variants.find(
        (v) => v.size === item.selectedSize
      );
      maxStock = variant ? variant.stock : 0;
    } else {
      // Fallback para productos sin tallas específicas
      maxStock =
        item.product.totalStock ||
        item.product.variants?.reduce((sum, v) => sum + v.stock, 0) ||
        0;
    }

    if (newQuantity > maxStock) {
      addToast({
        type: "warning",
        title: "Stock insuficiente",
        description: `Solo hay ${maxStock} unidades disponibles${
          item.selectedSize ? ` para la talla ${item.selectedSize}` : ""
        }`,
      });
      return;
    }

    updateCartQuantity(productId, newQuantity, selectedSize);
  };

  const handleRemoveItem = (productId: string, selectedSize?: string) => {
    const item = cart.find(
      (item) =>
        item.product.id === productId && item.selectedSize === selectedSize
    );
    removeFromCart(productId, selectedSize);

    if (item) {
      addToast({
        type: "info",
        title: "Producto removido",
        description: `${item.product.name}${
          item.selectedSize ? ` (Talla: ${item.selectedSize})` : ""
        } se removió del carrito`,
      });
    }
  };

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">El carrito está vacío</p>
          <p className="text-sm text-muted-foreground mt-1">
            Busca productos arriba para agregarlos al carrito
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Carrito de Ventas</span>
          </span>
          <Badge variant="secondary">{itemCount} items</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
          {cart.map((item) => {
            // ✅ Calcular stock específico para la talla seleccionada
            let maxStock = 0;
            if (item.selectedSize && item.product.variants) {
              const variant = item.product.variants.find(
                (v) => v.size === item.selectedSize
              );
              maxStock = variant ? variant.stock : 0;
            } else {
              maxStock =
                item.product.totalStock ||
                item.product.variants?.reduce((sum, v) => sum + v.stock, 0) ||
                0;
            }

            return (
              <div
                key={`${item.product.id}-${item.selectedSize || "no-size"}`}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {item.product.brand?.name}
                    </p>
                    {item.product.color && (
                      <Badge variant="outline" className="text-xs">
                        {item.product.color}
                      </Badge>
                    )}
                    {item.selectedSize && (
                      <Badge variant="outline" className="text-xs">
                        Talla: {item.selectedSize}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(item.product.price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {maxStock}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUpdateQuantity(
                        item.product.id,
                        item.quantity - 1,
                        item.selectedSize
                      )
                    }
                    disabled={loading || item.quantity <= 1}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <span className="w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUpdateQuantity(
                        item.product.id,
                        item.quantity + 1,
                        item.selectedSize
                      )
                    }
                    disabled={loading || item.quantity >= maxStock}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleRemoveItem(item.product.id, item.selectedSize)
                    }
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Método de pago
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
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
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={loading}
              className="bg-transparent cursor-pointer"
            >
              Limpiar Carrito
            </Button>

            <Button
              onClick={handleProcessCart}
              disabled={loading || cart.length === 0}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                `Procesar Venta (${formatCurrency(total)})`
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {itemCount} producto{itemCount !== 1 ? "s" : ""} • Promedio:{" "}
            {formatCurrency(total / itemCount)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
