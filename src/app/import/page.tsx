"use client";
import ProductImporter from "@/components/ProductImporter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Importar Productos</h1>
        <p className="text-gray-600">
          Importa productos masivamente desde archivos CSV o Excel
        </p>
      </div>

      {/* Información importante */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Asegúrate de que tu archivo tenga las
          columnas correctas. Puedes descargar una plantilla de ejemplo para ver
          el formato esperado.
        </AlertDescription>
      </Alert>

      {/* Componente principal */}
      <ProductImporter />
    </div>
  );
}
