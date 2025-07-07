"use client";

import { useProducts, useSales } from "@/hooks/useStores";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import ProductSearch from "./ProductSearch";
import CartSummary from "./CartSummary";

interface SalesFormProps {
  onSaleComplete: () => void;
}

export default function SalesForm({ onSaleComplete }: SalesFormProps) {
  const { fetchProducts } = useProducts();
  const { cart, processCart, loading } = useSales();

  useEffect(() => {
    //Cargar productos disponibles
    fetchProducts({ page: 1, limit: 100 });
  }, [fetchProducts]);

  const handleProcessSale = async () => {
    try {
      await processCart();
      onSaleComplete();
    } catch (error) {
      //Error manejado en el store y mostrado via toast
      console.log("Error al procesar venta:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Registrar Venta</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductSearch />
        </CardContent>
      </Card>

      <CartSummary />
    </div>
  );
}
