/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useProducts, useUI } from "@/hooks/useStores";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
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
import { CATEGORY_OPTIONS, GENDER_OPTIONS, SIZE_OPTIONS } from "@/lib/types";

interface AddProductFormProps {
  onProductAdded: () => void;
}

export default function AddProductForm({
  onProductAdded,
}: AddProductFormProps) {
  //useState solo para estado LOCAL del formulario
  const [formData, setFormData] = useState({
    name: "",
    // modelId: "",
    brand: "",
    barcode: "",
    gender: "",
    category: "",
    size: "",
    color: "",
    price: "",
    cost: "",
    stock: "",
    minStock: "",
  });

  //Zustand para estado global
  const { createProduct, loading } = useProducts();
  const { addToast } = useUI();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateBarcode = () => {
    const barcode = "789" + Math.random().toString().slice(2, 12);
    setFormData((prev) => ({ ...prev, barcode }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      //   modelId: "",
      brand: "",
      barcode: "",
      gender: "",
      category: "",
      size: "",
      color: "",
      price: "",
      cost: "",
      stock: "",
      minStock: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const productData = {
        ...formData,
        brand: formData.brand,
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
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        stock: Number.parseInt(formData.stock),
        minStock: Number.parseInt(formData.minStock),
      };

      await createProduct(productData);

      addToast({
        type: "success",
        title: "Producto agregado",
        description: `${formData.name} se agrego exitosamente al inventario`,
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
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="Ej: Nike, Adidas, Puma"
                required
              />
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

            <div className="space-y-2">
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
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                required
              />
            </div>
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Agregando..." : "Agregar Producto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
