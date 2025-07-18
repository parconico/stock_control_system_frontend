"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useStores";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import CartSummary from "./CartSummary";
import ProductSearch from "./ProductSearch";

interface SalesFormProps {
  onSaleComplete: () => void;
}

export default function SalesForm({ onSaleComplete }: SalesFormProps) {
  const { fetchProducts } = useProducts();

  useEffect(() => {
    //Cargar productos disponibles
    fetchProducts({ page: 1, limit: 100 });
  }, [fetchProducts]);

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

      <CartSummary onSaleComplete={onSaleComplete} />
    </div>
  );
}
