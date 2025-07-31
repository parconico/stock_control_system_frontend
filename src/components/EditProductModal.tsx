/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts, useUI } from "@/hooks/useStores";
import { brandsApi } from "@/lib/api";
import type { Category, Product, ProductVariantInput } from "@/lib/types";
import { CATEGORY_OPTIONS, GENDER_OPTIONS, SIZE_OPTIONS } from "@/lib/types";
import { Loader2, Package, Plus, Trash2, Edit3 } from "lucide-react";

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

interface VariantFormData extends ProductVariantInput {
  id?: string;
  isNew?: boolean;
}

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  const { updateProduct, loading } = useProducts();
  const { addToast } = useUI();

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    brandId: "",
    barcode: "",
    color: "",
    category: "",
    price: "",
    cost: "",
    minStock: "",
  });

  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || "",
        gender: product.gender || "",
        brandId: product.brandId || "",
        barcode: product.barcode || "",
        color: product.color || "",
        category: product.category || "",
        price: product.price?.toString() || "",
        cost: product.cost?.toString() || "",
        minStock: product.minStock?.toString() || "",
      });

      // Cargar variantes existentes
      const existingVariants: VariantFormData[] =
        product.variants?.map((variant) => ({
          id: variant.id,
          size: variant.size,
          stock: variant.stock,
          isNew: false,
        })) || [];

      setVariants(existingVariants);
    }
  }, [product, isOpen]);

  // Cargar marcas
  useEffect(() => {
    if (isOpen) {
      const fetchBrands = async () => {
        setLoadingBrands(true);
        try {
          const brandsData = await brandsApi.getAll();
          setBrands(brandsData);
        } catch (error) {
          console.error("Error al cargar marcas:", error);
          addToast({
            type: "error",
            title: "Error",
            description: "No se pudieron cargar las marcas",
          });
        } finally {
          setLoadingBrands(false);
        }
      };

      fetchBrands();
    }
  }, [isOpen, addToast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantChange = (
    index: number,
    field: keyof ProductVariantInput,
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? { ...variant, [field]: field === "stock" ? Number(value) : value }
          : variant
      )
    );
  };

  const addNewVariant = () => {
    const availableSizes = SIZE_OPTIONS.filter(
      (sizeOption) =>
        !variants.some((variant) => variant.size === sizeOption.value)
    );

    if (availableSizes.length === 0) {
      addToast({
        type: "error",
        title: "No hay tallas disponibles",
        description: "Ya has agregado todas las tallas disponibles",
      });
      return;
    }

    const newVariant: VariantFormData = {
      size: availableSizes[0].value,
      stock: 0,
      isNew: true,
    };

    setVariants((prev) => [...prev, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const validateVariants = () => {
    // Verificar que no haya tallas duplicadas
    const sizes = variants.map((v) => v.size);
    const uniqueSizes = new Set(sizes);
    if (sizes.length !== uniqueSizes.size) {
      addToast({
        type: "error",
        title: "Tallas duplicadas",
        description: "No puedes tener tallas duplicadas",
      });
      return false;
    }

    // Verificar que todas las variantes tengan stock >= 0
    const hasInvalidStock = variants.some((v) => v.stock < 0);
    if (hasInvalidStock) {
      addToast({
        type: "error",
        title: "Stock inválido",
        description: "El stock no puede ser negativo",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    // Validaciones básicas
    if (
      !formData.name ||
      !formData.brandId ||
      !formData.barcode ||
      !formData.price ||
      !formData.cost ||
      !formData.minStock
    ) {
      addToast({
        type: "error",
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
      });
      return;
    }

    if (variants.length === 0) {
      addToast({
        type: "error",
        title: "Variantes requeridas",
        description: "Debes agregar al menos una talla",
      });
      return;
    }

    if (!validateVariants()) {
      return;
    }

    try {
      const updateData = {
        name: formData.name,
        gender: formData.gender as "HOMBRE" | "MUJER" | "UNISEX",
        brandId: formData.brandId,
        barcode: formData.barcode,
        color: formData.color.trim() || undefined,
        category: formData.category as Category,
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        minStock: Number.parseInt(formData.minStock),
        variants: variants.map((variant) => ({
          size: variant.size,
          stock: variant.stock,
        })),
      };

      await updateProduct(product.id, updateData);

      addToast({
        type: "success",
        title: "Producto actualizado",
        description: `${formData.name} se actualizó exitosamente`,
      });

      onProductUpdated();
      onClose();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error al actualizar producto",
        description: error.message || "Ocurrió un error inesperado",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "",
      brandId: "",
      barcode: "",
      color: "",
      category: "",
      price: "",
      cost: "",
      minStock: "",
    });
    setVariants([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getAvailableSizes = (currentIndex: number) => {
    return SIZE_OPTIONS.filter(
      (sizeOption) =>
        !variants.some(
          (variant, index) =>
            variant.size === sizeOption.value && index !== currentIndex
        )
    );
  };

  const getTotalStock = () => {
    return variants.reduce((total, variant) => total + variant.stock, 0);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Editar Producto
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del producto y gestiona sus tallas. Los campos
            marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información no editable */}
          {/* <Card className="bg-gray-50">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Género
                  </Label>
                  <Badge variant="outline">{product.gender}</Badge>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Campos editables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras *</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Código de barras"
                className="font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.category} />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((gen) => (
                    <SelectItem key={gen.value} value={gen.value}>
                      {gen.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) => handleInputChange("brandId", value)}
                disabled={loadingBrands}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingBrands ? "Cargando marcas..." : "Seleccionar marca"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="Color del producto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                // disabled={loadingBrands}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.category} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Costo *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo *</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Gestión de Variantes/Tallas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Edit3 className="h-4 w-4" />
                    Tallas y Stock
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stock total:{" "}
                    <Badge variant="secondary">{getTotalStock()}</Badge>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewVariant}
                  disabled={variants.length >= SIZE_OPTIONS.length}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Talla
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {variants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay tallas agregadas</p>
                  <p className="text-sm">
                    Haz clic en &quot;Agregar Talla&quot; para comenzar
                  </p>
                </div>
              ) : (
                variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Talla
                      </Label>
                      <Select
                        value={variant.size}
                        onValueChange={(value) =>
                          handleVariantChange(index, "size", value)
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSizes(index).map((sizeOption) => (
                            <SelectItem
                              key={sizeOption.value}
                              value={sizeOption.value}
                            >
                              {sizeOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Stock
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) =>
                          handleVariantChange(index, "stock", e.target.value)
                        }
                        className="h-8"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      {variant.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          Nuevo
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Actualizando..." : "Actualizar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
