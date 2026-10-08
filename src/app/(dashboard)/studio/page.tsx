"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useComunidade } from "../../ComunidadeContext";

export default function StudioIndexPage() {
  const { devUser, recentApps } = useComunidade();
  const [myApps, setMyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (devUser?.id) {
      setLoading(true);
      fetch(`http://localhost:8001/api/upzlab/campaigns/my-apps/${devUser.id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setMyApps(json.data);
          } else {
            setMyApps([]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (!devUser) {
      setLoading(false);
    }
  }, [devUser]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Studio Labs
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-2">
            Selecione um dos seus aplicativos abaixo para acessar o painel de métricas e gerenciamento de testes.
          </p>
        </div>
        <Link href="/apps/novo" className="mt-6 md:mt-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo App
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center p-12 font-mono animate-pulse">Carregando seus aplicativos...</div>
      ) : myApps.length === 0 ? (
        <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nenhum aplicativo encontrado</h2>
          <p className="text-slate-400 font-mono text-sm max-w-md mx-auto mb-6">
            Você ainda não cadastrou nenhum aplicativo. Cadastre seu primeiro projeto para começar a recrutar testadores e receber feedback profissional.
          </p>
          <Link href="/apps/novo" className="text-emerald-400 hover:text-emerald-300 font-bold font-mono text-sm uppercase transition-colors">
            Cadastrar agora →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myApps.map(app => (
            <Link key={app.id} href={`/studio/${app.slug || app.id}`} className="group bg-[#131D33]/60 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-6 transition-all hover:bg-slate-800/40 hover:-translate-y-1 shadow-lg cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#0A0E1A] border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-emerald-500/30 transition-colors">
                  {app.icon ? (
                    <img src={app.icon.startsWith("/") ? `http://localhost:8001${app.icon}` : app.icon} alt={app.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-400 font-black text-xl uppercase">{app.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase mb-1">
                    Ativo
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{app.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{app.category}</p>
                </div>
              </div>
              
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Feedbacks</div>
                  <div className="text-sm font-black text-white">--</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Testadores</div>
                  <div className="text-sm font-black text-white">{app.testers_count || 0}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
