"use client";

import { useSales } from "@/hooks/useStores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";

export default function CartSummary() {
  // Zustand
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processCart,
    getCartTotal,
    getCartItemCount,
    loading,
  } = useSales();

  const total = getCartTotal();
  const itemCount = getCartItemCount();

  const handleProcessCart = async () => {
    try {
      await processCart();
    } catch (error) {
      console.error("Error al procesar carrito: ", error);
    }
  };

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent>
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">El carrito está vacío</p>
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
            <span>Carrito</span>
          </span>
          <Badge variant="secondary">{itemCount}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de productos */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {item.product.model?.brand?.name} {item.product.model?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {item.product.name}
                </p>
                <p>{formatCurrency(item.product.price)}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateCartQuantity(item.product.id, item.quantity - 1)
                  }
                  disabled={loading}
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
                    updateCartQuantity(item.product.id, item.quantity + 1)
                  }
                  disabled={loading || item.quantity >= item.product.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.product.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Total y acciones */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold">{formatCurrency(total)}</span>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={loading}
              className="flex-1"
            >
              Limpiar
            </Button>

            <Button
              onClick={handleProcessCart}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Procesando..." : "Procesar Venta"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
