import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full flex flex-col items-center justify-center text-center space-y-6 z-10">
        
        {/* Ícone Minimalista (Sem fundo) */}
        <div className="flex items-center justify-center">
          <span className="text-3xl font-black font-mono text-emerald-400 tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            {`{}`}404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-200 tracking-tight">
            Upz... Rota inexistente.
          </h1>
          <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
            Não encontramos o endpoint solicitado.
          </p>
        </div>

        <div className="flex items-center justify-center pt-4">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-all drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
