"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useComunidade } from "../../ComunidadeContext";

interface BetaApp {
  id: string;
  slug: string;
  name: string;
  developer: string;
  description: string;
  category: string;
  reward: number;
  requiredLevel: string;
  slots: string;
  tags: string[];
  icon: string;
}

const AppIcon = ({ iconUrl, appName }: { iconUrl: string, appName: string }) => {
  const [error, setError] = useState(false);
  const isValidUrl = iconUrl && (iconUrl.startsWith("/") || iconUrl.startsWith("http"));
  const src = iconUrl.startsWith("/") ? `http://localhost:8001${iconUrl}` : iconUrl;

  if (!isValidUrl || error) {
    return <span className="opacity-80 uppercase">{appName.charAt(0)}</span>;
  }

  return (
    <img 
      src={src} 
      alt={appName} 
      className="w-full h-full object-cover" 
      onError={() => setError(true)} 
    />
  );
};

export default function AppLabPage() {
  const { devUser, formatPoints } = useComunidade();
  const [apps, setApps] = useState<BetaApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todos" | "meus">("todos");

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        let url = "http://localhost:8001/api/upzlab/campaigns/";
        if (activeTab === "meus" && devUser?.id) {
          url = `http://localhost:8001/api/upzlab/campaigns/meus-apps?dev_id=${devUser.id}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setApps(json.data);
          } else {
            setApps([]);
          }
        } else {
          setApps([]);
        }
      } catch (err) {
        console.error("Erro ao buscar apps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [activeTab, devUser?.id]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#131D33]/90 border border-slate-800 rounded-2xl px-4 py-5 md:px-6 shadow-lg">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
            AppsLab
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-snug max-w-xl">
            Descubra os aplicativos da comunidade e ajude os desenvolvedores a testarem seus projetos. Ganhe UpzPoints ao participar de missões.
          </p>
        </div>

        <Link
          href="/apps/novo"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar App
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab("todos")}
          className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "todos"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
          }`}
        >
          Vitrine Geral
        </button>
        <button
          onClick={() => setActiveTab("meus")}
          className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === "meus"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
          }`}
        >
          Apps que Testo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-[#0A0E1A] border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum App na Vitrine</h3>
          <p className="text-slate-400 text-sm max-w-md">Seja o primeiro a publicar seu aplicativo na comunidade para receber testes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {apps.map(app => (
            <div key={app.id} className="bg-[#131D33] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col transition-all group hover:shadow-lg hover:shadow-indigo-900/10">
              
              <div className="flex gap-4 items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0A0E1A] border border-slate-700 flex items-center justify-center text-xl font-black text-indigo-400 shrink-0 overflow-hidden shadow-inner">
                  <AppIcon iconUrl={app.icon} appName={app.name} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{app.name}</h3>
                  <div className="text-xs font-mono text-slate-400 mt-1">{app.developer}</div>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold mt-2">
                    {app.category}
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2 flex-grow mb-4">
                {app.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="bg-[#0A0E1A] rounded-xl p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Recompensa</div>
                  <div className="text-emerald-400 font-black font-mono text-sm">{formatPoints(app.reward)} PTS</div>
                </div>
                <div className="bg-[#0A0E1A] rounded-xl p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Testadores</div>
                  <div className="text-indigo-400 font-black font-mono text-sm">{app.slots}</div>
                </div>
              </div>

              <Link href={`/apps/${app.slug || app.id}`}>
                <button className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wide transition-all border border-slate-700 hover:border-indigo-500">
                  Ver Detalhes
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
