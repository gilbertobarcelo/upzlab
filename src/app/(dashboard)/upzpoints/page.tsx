"use client";

import { useState, useEffect } from "react";
import { useComunidade } from "../../ComunidadeContext";

const API_BASE = "http://localhost:8001";

const STAFF_GROUPS = [
  { value: "all",         label: "Todos os devs"  },
  { value: "white_hat",   label: "White Hat"       },
  { value: "bug_hunter",  label: "Bug Hunter"      },
  { value: "cyber_ninja", label: "Cyber Ninja"     },
];

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface LedgerEntry {
  id: number;
  amount: number;
  reason: string;
  created_at: string;
}

interface DevItem {
  id: number;
  name: string;
  level: string;
  points: number;
}

interface AppItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  testers_count: number;
  testers: DevItem[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function UpzPointsPage() {
  const { devUser, formatPoints, refreshDevUser } = useComunidade();

  // Extrato
  const [statement, setStatement]           = useState<LedgerEntry[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(true);

  // Transferência (todos)
  const [transferData, setTransferData]     = useState<{ my_apps: AppItem[]; all_devs: DevItem[] } | null>(null);
  const [transferLoaded, setTransferLoaded] = useState(false);
  const [tMode, setTMode]                   = useState<"individual" | "app">("individual");
  const [tDevId, setTDevId]                 = useState<number | null>(null);
  const [tAppSlug, setTAppSlug]             = useState("");
  const [tAmount, setTAmount]               = useState("");
  const [tReason, setTReason]               = useState("");
  const [transferring, setTransferring]     = useState(false);
  const [tResult, setTResult]               = useState<{ ok: boolean; text: string } | null>(null);

  // Gerência staff
  const [staffDevs, setStaffDevs]           = useState<DevItem[]>([]);
  const [staffDevsLoaded, setStaffDevsLoaded] = useState(false);
  const [sMode, setSMode]                   = useState<"individual" | "group">("individual");
  const [sDevId, setSDevId]                 = useState<number | null>(null);
  const [sGroup, setSGroup]                 = useState("all");
  const [sAmount, setSAmount]               = useState("");
  const [sReason, setSReason]               = useState("");
  const [sending, setSending]               = useState(false);
  const [sResult, setSResult]               = useState<{ ok: boolean; text: string } | null>(null);

  const isStaff = devUser?.is_staff === true;

  // ── Fetch extrato ──
  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/api/dev/auth/points/statement`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { if (d.success) setStatement(d.statement || []); })
      .catch(console.error)
      .finally(() => setLoadingStatement(false));
  }, [devUser?.points]);

  // ── Carregar dados de transferência ──
  const loadTransferData = async () => {
    if (transferLoaded) return;
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/dev/auth/points/my-apps-testers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (json.success) { setTransferData(json); setTransferLoaded(true); }
  };

  // ── Carregar devs para staff ──
  const loadStaffDevs = async () => {
    if (staffDevsLoaded) return;
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/dev/auth/points/devs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (json.success) { setStaffDevs(json.data); setStaffDevsLoaded(true); }
  };

  // ── Transferir pontos ──
  const handleTransfer = async () => {
    if (!tAmount || !tReason.trim()) return;
    setTransferring(true);
    setTResult(null);
    try {
      const token = getToken();
      const body: Record<string, unknown> = { amount: parseInt(tAmount), reason: tReason.trim() };
      if (tMode === "individual" && tDevId) body.target_dev_id = tDevId;
      else if (tMode === "app" && tAppSlug) body.target_app_slug = tAppSlug;
      else { setTResult({ ok: false, text: "Selecione um destinatário." }); setTransferring(false); return; }

      const res = await fetch(`${API_BASE}/api/dev/auth/points/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTResult({ ok: true, text: json.message });
        setTAmount(""); setTReason(""); setTDevId(null); setTAppSlug("");
        await refreshDevUser();
      } else {
        setTResult({ ok: false, text: json.detail || json.message || "Erro ao transferir" });
      }
    } catch { setTResult({ ok: false, text: "Erro de conexão" }); }
    finally { setTransferring(false); }
  };

  // ── Enviar pontos (staff) ──
  const handleStaffSend = async () => {
    if (!sAmount || !sReason.trim()) return;
    setSending(true);
    setSResult(null);
    try {
      const token = getToken();
      const body: Record<string, unknown> = { amount: parseInt(sAmount), reason: sReason.trim() };
      if (sMode === "individual" && sDevId) body.target_dev_id = sDevId;
      else body.target_group = sGroup;

      const res = await fetch(`${API_BASE}/api/dev/auth/points/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSResult({ ok: true, text: json.message });
        setSAmount(""); setSReason(""); setSDevId(null);
        await refreshDevUser();
      } else {
        setSResult({ ok: false, text: json.detail || json.message || "Erro ao enviar" });
      }
    } catch { setSResult({ ok: false, text: "Erro de conexão" }); }
    finally { setSending(false); }
  };

  if (!devUser) return <div className="p-8 text-white">Carregando...</div>;

  const selectedApp = transferData?.my_apps?.find(a => a.slug === tAppSlug);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">

      {/* ── Header ── */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            UpzPoints
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Gerencie, transfira e acompanhe seus UpzPoints</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-400 font-mono">{formatPoints(devUser.points || 0)}</div>
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Seu saldo</div>
        </div>
      </div>

      {/* ── Transferir Pontos (todos) ── */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div
          className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-2 cursor-pointer hover:bg-slate-800/20 transition-colors"
          onClick={loadTransferData}
        >
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Transferir UpzPoints</h2>
        </div>

        <div className="p-5 space-y-4">
          {/* Modo */}
          <div className="flex gap-2">
            {(["individual", "app"] as const).map(m => (
              <button key={m}
                onClick={() => { setTMode(m); loadTransferData(); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  tMode === m ? "bg-indigo-600 border-indigo-500 text-white" : "bg-[#0A0E1A] border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                {m === "individual" ? "Dev Individual" : "Testers do meu App"}
              </button>
            ))}
          </div>

          {/* Seleção individual */}
          {tMode === "individual" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Selecionar Dev</label>
              <select
                value={tDevId ?? ""}
                onChange={e => setTDevId(Number(e.target.value) || null)}
                onClick={loadTransferData}
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="">— Selecione um dev —</option>
                {(transferData?.all_devs || []).map(d => (
                  <option key={d.id} value={d.id}>{d.name} · {d.level} · {d.points.toLocaleString()} UpzPoints</option>
                ))}
              </select>
            </div>
          )}

          {/* Seleção por app */}
          {tMode === "app" && (
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Selecionar App</label>
              {!transferData ? (
                <p className="text-xs text-slate-500 italic">Clique no título para carregar.</p>
              ) : (transferData.my_apps || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Você não possui apps cadastrados.</p>
              ) : (
                (transferData.my_apps || []).map(app => (
                  <button key={app.id} onClick={() => setTAppSlug(app.slug)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                      tAppSlug === app.slug
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                        : "bg-[#0A0E1A] border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {app.icon ? (
                        <img src={app.icon.startsWith("/") ? `${API_BASE}${app.icon}` : app.icon} alt={app.name} className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0">{app.name[0]}</div>
                      )}
                      <span className="text-sm font-bold truncate">{app.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{app.testers_count} tester{app.testers_count !== 1 ? "s" : ""}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Valor e motivo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Quantidade *</label>
              <input type="number" min="1" value={tAmount} onChange={e => setTAmount(e.target.value)} placeholder="Ex: 100"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Motivo *</label>
              <input type="text" value={tReason} onChange={e => setTReason(e.target.value)} placeholder="Ex: Obrigado pela contribuição"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
            </div>
          </div>

          {/* Prévia */}
          {tAmount && parseInt(tAmount) > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0A0E1A] border border-slate-800 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tMode === "individual"
                ? <span>Custo: <strong className="text-white">{parseInt(tAmount).toLocaleString()} UpzPoints</strong></span>
                : <span>Custo total: <strong className="text-white">{(parseInt(tAmount) * (selectedApp?.testers_count || 0)).toLocaleString()} UpzPoints</strong> ({parseInt(tAmount).toLocaleString()} × {selectedApp?.testers_count || 0} testers)</span>
              }
            </div>
          )}

          {tResult && (
            <div className={`px-4 py-3 rounded-xl text-sm font-bold border ${tResult.ok ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-rose-900/20 border-rose-500/30 text-rose-400"}`}>
              {tResult.text}
            </div>
          )}

          <button
            disabled={transferring || !tAmount || !tReason.trim() || (tMode === "individual" && !tDevId) || (tMode === "app" && !tAppSlug)}
            onClick={handleTransfer}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {transferring
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Transferindo...</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> Transferir UpzPoints</>
            }
          </button>
        </div>
      </div>

      {/* ── Gerência Staff (só UpzLab Team) ── */}
      {isStaff && (
        <div className="bg-[#131D33]/90 border border-emerald-500/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition-colors"
            onClick={loadStaffDevs}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Distribuição Staff</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">Saldo ilimitado</span>
          </div>

          <div className="p-5 space-y-4">
            {/* Modo */}
            <div className="flex gap-2">
              {(["individual", "group"] as const).map(m => (
                <button key={m}
                  onClick={() => { setSMode(m); loadStaffDevs(); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    sMode === m ? "bg-emerald-600 border-emerald-500 text-white" : "bg-[#0A0E1A] border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {m === "individual" ? "Dev Individual" : "Grupo"}
                </button>
              ))}
            </div>

            {sMode === "individual" ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Selecionar Dev</label>
                <select value={sDevId ?? ""} onChange={e => setSDevId(Number(e.target.value) || null)} onClick={loadStaffDevs}
                  className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
                  <option value="">— Selecione um dev —</option>
                  {staffDevs.map(d => (
                    <option key={d.id} value={d.id}>{d.name} · {d.level} · {d.points.toLocaleString()} UpzPoints</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Grupo</label>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_GROUPS.map(g => (
                    <button key={g.value} onClick={() => setSGroup(g.value)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        sGroup === g.value ? "bg-emerald-600 border-emerald-500 text-white" : "bg-[#0A0E1A] border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Quantidade *</label>
                <input type="number" min="1" value={sAmount} onChange={e => setSAmount(e.target.value)} placeholder="Ex: 500"
                  className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Motivo *</label>
                <input type="text" value={sReason} onChange={e => setSReason(e.target.value)} placeholder="Ex: Bônus de participação"
                  className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
              </div>
            </div>

            {sResult && (
              <div className={`px-4 py-3 rounded-xl text-sm font-bold border ${sResult.ok ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400" : "bg-rose-900/20 border-rose-500/30 text-rose-400"}`}>
                {sResult.text}
              </div>
            )}

            <button
              disabled={sending || !sAmount || !sReason.trim() || (sMode === "individual" && !sDevId)}
              onClick={handleStaffSend}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Distribuir UpzPoints</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Extrato ── */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Extrato de Transações</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {loadingStatement ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm animate-pulse">Carregando extrato...</div>
          ) : statement.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">Nenhuma transação ainda.</div>
          ) : (
            statement.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/20 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300 truncate">{entry.reason}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`shrink-0 ml-4 font-mono font-black text-sm ${entry.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString()} UpzPoints
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
