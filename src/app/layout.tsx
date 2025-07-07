import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Stock - Ropa Deportiva",
  description: "Sistema de gestión de inventario para tienda de ropa deportiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="py-4 min-h-screen bg-gray-50">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
