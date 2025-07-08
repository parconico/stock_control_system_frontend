/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useProducts, useSales } from "@/hooks/useStores";
import { Scan, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function ProductSearch() {
  // useState para estado local del formulario de busqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  //Zustand para estado global de productos y carrito
  const {
    products,
    fetchProducts,
    fetchProductByBarcode,
    loading: productsLoading,
  } = useProducts();

  const { addToCart } = useSales();

  //Busqueda automatica con debounce
  useEffect(() => {
    if (searchTerm.length >= 3) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      //Si parece un codigo de barras (solo numeros)
      if (/^\d+$/.test(searchTerm)) {
        await fetchProductByBarcode(searchTerm);
      } else {
        // Busqueda por texto
        await fetchProducts({ search: searchTerm });
      }
      setShowResults(true);
    } catch (error) {
      console.error("Error en busqueda:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    // Limpiar busqueda local despues de agregar
    setSearchTerm("");
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      {/* Formulario de busqueda - estado local */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o codigo de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
        >
          <Scan className="h-4 w-4 mr-2" />
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {/* Resultados - estado global */}
      {showResults && (
        <Card>
          <CardContent className="p-4">
            {productsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Buscando productos...
                </p>
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-2">
                <h3>Resultados ({products.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {products.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.brand}
                        </p>
                        <p className="text-sm">Stock: {product.stock}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                      >
                        Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No se encontraron productos
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
