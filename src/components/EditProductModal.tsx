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
import { Card, CardContent } from "@/components/ui/card";
import { useProducts, useUI } from "@/hooks/useStores";
import { brandsApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Loader2, Package } from "lucide-react";

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
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
    brandId: "",
    color: "",
    price: "",
    cost: "",
    minStock: "",
  });

  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || "",
        brandId: product.brandId || "",
        color: product.color || "",
        price: product.price?.toString() || "",
        cost: product.cost?.toString() || "",
        minStock: product.minStock?.toString() || "",
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    // Validaciones básicas
    if (
      !formData.name ||
      !formData.brandId ||
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

    try {
      const updateData = {
        name: formData.name,
        brandId: formData.brandId,
        color: formData.color.trim() || undefined, // ✅ Convertir string vacío a undefined
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        minStock: Number.parseInt(formData.minStock),
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
      brandId: "",
      color: "",
      price: "",
      cost: "",
      minStock: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Editar Producto
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del producto. Los campos marcados con * son
            obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información no editable */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Código de Barras
                  </Label>
                  <p className="font-mono">{product.barcode}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Género
                  </Label>
                  <Badge variant="outline">{product.gender}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Categoría
                  </Label>
                  <p>{product.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Stock Total
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.variants?.map((variant) => (
                      <Badge
                        key={variant.id}
                        variant={variant.stock > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {variant.size}: {variant.stock}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Actualizando..." : "Actualizar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
