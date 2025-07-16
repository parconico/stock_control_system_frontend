"use client";

import { useProducts, useSales, useUI } from "@/hooks/useStores";
import { useSalesStore } from "@/lib/stores/sales-store";
import { useProductsStore } from "@/lib/stores/products-store";
import { Scan, Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Product, ProductVariant } from "@/lib/types";

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedProductAndVariant, setSelectedProductAndVariant] = useState<{
    product: Product;
    selectedVariant: ProductVariant;
  } | null>(null);

  const {
    products,
    fetchProducts,
    fetchProductByBarcode,
    selectedProduct, // ✅ Agregar selectedProduct para manejar búsqueda por código de barras
    loading: productsLoading,
  } = useProducts();
  const { addToCart, error: cartError, clearError } = useSales();
  const { addToast } = useUI();

  useEffect(() => {
    if (cartError) {
      addToast({
        type: "error",
        title: "Error en carrito",
        description: cartError,
      });
      clearError();
    }
  }, [cartError, addToast, clearError]);

  // ✅ Nuevo useEffect para manejar selectedProduct (búsqueda por código de barras)
  useEffect(() => {
    if (selectedProduct && selectedProduct.variants) {
      // Si se encontró un producto por código de barras, mostrarlo en los resultados
      setShowResults(true);

      // Si solo tiene una variante con stock, seleccionarla automáticamente
      const availableVariants = selectedProduct.variants.filter(
        (v) => v.stock > 0
      );
      if (availableVariants.length === 1) {
        handleSelectVariant(selectedProduct, availableVariants[0]);
      }
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
      setSelectedProductAndVariant(null);
      useProductsStore.getState().clearFilters();
      useProductsStore.getState().fetchProducts();
    }
  }, [searchTerm]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSelectedProductAndVariant(null);

    try {
      if (/^\d+$/.test(searchTerm)) {
        // ✅ Búsqueda por código de barras - el resultado se manejará en el useEffect de selectedProduct
        await fetchProductByBarcode(searchTerm);
      } else {
        // Búsqueda por texto
        await fetchProducts({ search: searchTerm, limit: 20 });
      }
      setShowResults(true);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      addToast({
        type: "error",
        title: "Error en búsqueda",
        description: "No se pudieron cargar los productos",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVariant = (product: Product, variant: ProductVariant) => {
    if (variant.stock > 0) {
      setSelectedProductAndVariant({ product, selectedVariant: variant });
    } else {
      addToast({
        type: "error",
        title: "Sin stock",
        description: `La talla ${variant.size} de ${product.name} no tiene stock disponible.`,
      });
      setSelectedProductAndVariant(null);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProductAndVariant) return;

    const { product, selectedVariant } = selectedProductAndVariant;

    addToCart(product, 1, selectedVariant.size);

    setTimeout(() => {
      const { error: currentCartError } = useSalesStore.getState();
      if (!currentCartError) {
        addToast({
          type: "success",
          title: "Producto agregado",
          description: `${product.name} (Talla: ${selectedVariant.size}) se agregó al carrito`,
        });
        setSearchTerm("");
        setShowResults(false);
        setSelectedProductAndVariant(null);
        useProductsStore.getState().clearFilters();
        useProductsStore.getState().fetchProducts();
      }
    }, 100);
  };

  // ✅ Combinar productos de búsqueda normal y selectedProduct (código de barras)
  const allProducts =
    selectedProduct && /^\d+$/.test(searchTerm) ? [selectedProduct] : products;

  const availableProducts = allProducts.filter((product) =>
    product.variants?.some((variant) => variant.stock > 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código de barras..."
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

      {showResults && (
        <Card>
          <CardContent className="p-4">
            {productsLoading || isSearching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Buscando productos...
                </p>
              </div>
            ) : availableProducts.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-medium">
                  Resultados ({availableProducts.length} productos con stock)
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand?.name}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            ${product.price.toLocaleString()}
                          </p>
                          <div className="flex space-x-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.gender}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                            {product.color && (
                              <Badge variant="outline" className="text-xs">
                                {product.color}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Tallas disponibles:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {product.variants?.map((variant) => {
                            const isSelected =
                              selectedProductAndVariant?.product.id ===
                                product.id &&
                              selectedProductAndVariant?.selectedVariant.id ===
                                variant.id;
                            return (
                              <Button
                                key={variant.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() =>
                                  handleSelectVariant(product, variant)
                                }
                                className="text-xs"
                                disabled={variant.stock <= 0}
                              >
                                {variant.size} ({variant.stock})
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedProductAndVariant && (
                  <div className="mt-4 p-3 border rounded-lg bg-blue-50 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        Seleccionado: {selectedProductAndVariant.product.name}{" "}
                        (Talla: {selectedProductAndVariant.selectedVariant.size}
                        )
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {selectedProductAndVariant.selectedVariant.stock}{" "}
                        • Precio: $
                        {selectedProductAndVariant.product.price.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      disabled={productsLoading || isSearching}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron productos con stock disponible"
                    : "Ingresa un término de búsqueda"}
                </p>
                {searchTerm && allProducts.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Se encontraron {allProducts.length} productos pero ninguno
                    tiene stock disponible
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
