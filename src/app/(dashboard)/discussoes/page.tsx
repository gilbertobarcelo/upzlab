import React from 'react';

export default function DiscussoesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            Fórum & Discussões
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Participe de conversas técnicas, tire dúvidas de código e compartilhe conhecimento com a comunidade UpzLab.
          </p>
        </div>
        <button className="mt-4 md:mt-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/30 shrink-0">
          Novo Tópico
        </button>
      </div>

      <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
          <svg className="w-8 h-8 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Fórum em Construção</h2>
        <p className="text-slate-400 font-mono text-sm max-w-md mx-auto">
          Nossa equipe está preparando categorias exclusivas para React, Segurança, UX/UI, e muito mais. Fique ligado!
        </p>
      </div>
    </div>
  );
}
