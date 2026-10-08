"use client";
import React, { useState } from "react";

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

export function FeedbackList({ feedbacks = [] }: { feedbacks?: any[] }) {
  const [localFeedbacks, setLocalFeedbacks] = useState(feedbacks);
  
  const handleReview = async (id: number, status: string) => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:8001/api/upzlab/beta-feedback/comunidade/post/${id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setLocalFeedbacks(prev => prev.map(fb => fb.id === id ? { ...fb, status } : fb));
      } else {
        alert(data.detail || "Erro ao processar a ação");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão");
    }
  };

  const displayFeedbacks = localFeedbacks;

  return (
    <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Feedbacks Recentes</h2>
        <button className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">
          Ver todos →
        </button>
      </div>
      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        {displayFeedbacks.length > 0 ? (
          displayFeedbacks.map((fb: any) => (
            <div key={fb.id} className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col gap-3">
              {/* Header: Tipo e Autor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase border ${
                    fb.type === "bug" || fb.type === "anomalia" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : 
                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {fb.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{fb.created_at ? new Date(fb.created_at).toLocaleDateString() : 'Hoje'}</span>
                </div>
                {fb.status === "open" ? (
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Aguardando Análise</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Resolvido</span>
                )}
              </div>

              {/* Título e Descrição */}
              <div>
                <h3 className="text-sm font-bold text-white mb-1.5">{fb.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{fb.description}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-2">
                  Reportado por <span className="text-indigo-400 font-bold">{fb.author}</span>
                </p>
              </div>

              {/* Dados Estruturados QA */}
              {(fb.deviceOs || fb.stepsToReproduce || fb.uxRating) && (
                <div className="mt-2 bg-[#0A0E1A] rounded-lg p-3 border border-indigo-500/10 space-y-2">
                  {fb.deviceOs && (
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Dispositivo/OS</span>
                      <span className="text-xs text-indigo-300">{fb.deviceOs}</span>
                    </div>
                  )}
                  {fb.stepsToReproduce && (
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Steps to Reproduce</span>
                      <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900 p-2 rounded border border-slate-800">{fb.stepsToReproduce}</p>
                    </div>
                  )}
                  {fb.uxRating && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">UX/UI Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${n <= fb.uxRating ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ações (Aprovar / Rejeitar) */}
              {fb.status === "open" && (
                <div className="flex gap-2 mt-2 pt-3 border-t border-slate-700/50">
                  <button 
                    onClick={() => handleReview(fb.id, "approved")}
                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Aprovar (Premiar Dev)
                  </button>
                  <button 
                    onClick={() => handleReview(fb.id, "rejected")}
                    className="flex-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Rejeitar Spam
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm p-6 text-center">
            Nenhum feedback ou bug reportado para este aplicativo ainda.
          </div>
        )}
      </div>
    </div>
  );
}
