"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";

const landingLinks = [
  { label: "Para Testers", href: "/#testers" },
  { label: "Para Criadores", href: "/#criadores" },
  { label: "Funcionalidades", href: "/#features" },
  { label: "UpzPoints", href: "/#points" },
  { label: "SDK Android", href: "/sdk" },
];

const documentationLinks = [
  { label: "Visão geral", href: "/sdk" },
  { label: "Começar a integrar", href: "/sdk/integracao" },
  { label: "React Native", href: "/sdk/integracao/react-native" },
  { label: "React / Next + Capacitor", href: "/sdk/integracao/capacitor" },
  { label: "Android nativo · Kotlin", href: "/sdk/integracao/kotlin" },
  { label: "API e autenticação", href: "/sdk/api" },
];

export default function SDKDocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 20);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  if (pathname.startsWith("/sdk/monitoramento")) return children;

  return (
    <div className="min-h-screen bg-[#101214] text-white">
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${scrolled ? "border-b border-white/[0.08] bg-[#171a1d]/95 backdrop-blur-xl" : "bg-[#121416]/85 backdrop-blur-sm"}`}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5">
          <Link href="/sdk" aria-label="UpzLab — documentação SDK">
            <Image src="/upzlab-wordmark-v6.svg" alt="UpzLab" width={124} height={48} className="h-9 w-auto" priority />
          </Link>
          <nav aria-label="Menu principal" className="hidden items-center gap-0.5 md:flex">
            {landingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] transition-all ${
                  item.href === "/sdk"
                    ? "bg-white/5 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link href="/login" className="px-4 py-1.5 text-[13px] font-semibold text-white/50 transition-colors hover:text-white">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-[#101416] shadow-lg shadow-black/30 transition-all hover:bg-white/90"
            >
              Criar conta grátis
            </Link>
          </div>
          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/5 hover:text-white md:hidden"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <div className="space-y-1 border-b border-white/5 bg-[#1a1a1a] px-5 py-4 md:hidden">
            {landingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg border border-white/10 py-2.5 text-center text-sm font-semibold text-white/60"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg bg-white py-2.5 text-center text-sm font-bold text-[#101416]"
              >
                Criar conta grátis
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-7 px-4 pb-6 pt-20 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="self-start lg:sticky lg:top-24">
          <div className="rounded-xl border border-white/[0.08] bg-[#151719] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
              Documentação
            </p>
            <nav aria-label="Documentação SDK" className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {documentationLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-2.5 text-xs transition ${
                      active
                        ? "bg-white/[0.09] font-semibold text-white"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-white/[0.07] pt-3">
              <Link
                href="/sdk/monitoramento"
                className="block rounded-lg px-3 py-2.5 text-xs text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Monitoramento da conta ↗
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#151719] p-4">
            <p className="text-xs font-semibold text-slate-200">Qual integração escolher?</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              React Native ou Capacitor: TypeScript. App Android sem WebView: Kotlin nativo.
            </p>
            <Link
              href="/sdk/integracao"
              className="mt-3 inline-flex text-[11px] font-semibold text-slate-200 underline decoration-white/20 underline-offset-4 hover:decoration-white/60"
            >
              Ver o guia de início →
            </Link>
          </div>
        </aside>

        <main className="min-w-0 pb-12">{children}</main>
      </div>
    </div>
  );
}
