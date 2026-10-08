import React from 'react';

export default function FerramentasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Ferramentas Lab
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Scripts, geradores e recursos internos que auxiliam você nos testes e relatórios de aplicativos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#131D33]/40 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 backdrop-blur-xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 bg-[#0A0E1A] border border-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:border-purple-500/50 transition-colors">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-md font-bold text-white mb-2">Gerador de Casos de Teste</h3>
          <p className="text-xs text-slate-400">Monte planilhas de testes automatizadas apenas descrevendo as telas do app.</p>
        </div>
        
        <div className="bg-[#131D33]/40 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 backdrop-blur-xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 bg-[#0A0E1A] border border-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:border-purple-500/50 transition-colors">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <h3 className="text-md font-bold text-white mb-2">Logs & Monitoramento</h3>
          <p className="text-xs text-slate-400">Verificador de console log para SDKs e permissões ocultas.</p>
        </div>
        
        <div className="bg-[#131D33]/40 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 backdrop-blur-xl transition-all cursor-pointer group hover:-translate-y-1">
          <div className="w-12 h-12 bg-[#0A0E1A] border border-slate-700 rounded-xl flex items-center justify-center mb-4 group-hover:border-purple-500/50 transition-colors">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
          <h3 className="text-md font-bold text-white mb-2">Template de Report de Bug</h3>
          <p className="text-xs text-slate-400">Baixe o nosso padrão oficial para aumentar em 90% a chance de aprovação.</p>
        </div>
      </div>
    </div>
  );
}
