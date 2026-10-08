"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0E1A] space-y-6">
      <header className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">App Studio</h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Painel profissional de gestão de testes e desempenho
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/80 flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Status</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Em Teste Aberto
            </span>
          </div>
          <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-900/20">
            Pausar Testes
          </button>
        </div>
      </header>
      
      <nav className="flex gap-2 p-1 bg-slate-900/50 rounded-xl w-fit border border-slate-800/80">
        <Link href={`/studio/${id}`} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${pathname === `/studio/${id}` ? "bg-slate-800 text-emerald-400 shadow-sm" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"}`}>
          Visão Geral
        </Link>
        <Link href={`/studio/${id}/testadores`} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${pathname === `/studio/${id}/testadores` ? "bg-slate-800 text-emerald-400 shadow-sm" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"}`}>
          Testadores
        </Link>
        <Link href={`/studio/${id}/feedbacks`} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${pathname === `/studio/${id}/feedbacks` ? "bg-slate-800 text-emerald-400 shadow-sm" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"}`}>
          Feedbacks & Bugs
        </Link>
        <Link href={`/studio/${id}/configuracoes`} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${pathname === `/studio/${id}/configuracoes` ? "bg-slate-800 text-emerald-400 shadow-sm" : "hover:bg-slate-800/60 text-slate-400 hover:text-white"}`}>
          Configurações
        </Link>
      </nav>

      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
