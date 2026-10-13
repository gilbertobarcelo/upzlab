import React from "react";
import "./globals.css";
import { ComunidadeProvider } from "./ComunidadeContext";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getSeoMetadata } from "../lib/seo";

export async function generateMetadata() {
  const seo = await getSeoMetadata("/");
  return {
    ...seo,
    icons: {
      icon: [{ url: "/favicon.svg?v=5", type: "image/svg+xml" }],
      shortcut: "/favicon.svg?v=5",
      apple: "/favicon.svg?v=5",
    },
  };
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--upz-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--upz-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#121212] text-[#E0E0E0] min-h-screen antialiased" suppressHydrationWarning>
        <ComunidadeProvider>
          {children}
        </ComunidadeProvider>
      </body>
    </html>
  );
}
