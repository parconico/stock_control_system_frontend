"use client";

import { useProducts, useSales, useUI } from "@/hooks/useStores";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Scan, ShoppingCart } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";

interface BarcodeScannerProps {
  onSaleComplete: () => void;
}

export default function BarcodeScanner({
  onSaleComplete,
}: BarcodeScannerProps) {
  // ✅ useState solo para estado LOCAL del formulario
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState(1);

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
      addToast({
        type: "success",
        title: "Producto encontrado",
        description: `${product.model?.brand?.name} ${product.model?.name} ${product.name}`,
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

    if (quantity > selectedProduct.stock) {
      addToast({
        type: "error",
        title: "Stock insuficiente",
        description: "No hay suficiente stock disponible",
      });
      return;
    }

    try {
      await createSale({
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.price,
        totalPrice: selectedProduct.price * quantity,
      });

      addToast({
        type: "success",
        title: "Venta registrada",
        description: `${quantity} x ${selectedProduct.name} - $${(
          selectedProduct.price * quantity
        ).toLocaleString()}`,
      });

      //Limpiar formulario
      setSelectedProduct(null);
      setBarcode("");
      setQuantity(1);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Scanner de Codigo de Barras</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Escanee o ingrese el codigo de barras"
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
                  {/* {selectedProduct.model?.brand?.name}{" "}  */}
                  {selectedProduct.name}
                </h3>
                <p className="text-muted-foreground">{selectedProduct.brand}</p>
                <div className="flex space-x-2 mt-2">
                  <Badge variant="outline">{selectedProduct.gender}</Badge>
                  <Badge variant="outline">{selectedProduct.category}</Badge>
                  {selectedProduct.size && (
                    <Badge variant="outline">{selectedProduct.size}</Badge>
                  )}
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
                  <strong>Stock disponible:</strong> {selectedProduct.stock}
                </p>
                <p>
                  <strong>Código:</strong>{" "}
                  <span className="font-mono">{selectedProduct.barcode}</span>
                </p>
              </div>
            </div>

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
                    max={selectedProduct.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Number.parseInt(e.target.value) || 1)
                    }
                    className="w-20"
                  />
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
                    quantity > selectedProduct.stock
                  }
                  className="flex items-center space-x-2"
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
    </div>
  );
}
