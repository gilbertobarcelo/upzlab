"use client";

import { useComunidade } from "../../../ComunidadeContext";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotificacaoIndividualPage() {
  const { id } = useParams();
  const router = useRouter();
  const { notifications } = useComunidade();

  const notif = notifications.find((n) => n.id === id || n.id.toString() === id);

  if (!notif) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-xl font-bold text-white">Notificação não encontrada</h1>
        <p className="text-sm text-slate-400">Esta notificação pode ter sido excluída ou o ID é inválido.</p>
        <Link href="/notificacoes" className="px-5 py-2 mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors">
          Voltar para Notificações
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Botão de Voltar */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Voltar
      </button>

      {/* Card da Notificação */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Detalhe visual de borda superior */}
        <div className={`absolute top-0 inset-x-0 h-1.5 ${notif.read ? 'bg-slate-700' : 'bg-emerald-500'}`}></div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                {notif.title}
              </h1>
              {!notif.read && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  Nova
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {notif.time || new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>

            <div className="h-px w-full bg-slate-800/80 my-4" />

            <div className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-line bg-[#0A0E1A]/40 p-5 rounded-2xl border border-slate-800/50">
              {notif.message}
            </div>
          </div>

          {/* Recompensas / Side Info */}
          {(notif.points || notif.badge) && (
            <div className="w-full md:w-48 shrink-0 flex flex-col gap-3">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Recompensas
              </div>
              
              {notif.points && (
                <div className="bg-[#0A0E1A] border border-emerald-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-emerald-400">+{notif.points}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase mt-1">UpzPoints</span>
                </div>
              )}

              {notif.badge && (
                <div className="bg-[#0A0E1A] border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <svg className="w-8 h-8 text-amber-500 mb-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/></svg>
                  <span className="text-xs font-bold text-amber-400">{notif.badge}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">Medalha</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
