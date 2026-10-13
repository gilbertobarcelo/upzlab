import type { Metadata } from "next";
import SDKDocsShell from "./sdk-docs-shell";

export const metadata: Metadata = {
  title: {
    default: "SDK UpzLab para Android",
    template: "%s | SDK UpzLab",
  },
  description:
    "Documentação pública do SDK UpzLab para integrar e testar aplicativos Android com React Native, Capacitor ou Kotlin nativo.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "UpzLab",
    title: "SDK UpzLab para Android",
    description:
      "Guias de integração do SDK UpzLab para aplicativos Android com React Native, Capacitor e Kotlin.",
  },
  twitter: {
    card: "summary",
    title: "SDK UpzLab para Android",
    description:
      "Guias de integração do SDK UpzLab para aplicativos Android com React Native, Capacitor e Kotlin.",
  },
};

export default function SDKLayout({ children }: { children: React.ReactNode }) {
  return <SDKDocsShell>{children}</SDKDocsShell>;
}
