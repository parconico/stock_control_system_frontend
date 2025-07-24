/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import { useProducts, useUI } from "@/hooks/useStores";
import { brandsApi } from "@/lib/api";
import type { CreateProductForm, Brand } from "@/lib/types";

interface CSVRow {
  [key: string]: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string; data: CSVRow }>;
  warnings: Array<{ row: number; message: string; data: CSVRow }>;
}

interface ParsedData {
  headers: string[];
  rows: CSVRow[];
  separator: string;
}

interface ParsedProduct {
  name: string;
  size: string;
  price: number;
  quantity: number;
  category: string;
  originalName: string;
}

export default function ProductImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false); // ✅ Nuevo estado para análisis
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [detectedBrandName, setDetectedBrandName] = useState<string>("");
  const { addToast } = useUI();
  const { createProduct, fetchProducts } = useProducts();

  // Cargar marcas al inicializar
  const loadBrands = async () => {
    try {
      const brandsData = await brandsApi.getAll();
      setBrands(brandsData);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  // Extraer nombre de marca del archivo
  const extractBrandFromFilename = (filename: string): string => {
    // Remover extensión
    let brandName = filename.replace(/\.(csv|xlsx|xls)$/i, "");

    // Limpiar caracteres especiales y patrones comunes
    brandName = brandName
      .replace(/STOCK\s+/i, "") // Remover "STOCK"
      .replace(/\s*-\s*[A-Z0-9]+$/i, "") // Remover códigos al final como "- DRBSIXZERO"
      .replace(/\s*$$\d+$$$/i, "") // Remover números entre paréntesis como "(1)"
      .replace(/[_-]+/g, " ") // Reemplazar guiones y guiones bajos con espacios
      .trim();

    // Si queda vacío o muy corto, usar un nombre por defecto
    if (!brandName || brandName.length < 2) {
      brandName = "Marca Importada";
    }

    return brandName;
  };

  // Detectar separador CSV
  const detectSeparator = (text: string): string => {
    const separators = [",", ";", "\t"];
    const firstLine = text.split("\n")[0];

    let maxCount = 0;
    let bestSeparator = ",";

    separators.forEach((sep) => {
      const count = (firstLine.match(new RegExp(sep, "g")) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestSeparator = sep;
      }
    });

    return bestSeparator;
  };

  // Parsear CSV
  const parseCSV = (text: string, separator: string): CSVRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0]
      .split(separator)
      .map((h) => h.trim().replace(/"/g, ""));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(separator)
        .map((v) => v.trim().replace(/"/g, ""));
      const row: CSVRow = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      rows.push(row);
    }

    return rows;
  };

  // Extraer talla del nombre del producto
  const extractSizeFromName = (
    productName: string
  ): { name: string; size: string } => {
    // Patrones de tallas comunes al final del nombre
    const sizePatterns = [
      /\b(XS|S|M|L|XL|XXL|XXXL)\s*$/i,
      /\b(\d{1,2})\s*$/, // Números como 36, 42, etc.
      /\b(UNICO|ÚNICA|ONE SIZE)\s*$/i,
    ];

    for (const pattern of sizePatterns) {
      const match = productName.match(pattern);
      if (match) {
        const size = match[1].toUpperCase();
        const nameWithoutSize = productName.replace(match[0], "").trim();
        return { name: nameWithoutSize, size };
      }
    }

    // Si no se encuentra talla, usar UNICO
    return { name: productName, size: "UNICO" };
  };

  // Detectar categoría del nombre del producto
  const detectCategoryFromName = (productName: string): string => {
    const categoryMap: { [key: string]: string } = {
      BUZO: "BUZO",
      BUZOS: "BUZO",
      CAMPERA: "CAMPERA",
      CAMPERAS: "CAMPERA",
      PANTALON: "PANTALON",
      PANTALONES: "PANTALON",
      JEAN: "PANTALON",
      JEANS: "PANTALON",
      REMERA: "REMERA",
      REMERAS: "REMERA",
      CAMISETA: "REMERA",
      CAMISETAS: "REMERA",
      MEDIAS: "MEDIAS",
      GORRA: "GORRA",
      GORRAS: "GORRA",
      BOTELLA: "BOTELLA",
      BOTELLAS: "BOTELLA",
      RIÑONERA: "RINONERA",
      RIÑONERAS: "RINONERA",
      ZAPATILLA: "OTROS",
      ZAPATILLAS: "OTROS",
      CALZADO: "OTROS",
    };

    const upperName = productName.toUpperCase();

    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (upperName.includes(keyword)) {
        return category;
      }
    }

    return "OTROS";
  };

  // Detectar género del nombre del producto
  const detectGenderFromName = (productName: string): "HOMBRE" | "MUJER" => {
    const upperName = productName.toUpperCase();

    // Palabras clave para mujer
    const womenKeywords = [
      "MUJER",
      "FEMENINO",
      "FEMALE",
      "WOMAN",
      "LADIES",
      "LADY",
    ];

    // Palabras clave para hombre
    const menKeywords = ["HOMBRE", "MASCULINO", "MALE", "MAN", "MEN"];

    for (const keyword of womenKeywords) {
      if (upperName.includes(keyword)) {
        return "MUJER";
      }
    }

    for (const keyword of menKeywords) {
      if (upperName.includes(keyword)) {
        return "HOMBRE";
      }
    }

    // Por defecto, si no se puede determinar, usar MUJER (basado en el archivo)
    return "MUJER";
  };

  // Parsear producto del formato específico
  const parseProductFromRow = (
    row: CSVRow,
    headers: string[]
  ): ParsedProduct | null => {
    // Detectar las columnas principales
    const articleColumn =
      headers.find(
        (h) =>
          h.toLowerCase().includes("articulo") ||
          h.toLowerCase().includes("producto") ||
          h.toLowerCase().includes("nombre")
      ) || headers[0];

    const priceColumn = headers.find(
      (h) =>
        h.toLowerCase().includes("precio") || h.toLowerCase().includes("price")
    );

    const quantityColumn = headers.find(
      (h) =>
        h.toLowerCase().includes("cantidad") ||
        h.toLowerCase().includes("stock") ||
        h.toLowerCase().includes("qty")
    );

    const originalName = row[articleColumn]?.trim();
    if (!originalName) return null;

    // Extraer talla del nombre
    const { name, size } = extractSizeFromName(originalName);

    // Procesar precio
    const priceStr = row[priceColumn || ""]?.trim() || "0";
    const price =
      Number.parseFloat(priceStr.replace(/[^\d.,]/g, "").replace(",", ".")) ||
      0;

    // Procesar cantidad
    const quantityStr = row[quantityColumn || ""]?.trim() || "0";
    const quantity = Number.parseInt(quantityStr) || 0;

    // Detectar categoría
    const category = detectCategoryFromName(originalName);

    return {
      name,
      size,
      price,
      quantity,
      category,
      originalName,
    };
  };

  // Buscar o crear marca basada en el nombre del archivo
  const findOrCreateBrandFromFilename = async (
    filename: string
  ): Promise<string> => {
    const brandName = extractBrandFromFilename(filename);
    setDetectedBrandName(brandName);

    // Buscar marca existente
    const existingBrand = brands.find(
      (b) => b.name.toLowerCase() === brandName.toLowerCase()
    );

    if (existingBrand) {
      return existingBrand.id;
    }

    // Crear nueva marca
    try {
      const newBrand = await brandsApi.create({
        name: brandName,
        description: `Marca creada automáticamente desde archivo: ${filename}`,
      });
      setBrands((prev) => [...prev, newBrand]);
      return newBrand.id;
    } catch (error) {
      throw new Error(`Error creando marca "${brandName}": ${error}`);
    }
  };

  // Generar código de barras único
  const generateBarcode = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  };

  // Manejar selección de archivo
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        addToast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo CSV o Excel",
          type: "error",
        });
        return;
      }

      setFile(selectedFile);
      setAnalyzing(true); // ✅ Iniciar estado de análisis
      setParsedData(null); // ✅ Limpiar datos previos

      try {
        // ✅ Simular pasos del análisis con pequeñas pausas
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Cargar marcas
        await loadBrands();

        await new Promise((resolve) => setTimeout(resolve, 200));

        // Detectar nombre de marca del archivo
        const brandName = extractBrandFromFilename(selectedFile.name);
        setDetectedBrandName(brandName);

        await new Promise((resolve) => setTimeout(resolve, 300));

        // Leer y parsear archivo
        const text = await selectedFile.text();
        const separator = detectSeparator(text);
        const rows = parseCSV(text, separator);
        const headers = Object.keys(rows[0] || {});

        await new Promise((resolve) => setTimeout(resolve, 400));

        setParsedData({
          headers,
          rows: rows.slice(0, 5), // Solo mostrar primeras 5 filas en preview
          separator,
        });

        addToast({
          type: "success",
          title: "Archivo analizado correctamente",
          description: `Se detectaron ${rows.length} filas. Marca detectada: "${brandName}"`,
        });
      } catch (error) {
        addToast({
          title: "Error al analizar archivo",
          description: "No se pudo procesar el archivo seleccionado",
          type: "error",
        });
        setFile(null);
        setDetectedBrandName("");
      } finally {
        setAnalyzing(false); // ✅ Finalizar estado de análisis
      }
    },
    [addToast]
  );

  // Procesar importación
  const handleImport = async () => {
    if (!file || !parsedData) return;

    setImporting(true);
    setProgress(0);
    setActiveTab("results");

    try {
      const text = await file.text();
      const rows = parseCSV(text, parsedData.separator);
      const headers = parsedData.headers;

      const importResult: ImportResult = {
        success: 0,
        errors: [],
        warnings: [],
      };

      console.log("Iniciando importación de", rows.length, "productos");
      console.log("Headers detectados:", headers);
      console.log("Marca detectada:", detectedBrandName);

      // Obtener o crear marca basada en el nombre del archivo
      const brandId = await findOrCreateBrandFromFilename(file.name);

      // Agrupar productos por nombre (para manejar múltiples tallas del mismo producto)
      const productGroups: { [key: string]: ParsedProduct[] } = {};

      // Parsear todos los productos
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const parsedProduct = parseProductFromRow(row, headers);

        if (parsedProduct) {
          const key = parsedProduct.name.toLowerCase();
          if (!productGroups[key]) {
            productGroups[key] = [];
          }
          productGroups[key].push(parsedProduct);
        }
      }

      console.log("Productos agrupados:", Object.keys(productGroups).length);

      let processedCount = 0;
      const totalProducts = Object.keys(productGroups).length;

      // Procesar cada grupo de productos
      for (const [productName, variants] of Object.entries(productGroups)) {
        processedCount++;
        setProgress((processedCount / totalProducts) * 100);

        try {
          // Usar el primer producto del grupo como base
          const baseProduct = variants[0];

          // Crear variantes con todas las tallas
          const productVariants = variants.map((variant) => ({
            size: variant.size,
            stock: variant.quantity,
          }));

          // Preparar datos del producto
          const productData: CreateProductForm = {
            name: baseProduct.name,
            brandId: brandId,
            barcode: generateBarcode(),
            gender: detectGenderFromName(baseProduct.originalName),
            category: baseProduct.category as any,
            color: "Sin especificar",
            price: baseProduct.price,
            cost: Math.round(baseProduct.price * 0.6), // Estimar costo como 60% del precio
            minStock: 5,
            variants: productVariants,
          };

          console.log(
            `Creando producto: ${baseProduct.name} con ${productVariants.length} variantes para marca: ${detectedBrandName}`
          );

          // Crear producto
          await createProduct(productData);
          importResult.success++;

          // Agregar advertencia si hay múltiples precios para el mismo producto
          const uniquePrices = [...new Set(variants.map((v) => v.price))];
          if (uniquePrices.length > 1) {
            importResult.warnings.push({
              row: 0,
              message: `Producto "${
                baseProduct.name
              }" tiene precios diferentes: ${uniquePrices.join(
                ", "
              )}. Se usó: ${baseProduct.price}`,
              data: {
                producto: baseProduct.name,
                precios: uniquePrices.join(", "),
              },
            });
          }
        } catch (error: any) {
          console.error(`Error creando producto "${productName}":`, error);
          importResult.errors.push({
            row: 0,
            message: `Error creando "${productName}": ${
              error.message || "Error desconocido"
            }`,
            data: { producto: productName },
          });
        }

        // Pequeña pausa para no sobrecargar el sistema
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setResult(importResult);

      // Refrescar lista de productos
      await fetchProducts();

      addToast({
        type: "success",
        title: "Importación completada",
        description: `${importResult.success} productos importados para la marca "${detectedBrandName}"`,
      });
    } catch (error: any) {
      console.error("Error general en importación:", error);
      addToast({
        title: "Error en la importación",
        description:
          error.message || "Ocurrió un error durante el proceso de importación",
        type: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  // Descargar plantilla
  const downloadTemplate = () => {
    const template = `ARTICULO MUJER,,PRECIO,CANTIDAD
BUZO COTTON NARANJA XL,,33400,1
REMERA BASICA BLANCA M,,15000,2
PANTALON JEAN AZUL L,,25000,1`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MARCA_EJEMPLO.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>
            Resultados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Información del formato */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <strong>Marca automática:</strong> El sistema usará el nombre del
              archivo CSV como marca. Por ejemplo, "STOCK_G&C_sport.csv" creará
              la marca "G&C sport". Los productos incluyen la talla en el nombre
              y se agruparán automáticamente por variantes.
            </AlertDescription>
          </Alert>

          {/* Marca detectada */}
          {detectedBrandName && !analyzing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge className="bg-blue-600 text-white">
                    Marca detectada: {detectedBrandName}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Todos los productos se importarán bajo esta marca extraída del
                  nombre del archivo
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Plantilla */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Plantilla de Ejemplo</span>
              </CardTitle>
              <CardDescription>
                Descarga una plantilla de ejemplo. Recuerda nombrar tu archivo
                con el nombre de la marca
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="cursor-pointer"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Plantilla CSV
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Tip:</strong> Nombra tu archivo como
                "MARCA_PRODUCTOS.csv" para que la marca se detecte
                automáticamente
              </p>
            </CardContent>
          </Card>

          {/* Subir archivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Seleccionar Archivo</span>
              </CardTitle>
              <CardDescription>
                Sube tu archivo CSV. El nombre del archivo se usará como marca
                automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Archivo CSV/Excel</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="mt-1 cursor-pointer"
                  disabled={analyzing} // ✅ Deshabilitar durante análisis
                />
              </div>

              {file && (
                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Archivo seleccionado:</strong> {file.name} (
                    {(file.size / 1024).toFixed(1)} KB)
                    {!analyzing && detectedBrandName && (
                      <>
                        <br />
                        <strong>Marca que se creará:</strong>{" "}
                        {detectedBrandName}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* ✅ Spinner de análisis */}
          {analyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium">
                      Analizando archivo...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Detectando estructura, marca y productos del archivo CSV
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span>Procesando datos</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vista previa */}
          {parsedData && !analyzing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Vista Previa y Análisis</span>
                </CardTitle>
                <CardDescription>
                  Primeras 5 filas del archivo con análisis automático. Marca:{" "}
                  <strong>{detectedBrandName}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {parsedData.headers.map((header, index) => (
                          <th
                            key={index}
                            className="border border-gray-300 px-2 py-1 text-left text-sm font-medium"
                          >
                            {header}
                          </th>
                        ))}
                        <th className="border border-gray-300 px-2 py-1 text-left text-sm font-medium bg-blue-50">
                          Análisis
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.rows.map((row, index) => {
                        const parsed = parseProductFromRow(
                          row,
                          parsedData.headers
                        );
                        return (
                          <tr key={index}>
                            {parsedData.headers.map((header, colIndex) => (
                              <td
                                key={colIndex}
                                className="border border-gray-300 px-2 py-1 text-sm"
                              >
                                {row[header] || "-"}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-xs bg-blue-50">
                              {parsed && (
                                <div className="space-y-1">
                                  <div>
                                    <strong>Producto:</strong> {parsed.name}
                                  </div>
                                  <div>
                                    <strong>Talla:</strong> {parsed.size}
                                  </div>
                                  <div>
                                    <strong>Categoría:</strong>{" "}
                                    {parsed.category}
                                  </div>
                                  <div>
                                    <strong>Género:</strong>{" "}
                                    {detectGenderFromName(parsed.originalName)}
                                  </div>
                                  <div>
                                    <strong>Marca:</strong> {detectedBrandName}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Los productos se agruparán por nombre y se asignarán a la
                    marca: <strong>{detectedBrandName}</strong>
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Productos
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {importing ? (
            // ✅ Spinner mientras se importan los productos
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <Loader2 className="h-16 w-16 animate-spin text-green-600" />
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-semibold text-green-800">
                      Importando productos...
                    </h3>
                    <p className="text-lg text-green-700">
                      Creando productos para la marca:{" "}
                      <strong>{detectedBrandName}</strong>
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 bg-green-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-green-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="font-medium">
                        {Math.round(progress)}% completado
                      </span>
                    </div>
                    <div className="w-full max-w-md mt-6">
                      <Progress value={progress} className="w-full h-3" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Por favor espera mientras procesamos todos los
                      productos...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            // ✅ Resultados cuando la importación está completa
            <>
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {result.success}
                        </p>
                        <p className="text-sm text-gray-600">
                          Productos creados
                        </p>
                        <p className="text-xs text-gray-500">
                          Marca: {detectedBrandName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {result.errors.length}
                        </p>
                        <p className="text-sm text-gray-600">Errores</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {result.warnings.length}
                        </p>
                        <p className="text-sm text-gray-600">Advertencias</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errores */}
              {result.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span>Errores ({result.errors.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Productos que no pudieron ser importados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 p-2 bg-red-50 rounded"
                        >
                          <Badge variant="destructive" className="mt-0.5">
                            Error
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              {error.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Advertencias */}
              {result.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Advertencias ({result.warnings.length})</span>
                    </CardTitle>
                    <CardDescription>
                      Observaciones durante la importación
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.warnings.map((warning, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-2 p-2 bg-yellow-50 rounded"
                        >
                          <Badge
                            variant="outline"
                            className="mt-0.5 border-yellow-600 text-yellow-600"
                          >
                            Advertencia
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-800">
                              {warning.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Acciones */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => {
                    setActiveTab("upload");
                    setFile(null);
                    setParsedData(null);
                    setResult(null);
                    setDetectedBrandName("");
                  }}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Importar Otro Archivo
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="cursor-pointer"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
