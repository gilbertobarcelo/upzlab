import React from 'react';

export default function VagasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Vagas & Networking
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Conecte-se com tech recruiters e donos de aplicativos contratando testadores e desenvolvedores experientes.
          </p>
        </div>
      </div>

      <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
          <svg className="w-8 h-8 text-rose-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Mural de Oportunidades</h2>
        <p className="text-slate-400 font-mono text-sm max-w-md mx-auto">
          Para ter acesso às vagas fechadas de QA e Dev, é recomendado alcançar ao menos o rank <b>White Hat</b> no ranking da comunidade.
        </p>
      </div>
    </div>
  );
}
