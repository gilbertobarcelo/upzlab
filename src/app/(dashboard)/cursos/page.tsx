import React from 'react';

export default function CursosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
            Cursos & Masterclass
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Gaste seus UpzPoints para desbloquear cursos avançados de QA, CyberSecurity, e Engenharia de Software.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#131D33]/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3">
             <span className="px-3 py-1 bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px] uppercase rounded border border-blue-500/30">Lançamento em Breve</span>
          </div>
          <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Introdução a QA e Testes Automatizados</h3>
          <p className="text-sm text-slate-400 mb-4">Aprenda a criar relatórios de bugs matadores e a utilizar ferramentas como Cypress e Jest.</p>
          <div className="text-emerald-400 font-mono font-bold text-sm">~ 5.000 UpzPoints</div>
        </div>

        <div className="bg-[#131D33]/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3">
             <span className="px-3 py-1 bg-purple-500/20 text-purple-400 font-mono font-bold text-[10px] uppercase rounded border border-purple-500/30">Em Gravação</span>
          </div>
          <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Fundamentos de Ethical Hacking</h3>
          <p className="text-sm text-slate-400 mb-4">Entenda as falhas mais comuns em apps mobile e web, do OWASP Top 10 à engenharia reversa.</p>
          <div className="text-emerald-400 font-mono font-bold text-sm">~ 15.000 UpzPoints</div>
        </div>
      </div>
    </div>
  );
}
