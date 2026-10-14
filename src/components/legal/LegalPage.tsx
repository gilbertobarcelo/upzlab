import Link from "next/link";
import type { ReactNode } from "react";
import UpzLabHeader from "@/components/UpzLabHeader";

export const CONTACT_EMAIL = "contato@upzlab.com";

const LEGAL_LINKS = [
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
  { href: "/exclusao-de-dados", label: "Exclusão de dados" },
  { href: "/privacidade-saude", label: "Saúde do Consumidor" },
  { href: "/publicidade", label: "Publicidade" },
];

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#121416] text-[#e2e5e8] antialiased">
      <UpzLabHeader />
      <main className="px-5 py-12 text-slate-300">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black text-white">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">Atualizado em {updated}</p>
          <div className="mt-8 space-y-6 text-[15px] leading-7 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_a]:text-white [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
            {children}
          </div>
        </div>
      </main>
      <footer className="border-t border-white/[0.06] px-5 py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">{l.label}</Link>
          ))}
          <span className="ml-auto">Desenvolvido por UpzLab · © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
