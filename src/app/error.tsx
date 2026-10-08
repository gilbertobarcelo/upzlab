"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("UpzLab Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full flex flex-col items-center justify-center text-center space-y-6 z-10">
        
        {/* Ícone Minimalista (Sem fundo) */}
        <div className="flex items-center justify-center">
          <span className="text-3xl font-black font-mono text-indigo-400 tracking-widest drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">
            {`{}`}500
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-200 tracking-tight">
            Upz! Encontramos uma anomalia.
          </h1>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
            Nossos sistemas já registraram este evento.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4">
          <button
            onClick={() => reset()}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-all drop-shadow-[0_0_8px_rgba(129,140,248,0.3)] hover:drop-shadow-[0_0_12px_rgba(129,140,248,0.6)]"
          >
            Recarregar
          </button>
          
          <Link href="/" className="text-slate-400 hover:text-slate-300 text-sm font-semibold transition-all">
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
