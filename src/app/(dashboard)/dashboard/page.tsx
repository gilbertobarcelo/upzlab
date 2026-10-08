'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Mock Data local para Perfil (Ainda a ser feito no backend)
const mockProfile = {
  name: "Rafael QA",
  github: "@rafaelqa",
  avatar: "https://i.pravatar.cc/150?u=rafael",
  level: "Scanner",
  points: 1250,
  testsCompleted: 4
};

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca as campanhas direto do nosso Backend Python!
  useEffect(() => {
    fetch('http://localhost:8001/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.data);
        }
      })
      .catch(err => console.error("Erro ao buscar campanhas:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white selection:bg-indigo-500/30">
      
      {/* Topbar Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold font-heading">
            U
          </div>
          <h1 className="text-xl font-heading font-bold tracking-tight">UpzLab <span className="text-white/40 font-normal">Community</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
            <span className="font-mono text-sm text-indigo-300 font-medium">{mockProfile.points} UpzPoints</span>
          </div>
          
          <button className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{mockProfile.name}</div>
              <div className="text-xs text-white/50">{mockProfile.level}</div>
            </div>
            <img src={mockProfile.avatar} alt="Avatar" className="w-9 h-9 rounded-full border border-white/10" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Sidebar / Stats */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
            
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Seu Progresso</h2>
            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Nível Atual</span>
                  <span className="text-indigo-400 font-medium">{mockProfile.level}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-2/3 rounded-full"></div>
                </div>
                <div className="text-xs text-white/40 mt-2 text-right">Faltam 250 pts para Hunter</div>
              </div>
              
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-mono">{mockProfile.testsCompleted}</div>
                  <div className="text-xs text-white/40">Testes Feitos</div>
                </div>
                <div>
                  <div className="text-2xl font-mono text-emerald-400">100%</div>
                  <div className="text-xs text-white/40">Aprovação</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20">
            <h3 className="font-medium mb-2">Quer lançar seu App?</h3>
            <p className="text-sm text-white/60 mb-4">Você precisa de 2.000 UpzPoints para publicar sua primeira campanha de testes.</p>
            <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors cursor-pointer">
              Publicar App
            </button>
          </div>
        </aside>

        {/* Main Feed */}
        <section className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-1">Campanhas Disponíveis</h2>
              <p className="text-white/50">Escolha um aplicativo, teste e ganhe pontos.</p>
            </div>
            
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition cursor-pointer">Populares</button>
              <button className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white transition cursor-pointer">Recentes</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <div className="col-span-2 text-center py-10 text-white/50 animate-pulse">Carregando dados do Backend...</div>
            ) : campaigns.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-white/50">Nenhuma campanha encontrada no momento.</div>
            ) : campaigns.map((app) => (
              <div key={app.id} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                      {app.icon}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg">{app.name}</h3>
                      <p className="text-xs text-white/50">{app.developer} • {app.category}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-mono font-medium">
                    +{app.reward} pts
                  </div>
                </div>
                
                <p className="text-sm text-white/70 mb-5 line-clamp-2">
                  {app.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {app.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="text-xs text-white/40">
                    Nível Req: <span className="text-white/80">{app.requiredLevel}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-white/40">{app.slots} vagas</span>
                    <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors cursor-pointer">
                      Testar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
      </main>
    </div>
  );
}
