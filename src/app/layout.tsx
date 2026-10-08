import React from "react";
import "./globals.css";
import { ComunidadeProvider } from "./ComunidadeContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0a0a] text-white min-h-screen" suppressHydrationWarning>
        <ComunidadeProvider>
          {children}
        </ComunidadeProvider>
      </body>
    </html>
  );
}
