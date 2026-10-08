"use client";

import { useComunidade } from "../../ComunidadeContext";
import Link from "next/link";

export default function ComunidadeNotificacoesPage() {
  const { notifications, markAllNotificationsRead } = useComunidade();

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#131D33]/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <span>Central de Notificações</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Avisos de avaliação de anomalias, medalhas e pontos concedidos pelo fundador</p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-mono transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Marcar Todas como Lidas</span>
        </button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <Link
            href={`/notificacoes/${n.id}`}
            key={n.id}
            className={`block p-6 rounded-3xl border-2 transition-all backdrop-blur-xl ${
              n.read
                ? "bg-[#131D33]/50 border-slate-800 text-slate-300 hover:bg-[#131D33]"
                : "bg-[#131D33] border-emerald-500/40 text-white shadow-md hover:border-emerald-500/60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                  <h2 className="text-sm font-bold">{n.title}</h2>
                  {n.badge && (
                    <span className="px-2.5 py-0.5 rounded bg-[#0A0E1A] border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                      [{n.badge}]
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{n.message}</p>
                <div className="text-[10px] font-mono text-slate-400">{n.time}</div>
              </div>

              {n.points && (
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs">
                  +{n.points} PTS
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
