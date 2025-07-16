/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useProducts, useUI } from "@/hooks/useStores";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  ProductVariantInput,
  SIZE_OPTIONS,
} from "@/lib/types";
import { brandsApi } from "@/lib/api";
import { Badge } from "./ui/badge";

interface AddProductFormProps {
  onProductAdded: () => void;
}

export default function AddProductForm({
  onProductAdded,
}: AddProductFormProps) {
  //useState solo para estado LOCAL del formulario
  const [formData, setFormData] = useState({
    name: "",
    brandId: "",
    barcode: "",
    gender: "",
    category: "",
    // size: "",
    color: "",
    price: "",
    cost: "",
    // stock: "",
    minStock: "",
  });

  const [variants, setVariants] = useState<ProductVariantInput[]>([
    { size: "", stock: 0 },
  ]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  //Zustand para estado global
  const { createProduct, loading } = useProducts();
  const { addToast } = useUI();

  // Cargar marcas al montar el componente
  useEffect(() => {
    const fetchBrands = async () => {
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
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateBarcode = () => {
    const barcode = "789" + Math.random().toString().slice(2, 12);
    setFormData((prev) => ({ ...prev, barcode }));
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { size: "", stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariantInput,
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const getTotalStock = () => {
    return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      //   modelId: "",
      brandId: "",
      barcode: "",
      gender: "",
      category: "",
      // size: "",
      color: "",
      price: "",
      cost: "",
      // stock: "",
      minStock: "",
    });
    setVariants([{ size: "", stock: 0 }]);
  };

  const validateForm = () => {
    // Validar datos básicos
    if (
      !formData.name ||
      !formData.brandId ||
      !formData.barcode ||
      !formData.gender ||
      !formData.category ||
      !formData.price ||
      !formData.cost ||
      !formData.minStock
    ) {
      addToast({
        type: "error",
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
      });
      return false;
    }

    // Validar variantes
    const validVariants = variants.filter((v) => v.size && v.stock > 0);
    if (validVariants.length === 0) {
      addToast({
        type: "error",
        title: "Variantes requeridas",
        description: "Debes agregar al menos una talla con stock",
      });
      return false;
    }

    // Verificar tallas duplicadas
    const sizes = validVariants.map((v) => v.size);
    const uniqueSizes = new Set(sizes);
    if (sizes.length !== uniqueSizes.size) {
      addToast({
        type: "error",
        title: "Tallas duplicadas",
        description: "No puedes tener la misma talla repetida",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const validVariants = variants.filter((v) => v.size && v.stock > 0);

      const productData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        minStock: Number.parseInt(formData.minStock),
        gender: formData.gender as "HOMBRE" | "MUJER",
        category: formData.category as
          | "BUZO"
          | "CAMPERA"
          | "PANTALON"
          | "REMERA"
          | "MEDIAS"
          | "GORRA"
          | "BOTELLA"
          | "RINONERA"
          | "OTROS",
        variants: validVariants,
      };

      await createProduct(productData);

      addToast({
        type: "success",
        title: "Producto agregado",
        description: `${formData.name} se agregó exitosamente con ${
          validVariants.length
        } tallas (${getTotalStock()} unidades total)`,
      });

      resetForm();
      onProductAdded();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Error al agregar producto",
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Agregar Nuevo Producto</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Buzo con capucha"
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
                      loadingBrands
                        ? "Cargando marcas...."
                        : "Seleccionar marca"
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
              <Label htmlFor="barcode">Código de Barras</Label>
              <div className="flex space-x-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  placeholder="Código de barras"
                  className="font-mono"
                  required
                />
                <Button
                  type="button"
                  onClick={generateBarcode}
                  variant="outline"
                >
                  Generar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="size">Talla (Opcional)</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => handleInputChange("size", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar talla" />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="color">Color (Opcional)</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                placeholder="Ej: Negro, Azul, Rojo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta</Label>
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
              <Label htmlFor="cost">Costo</Label>
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

            {/* <div className="space-y-2">
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                required
              />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Mínimo</Label>
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

          {/* Variantes por talla */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Tallas y Stock</h3>
                <p className="text-sm text-muted-foreground">
                  Agrega las diferentes tallas y sus cantidad
                </p>
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Package className="h-3 w-3" />
                  <span>Total: {getTotalStock()} unidades</span>
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Label className="text-sm">Talla</Label>
                    <Select
                      value={variant.size}
                      onValueChange={(value) =>
                        updateVariant(index, "size", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar talla" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label className="text-sm">Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "stock",
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    disabled={variants.length === 1}
                    className="text-red-600 hover:text-red-700 mt-5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addVariant}
              className="w-full bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Talla
            </Button>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Agregando..."
              : `Agregar Producto (${getTotalStock()} unidades)`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
