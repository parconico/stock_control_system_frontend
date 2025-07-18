"use client";

import {
  useProducts,
  useProductsError,
  useProductsFilters,
  useProductsList,
  useProductsLoading,
} from "@/hooks/useStores";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search } from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStockStatus } from "@/lib/utils";
import { Badge } from "./ui/badge";

// interface ProductListProps {
//   onRefresh: () => void;
// }

export default function ProductList() {
  const products = useProductsList();
  const loading = useProductsLoading();
  const error = useProductsError();
  const filters = useProductsFilters();
  const { fetchProducts, setFilters } = useProducts();

  // Estado local para la búsqueda
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, filters]);

  useEffect(() => {
    if (error) {
      console.error("Error en ProductList:", error);
    }
  }, [error]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // No llamamos a fetchProducts aquí
  };

  const handleGenderChange = (value: string) => {
    const gender = value === "all" ? undefined : (value as "HOMBRE" | "MUJER");
    setFilters({ gender });
    fetchProducts({ ...filters, gender });
  };

  const handleCategoryChange = (value: string) => {
    const category = value === "all" ? undefined : value;
    setFilters({ category });
    fetchProducts({ ...filters, category });
  };

  // Filtrado local de productos según búsqueda
  const filteredProducts = useMemo(() => {
    const search = localSearch.trim().toLowerCase();
    if (!search) return products;
    const words = search.split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      const fields = [
        product.name?.toLowerCase() || "",
        product.barcode?.toLowerCase() || "",
        product.brand?.name?.toLowerCase() || "", // ✅ Acceder a brand.name
        product.category?.toLowerCase() || "",
        product.color?.toLowerCase() || "",
      ];
      return words.every((word) =>
        fields.some((field) => field.includes(word))
      );
    });
  }, [localSearch, products]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando productos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Gestion de Productos</span>
          {/* Mostrar contador de productos */}
          <Badge variant="secondary" className="ml-2">
            {filteredProducts.length} productos
          </Badge>
        </CardTitle>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, codigo de barras, marca..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.gender || "all"}
            onValueChange={handleGenderChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por genero"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los generos</SelectItem>
              <SelectItem value="HOMBRE">Hombre</SelectItem>
              <SelectItem value="MUJER">Mujer</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              <SelectItem value="BUZO">Buzo</SelectItem>
              <SelectItem value="CAMPERA">Campera</SelectItem>
              <SelectItem value="PANTALON">Pantalón</SelectItem>
              <SelectItem value="REMERA">Remera</SelectItem>
              <SelectItem value="MEDIAS">Medias</SelectItem>
              <SelectItem value="GORRA">Gorra</SelectItem>
              <SelectItem value="BOTELLA">Botella</SelectItem>
              <SelectItem value="RIÑONERA">Riñonera</SelectItem>
              <SelectItem value="OTROS">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                // const totalStock =
                //   product.variants?.reduce(
                //     (sum, variant) => sum + variant.stock,
                //     0
                //   ) || 0;
                const totalStock =
                  product.totalStock ??
                  product.variants?.reduce(
                    (sum, variant) => sum + variant.stock,
                    0
                  ) ??
                  0;
                const stockStatus = getStockStatus(
                  totalStock,
                  product.minStock
                );
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {/* {product.model?.brand?.name} {product.model?.name} */}
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.color && `${product.color}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{product.brand?.name}</TableCell>
                    <TableCell className="font-mono">
                      {product.barcode}
                    </TableCell>
                    <TableCell>
                      <Badge className="outline">{product.gender}</Badge>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {product.variants?.map((variant) => (
                          <Badge
                            key={variant.id}
                            variant={
                              variant.stock > 0 ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {variant.size}: {variant.stock}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={stockStatus.className}>
                        {totalStock}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {product.minStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stockStatus.status === "out"
                            ? "destructive"
                            : stockStatus.status === "low"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron productos en los filtros aplicados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
