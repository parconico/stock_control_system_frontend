/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Edit, Package, Search, Trash2 } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getStockStatus } from "@/lib/utils";
import { Badge } from "./ui/badge";
import type { Product } from "@/lib/types";
import { Button } from "./ui/button";
import EditProductModal from "./EditProductModal";
import { useUI } from "@/hooks/useStores";

export default function ProductList() {
  const products = useProductsList();
  const loading = useProductsLoading();
  const error = useProductsError();
  const filters = useProductsFilters();
  const { fetchProducts, setFilters, deleteProduct } = useProducts();
  const { addToast } = useUI();

  // Estado local para la búsqueda y paginación
  const [localSearch, setLocalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para el modal de confirmación de eliminación
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10; // Productos por página

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
    setCurrentPage(1); // Resetear a la primera página cuando se busca
  };

  const handleGenderChange = (value: string) => {
    const gender = value === "all" ? undefined : (value as "HOMBRE" | "MUJER");
    setFilters({ gender });
    fetchProducts({ ...filters, gender });
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  };

  const handleCategoryChange = (value: string) => {
    const category = value === "all" ? undefined : value;
    setFilters({ category });
    fetchProducts({ ...filters, category });
    setCurrentPage(1); // Resetear a la primera página cuando se filtra
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleProductUpdated = () => {
    // El modal se encargará de actualizar el store
    handleCloseEditModal();
  };

  // Funciones para manejar la eliminación de productos
  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);

      addToast({
        type: "success",
        title: "Producto eliminado",
        description: `El producto "${productToDelete.name}" ha sido eliminado correctamente.`,
      });

      // Refrescar la lista de productos
      await fetchProducts();

      // Si estamos en una página que ya no tiene productos, volver a la anterior
      const totalItemsAfterDelete = products.length - 1;
      const maxPageAfterDelete = Math.ceil(
        totalItemsAfterDelete / itemsPerPage
      );
      if (currentPage > maxPageAfterDelete && maxPageAfterDelete > 0) {
        setCurrentPage(maxPageAfterDelete);
      }
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error al eliminar producto",
        description:
          error.message ||
          "No se pudo eliminar el producto. Inténtalo de nuevo.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const cancelDeleteProduct = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
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
        product.brand?.name?.toLowerCase() || "",
        product.category?.toLowerCase() || "",
        product.color?.toLowerCase() || "",
      ];

      return words.every((word) =>
        fields.some((field) => field.includes(word))
      );
    });
  }, [localSearch, products]);

  // Cálculos de paginación
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba cuando se cambia de página
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (currentPage <= 3) {
        // Mostrar primeras páginas
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Mostrar últimas páginas
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas del medio
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Gestión de Productos</span>
            {/* Mostrar contador de productos */}
            <Badge variant="secondary" className="ml-2">
              {totalItems} productos
            </Badge>
            {totalItems > 0 && (
              <Badge variant="outline" className="ml-2">
                Página {currentPage} de {totalPages}
              </Badge>
            )}
          </CardTitle>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código de barras, marca..."
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
                <SelectValue placeholder="Filtrar por género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                <SelectItem value="HOMBRE">Hombre</SelectItem>
                <SelectItem value="MUJER">Mujer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.category || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="BUZO">Buzo</SelectItem>
                <SelectItem value="CAMPERA">Campera</SelectItem>
                <SelectItem value="PANTALON">Pantalón</SelectItem>
                <SelectItem value="REMERA">Remera</SelectItem>
                <SelectItem value="MEDIAS">Medias</SelectItem>
                <SelectItem value="GORRA">Gorra</SelectItem>
                <SelectItem value="BOTELLA">Botella</SelectItem>
                <SelectItem value="RINONERA">Riñonera</SelectItem>
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
          {/* Información de paginación */}
          {totalItems > 0 && (
            <div className="mb-4 text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de{" "}
              {totalItems} productos
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
                  <TableHead>Talles</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => {
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
                          <p className="font-medium">{product.name}</p>
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
                        <Badge variant="default">{product.gender}</Badge>
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
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-8 w-8 p-0 cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mensaje cuando no hay productos */}
          {totalItems === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No se encontraron productos con los filtros aplicados.
              </p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {/* Botón Anterior */}
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Números de página */}
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(page as number)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  {/* Botón Siguiente */}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <EditProductModal
        product={editingProduct}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onProductUpdated={handleProductUpdated}
      />

      {/* Modal de confirmación de eliminación */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Confirmar eliminación</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el producto &quot;
              {productToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Contenido adicional fuera del AlertDialogDescription */}
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-600 mt-0.5">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">Esta acción:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Eliminará el producto permanentemente</li>
                    <li>Eliminará todas sus variantes de talla</li>
                    <li>No se puede deshacer</li>
                  </ul>
                </div>
              </div>
            </div>

            {productToDelete && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <strong>Marca:</strong> {productToDelete.brand?.name}
                  </div>
                  <div>
                    <strong>Código:</strong> {productToDelete.barcode}
                  </div>
                  <div>
                    <strong>Precio:</strong> $
                    {productToDelete.price.toLocaleString()}
                  </div>
                  <div>
                    <strong>Stock total:</strong>{" "}
                    {productToDelete.variants?.reduce(
                      (sum, variant) => sum + variant.stock,
                      0
                    ) || 0}{" "}
                    unidades
                  </div>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={cancelDeleteProduct}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Producto
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
