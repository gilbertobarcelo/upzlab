"use client";

import { useState } from "react";
import { useComunidade, DevProfile } from "../../ComunidadeContext";

export default function ComunidadeRankingPage() {
  const { topDevs } = useComunidade();
  const [selectedDev, setSelectedDev] = useState<DevProfile | null>(null);

  return (
    <div className="space-y-6">
      
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <h1 className="text-xl font-black text-white">Ranking dos Desenvolvedores Destaque</h1>
        <p className="text-slate-400 text-xs mt-1">Classificação por contribuições técnicas validadas, relatórios de bug e anomalias corrigidas</p>
      </div>

      <div className="bg-[#131D33]/90 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
        {topDevs.map((dev, idx) => (
          <div
            key={dev.id}
            onClick={() => setSelectedDev(dev)}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0A0E1A] border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                idx === 0 ? "bg-emerald-600 text-white shadow-md" :
                idx === 1 ? "bg-slate-700 text-white" :
                idx === 2 ? "bg-amber-700 text-white" :
                "bg-slate-800 text-slate-400"
              }`}>
                #{idx + 1}
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-xs font-mono shadow-md">
                {dev.name.split(" ").map(n => n[0]).join("")}
              </div>

              <div>
                <h2 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{dev.name}</h2>
                <p className="text-[11px] font-mono text-slate-400">{dev.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-1">
                {dev.badges.map((b, bIdx) => (
                  <span key={bIdx} className="px-2 py-0.5 rounded bg-[#131D33] border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    [{b}]
                  </span>
                ))}
              </div>

              <div className="text-right min-w-[90px]">
                <div className="text-sm font-black font-mono text-emerald-400">{dev.points} PONTOS</div>
                <div className="text-[10px] font-mono text-slate-400">{dev.contributionsCount} contribuições</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dev Detail Modal */}
      {selectedDev && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#131D33] border-2 border-slate-700 rounded-3xl p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setSelectedDev(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-[#0A0E1A] border border-slate-700 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-xl font-mono shadow-md">
                {selectedDev.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{selectedDev.name}</h3>
                <p className="text-xs font-mono text-emerald-400">{selectedDev.role}</p>
                <p className="text-[11px] font-mono text-slate-400">{selectedDev.location}</p>
              </div>
            </div>

            <div className="bg-[#0A0E1A] p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Pontuação Total:</span>
                <span className="font-bold text-emerald-400">{selectedDev.points} PONTOS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total de Relatos:</span>
                <span className="font-bold text-white">{selectedDev.contributionsCount} enviadas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GitHub:</span>
                <span className="text-emerald-400">{selectedDev.github || "N/D"}</span>
              </div>
            </div>

            {selectedDev.highlightAnomaly && (
              <div className="bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-2xl p-4 space-y-2 border border-slate-800/60">
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  MAIOR ANOMALIA IDENTIFICADA POR ESTE DEV
                </div>
                <h4 className="text-sm font-bold text-white">{selectedDev.highlightAnomaly.title}</h4>
                <p className="text-xs text-slate-300">{selectedDev.highlightAnomaly.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">MEDALHA: [{selectedDev.highlightAnomaly.badge}]</span>
                  <span className="text-slate-400">{selectedDev.highlightAnomaly.status}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedDev(null)}
              className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold text-xs uppercase hover:text-white"
            >
              Fechar Detalhes do Dev
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
