import React from 'react';

export default function DesafiosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Desafios & Bounties
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Complete missões críticas, ache bugs de segurança avançados e ganhe prêmios exclusivos e grandes quantias de UpzPoints.
          </p>
        </div>
      </div>

      <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
          <svg className="w-8 h-8 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Painel de Bounties em Breve</h2>
        <p className="text-slate-400 font-mono text-sm max-w-md mx-auto">
          Logo as empresas parceiras poderão listar bugs de segurança super específicos (Bug Bounty) com recompensas gigantescas.
        </p>
      </div>
    </div>
  );
}
