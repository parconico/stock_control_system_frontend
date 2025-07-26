"use client";

import { useProducts, useSales, useUI } from "@/hooks/useStores";
import { useSalesStore } from "@/lib/stores/sales-store";
import { Scan, Search, Plus } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Product, ProductVariant } from "@/lib/types";

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedProductAndVariant, setSelectedProductAndVariant] = useState<{
    product: Product;
    selectedVariant: ProductVariant;
  } | null>(null);

  const {
    products,
    fetchProducts,
    fetchProductByBarcode,
    selectedProduct,
    loading: productsLoading,
  } = useProducts();

  const { addToCart, error: cartError, clearError } = useSales();
  const { addToast } = useUI();

  // Cargar todos los productos al montar el componente
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts({});
    }
  }, [products.length, fetchProducts]);

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedProductAndVariant(null);
  };

  const handleSelectVariant = useCallback(
    (product: Product, variant: ProductVariant) => {
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
    },
    [addToast]
  );

  // Manejo de selectedProduct (búsqueda por código de barras)
  useEffect(() => {
    if (selectedProduct && selectedProduct.variants) {
      setShowResults(true);
      const availableVariants = selectedProduct.variants.filter(
        (v) => v.stock > 0
      );
      if (availableVariants.length === 1) {
        handleSelectVariant(selectedProduct, availableVariants[0]);
      }
    }
  }, [selectedProduct, handleSelectVariant]);

  // Búsqueda local con useMemo para optimizar rendimiento
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.trim();

    // Si es un código de barras (solo números), buscar exactamente
    if (/^\d+$/.test(searchTerm)) {
      return products.filter(
        (product) =>
          product.barcode === searchTerm &&
          product.variants?.some((variant) => variant.stock > 0)
      );
    }

    // Búsqueda por texto en múltiples campos
    return products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(term);
      const matchesBrand = product.brand?.name.toLowerCase().includes(term);
      const matchesBarcode = product.barcode.includes(term);
      const matchesColor = product.color?.toLowerCase().includes(term);
      const matchesCategory = product.category.toLowerCase().includes(term);
      const hasStock = product.variants?.some((variant) => variant.stock > 0);

      return (
        (matchesName ||
          matchesBrand ||
          matchesBarcode ||
          matchesColor ||
          matchesCategory) &&
        hasStock
      );
    });
  }, [products, searchTerm]);

  // Manejar búsqueda por código de barras cuando no se encuentra localmente
  const handleBarcodeSearch = useCallback(async () => {
    if (/^\d+$/.test(searchTerm) && filteredProducts.length === 0) {
      try {
        await fetchProductByBarcode(searchTerm);
      } catch (error) {
        console.error("Producto no encontrado:", error);
        addToast({
          type: "error",
          title: "Producto no encontrado",
          description: "No se encontró un producto con ese código de barras",
        });
      }
    }
  }, [searchTerm, filteredProducts.length, fetchProductByBarcode, addToast]);

  // Efecto para mostrar/ocultar resultados y manejar búsqueda por código de barras
  useEffect(() => {
    if (searchTerm.length >= 2) {
      setShowResults(true);
      // Si es código de barras y no hay resultados locales, buscar en el servidor
      const timer = setTimeout(() => {
        handleBarcodeSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
      setSelectedProductAndVariant(null);
    }
  }, [searchTerm, handleBarcodeSearch]);

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
      }
    }, 100);
  };

  // Combinar productos filtrados localmente con selectedProduct (código de barras del servidor)
  const displayProducts = useMemo(() => {
    if (
      selectedProduct &&
      /^\d+$/.test(searchTerm) &&
      filteredProducts.length === 0
    ) {
      return [selectedProduct];
    }
    return filteredProducts;
  }, [selectedProduct, searchTerm, filteredProducts]);

  const availableProducts = displayProducts.filter((product) =>
    product.variants?.some((variant) => variant.stock > 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, marca, código de barras..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowResults(true)}
          disabled={!searchTerm.trim()}
          className="cursor-pointer"
        >
          <Scan className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {showResults && searchTerm.length >= 2 && (
        <Card>
          <CardContent className="p-4">
            {productsLoading ? (
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
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {product.barcode}
                            </Badge>
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
                                className="text-xs cursor-pointer"
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
                      disabled={productsLoading}
                      className="cursor-pointer"
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
                  No se encontraron productos con stock disponible
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
