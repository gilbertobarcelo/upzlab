"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/comunidade")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black/95 backdrop-blur-xl border-b border-[#333B54]/40 py-2.5 px-4 md:px-8 flex justify-between items-center transition-all">
      {/* Logo Oficial */}
      <div className="flex items-center cursor-pointer ml-4 md:ml-8">
        <Link href="/">
          <img src="/logo.webp" alt="É Golpe" width="120" height="36" decoding="async" fetchPriority="high" className="h-8 md:h-9 w-auto object-contain" />
        </Link>
      </div>

      {/* Menu Desktop */}
      <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-medium text-slate-300 text-xs tracking-wide">
        <Link href="/sobre" className="hover:text-[#00FF87] transition-colors font-semibold">Sobre Nós</Link>
        <Link href="/problema" className="hover:text-[#00FF87] transition-colors">O Problema</Link>
        <Link href="/como-funciona" className="hover:text-[#00FF87] transition-colors">Como Funciona</Link>
        <Link href="/tecnologia" className="hover:text-[#00FF87] transition-colors">Tecnologia</Link>
        <Link href="/diferenciais" className="hover:text-[#00FF87] transition-colors">Diferenciais</Link>
        <Link href="/comunidade" className="hover:text-[#00FF87] transition-colors font-semibold text-[#00FF87]">Comunidade</Link>
        <Link href="/faq" className="hover:text-[#00FF87] transition-colors">FAQ</Link>
        <Link href="/contato" className="hover:text-[#00FF87] transition-colors font-semibold">Contato</Link>
        <Link href="/beta" className="group flex items-center gap-2 hover:text-[#00FF87] transition-colors font-bold text-[#00FF87] ml-2 px-3 py-1.5 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/20 hover:bg-[#00FF87]/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF87]"></span>
          </span>
          Acesso Beta
        </Link>
      </nav>

      {/* Botões à Direita (Mobile + Desktop) */}
      <div className="flex items-center gap-3">
        {/* Botão Baixar App (Sempre Visível, inclusive no Mobile) */}
        <Link 
          href="/beta" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-[#00FF87] hover:bg-[#00e077] px-3.5 py-1.5 md:px-4 md:py-2 rounded-full shadow-[0_0_15px_rgba(0,255,135,0.3)] hover:shadow-[0_0_25px_rgba(0,255,135,0.6)] transition-all duration-300"
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.71,2.5L16.29,14.66L19.46,12.87L20.89,12C21.46,11.66 21.46,10.84 20.89,10.5L19.46,9.63L16.29,7.84L3.71,2.5M3,3.31V20.69C3.06,21.04 3.39,21.19 3.66,21L14.71,15.69L4.03,5.37C3.59,4.95 3,5.18 3,5.81V3.31Z"/>
          </svg>
          <span>Baixar App (Beta)</span>
        </Link>

        {/* Botão Hambúrguer Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-slate-300 hover:text-white p-1.5 focus:outline-none"
          aria-label="Abrir Menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Drawer Menu Mobile Retrátil */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0A0E1A]/95 backdrop-blur-2xl border-b border-[#333B54]/40 p-6 flex flex-col gap-4 md:hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <Link 
            href="/sobre" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm font-semibold py-2 border-b border-white/5"
          >
            Sobre Nós
          </Link>
          <Link 
            href="/problema" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm py-2 border-b border-white/5"
          >
            O Problema
          </Link>
          <Link 
            href="/como-funciona" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm py-2 border-b border-white/5"
          >
            Como Funciona
          </Link>
          <Link 
            href="/tecnologia" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm py-2 border-b border-white/5"
          >
            Tecnologia
          </Link>
          <Link 
            href="/diferenciais" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm py-2 border-b border-white/5"
          >
            Diferenciais
          </Link>
          <Link 
            href="/faq" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm py-2 border-b border-white/5"
          >
            FAQ
          </Link>
          <Link 
            href="/contato" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-[#00FF87] text-sm font-semibold py-2 border-b border-white/5"
          >
            Contato
          </Link>
          <Link 
            href="/beta" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-[#00FF87] hover:text-white text-sm font-bold py-3 px-4 bg-[#00FF87]/10 border border-[#00FF87]/20 rounded-xl"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF87]"></span>
            </span>
            Programa Beta Tester
          </Link>
        </div>
      )}
    </header>
  );
}
