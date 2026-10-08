"use client";
import React, { useEffect, useState } from "react";
import { StatCards } from "./components/StatCards";
import { TestersTable } from "./components/TestersTable";
import { FeedbackList } from "./components/FeedbackList";
import { useComunidade } from "../../../ComunidadeContext";

const API_BASE = "http://localhost:8001";

const BOOST_OPTIONS = [
  {
    level: 1,
    label: "Boost de Feed",
    desc: "Prioridade no rodízio do feed por 7 dias",
    cost: 500,
    color: "blue",
    requiredLevel: "Scanner",
  },
  {
    level: 2,
    label: "Destaque Pinado",
    desc: "Posição fixa (3º card do feed) por 7 dias",
    cost: 1000,
    color: "purple",
    requiredLevel: "Scanner",
  },
  {
    level: 3,
    label: "Campanha Elite",
    desc: "Primeiro do feed + banner de destaque por 7 dias",
    cost: 1500,
    color: "amber",
    requiredLevel: "White Hat",
  },
];

const LEVEL_ORDER: Record<string, number> = {
  Scanner: 0, "White Hat": 1, "Bug Hunter": 2, "Cyber Ninja": 3,
  "UpzLab Team": 999, "Fundador / Admin Geral": 999
};

const BOOST_LABEL: Record<number, string> = {
  0: "Sem boost", 1: "Boost de Feed", 2: "Destaque Pinado", 3: "Campanha Elite",
};

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; btn: string }> = {
  blue:   { border: "border-blue-500/40",   bg: "bg-blue-500/10",   text: "text-blue-400",   btn: "bg-blue-600 hover:bg-blue-500" },
  purple: { border: "border-purple-500/40", bg: "bg-purple-500/10", text: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500" },
  amber:  { border: "border-amber-500/40",  bg: "bg-amber-500/10",  text: "text-amber-400",  btn: "bg-amber-600 hover:bg-amber-500" },
};

export default function AppStudioOverview({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const { devUser, refreshDevUser } = useComunidade();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [canceling, setCanceling] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/upzlab/campaigns/app/${id}/dashboard`)
      .then(res => res.json())
      .then(json => { if (json.success && json.data) setDashboardData(json.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, [id]);

  const getToken = () => {
    const names = ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"];
    for (const name of names) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
  };

  const handleBoost = async (level: number) => {
    setBoosting(true);
    setBoostMsg(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${id}/boost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ boost_level: level }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBoostMsg({ type: "success", text: json.message });
        await refreshDevUser();
        fetchDashboard();
      } else {
        setBoostMsg({ type: "error", text: json.detail || json.message || "Erro ao ativar boost" });
      }
    } catch (e) {
      setBoostMsg({ type: "error", text: "Erro de conexão" });
    } finally {
      setBoosting(false);
    }
  };

  const handleCancelBoost = async () => {
    setCanceling(true);
    setBoostMsg(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${id}/boost`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBoostMsg({ type: "success", text: "Boost cancelado." });
        fetchDashboard();
      }
    } catch (e) {
      setBoostMsg({ type: "error", text: "Erro ao cancelar" });
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 font-mono text-center p-12 animate-pulse">Carregando métricas...</div>;
  }

  if (!dashboardData) {
    return <div className="text-rose-400 font-mono text-center p-12">Falha ao carregar dados do aplicativo.</div>;
  }

  const boost = dashboardData.boost || { active: false, level: 0, days_left: 0, impressions: 0 };
  const userPoints = devUser?.points || 0;
  const userLevel = devUser?.role?.replace("Patente: ", "") || "Scanner";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <StatCards data={dashboardData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TestersTable testers={dashboardData.recent_testers || []} />
        </div>
        <div className="lg:col-span-1">
          <FeedbackList feedbacks={dashboardData.recent_feedbacks || []} />
        </div>
      </div>

      {/* ── Promover App ─────────────────────────────────────── */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Promover App</h2>
          </div>
          <div className="flex items-center gap-2 bg-[#0A0E1A] border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Seu saldo</span>
            <span className="text-emerald-400 font-black font-mono text-sm">{userPoints.toLocaleString()} pts</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Boost ativo */}
          {boost.active && (
            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <p className="text-emerald-400 font-bold text-sm">{BOOST_LABEL[boost.level]} ativo</p>
                  <p className="text-slate-400 text-[10px] font-mono">
                    {boost.days_left} dia{boost.days_left !== 1 ? "s" : ""} restante{boost.days_left !== 1 ? "s" : ""} · {boost.impressions} impressões
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelBoost}
                disabled={canceling}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {canceling ? "Cancelando..." : "Cancelar boost"}
              </button>
            </div>
          )}

          {/* Feedback de ação */}
          {boostMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm font-bold border ${
              boostMsg.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : "bg-rose-900/20 border-rose-500/30 text-rose-400"
            }`}>
              {boostMsg.text}
            </div>
          )}

          {/* Opções de boost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BOOST_OPTIONS.map(opt => {
              const c = COLOR_MAP[opt.color];
              const canAfford = userPoints >= opt.cost;
              const meetsLevel = LEVEL_ORDER[userLevel] >= LEVEL_ORDER[opt.requiredLevel];
              const isCurrentBoost = boost.active && boost.level === opt.level;
              const disabled = boosting || isCurrentBoost || !canAfford || !meetsLevel;

              return (
                <div
                  key={opt.level}
                  className={`relative rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                    isCurrentBoost ? "border-emerald-500/40 bg-emerald-900/10" : `${c.border} bg-[#0A0E1A]`
                  } ${disabled && !isCurrentBoost ? "opacity-60" : ""}`}
                >
                  {isCurrentBoost && (
                    <span className="absolute top-3 right-3 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                      Ativo
                    </span>
                  )}

                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${c.border} ${c.bg}`}>
                    <svg className={`w-4 h-4 ${c.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-xs font-black font-mono ${c.text}`}>{opt.cost.toLocaleString()} pts</span>
                    {!meetsLevel && (
                      <span className="text-[9px] text-amber-400 font-mono">Req: {opt.requiredLevel}</span>
                    )}
                  </div>

                  <button
                    disabled={disabled}
                    onClick={() => handleBoost(opt.level)}
                    className={`w-full py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-40 ${c.btn}`}
                  >
                    {isCurrentBoost ? "Em andamento" : boosting ? "Ativando..." : "Ativar"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-600 font-mono">
            * Cada boost tem duração de 7 dias. Pontos não são reembolsados ao cancelar antecipadamente.
          </p>
        </div>
      </div>
    </div>
  );
}
