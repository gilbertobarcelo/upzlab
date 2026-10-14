"use client";

import { useEffect, useState } from "react";
import { authHeaders } from "@/lib/auth";

type Day = { date: string; requests: number; tokens: number; errors: number; latency_ms: number };
type Group = { name: string; requests: number; tokens: number };
type Usage = {
  days: number;
  totals: { requests: number; tokens: number; errors: number; success_rate: number | null; avg_latency_ms: number };
  series: Day[];
  models: Group[];
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const USAGE_API = `${API_ORIGIN}/api/upzlabrouter/dashboard/usage`;
const fmt = (n: number) => n.toLocaleString("pt-BR");

function BarChart({ data, value, label }: { data: Day[]; value: (d: Day) => number; label: string }) {
  const max = Math.max(1, ...data.map(value));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label={label}>
        {[10, 20, 30].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#2a2e35" strokeWidth="0.2" />)}
        {data.map((d, i) => {
          const h = (value(d) / max) * 38;
          return (
            <rect key={d.date} x={i * w + w * 0.15} y={40 - h} width={w * 0.7} height={h} fill="#8B5CF6" rx="0.4">
              <title>{`${d.date}: ${fmt(value(d))}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>{data[0]?.date.slice(5)}</span>
        <span>máx {fmt(max)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function Ranking({ items }: { items: Group[] }) {
  const max = Math.max(1, ...items.map((i) => i.requests));
  if (!items.length) return <p className="text-xs italic text-slate-500">Sem dados no período.</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.name} className="text-xs">
          <div className="flex justify-between gap-2 text-slate-300">
            <span className="truncate font-mono">{i.name}</span>
            <span className="shrink-0 text-slate-500">{fmt(i.requests)} req · {fmt(i.tokens)} tokens</span>
          </div>
          <div className="mt-1 h-1.5 rounded bg-slate-800">
            <div className="h-full rounded bg-violet-500" style={{ width: `${(i.requests / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UpzLabRouterUsagePage() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    fetch(`${USAGE_API}?days=${days}`, { headers: authHeaders(), cache: "no-store" })
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(typeof p.detail === "string" ? p.detail : "Não foi possível carregar o uso.");
        return p as Usage;
      })
      .then((p) => alive && setData(p))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : "Erro ao carregar o uso."));
    return () => { alive = false; };
  }, [days]);

  const cards = data ? [
    ["Requisições", fmt(data.totals.requests)],
    ["Tokens", fmt(data.totals.tokens)],
    ["Taxa de sucesso", data.totals.success_rate === null ? "—" : `${data.totals.success_rate}%`],
    ["Latência média", `${fmt(data.totals.avg_latency_ms)} ms`],
  ] : [];

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 space-y-6 pb-8 text-white">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200/60">UpzLabRouter / Uso</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Uso da API</h1>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${days === d ? "border-white bg-white text-black" : "border-[#2a2e35] text-slate-300 hover:border-white/30"}`}>
              {d} dias
            </button>
          ))}
        </div>
      </header>

      {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-500">Carregando...</p>}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
              </div>
            ))}
          </section>

          {data.totals.requests === 0 && (
            <p className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4 text-sm text-slate-400">
              Nenhuma chamada no período. Use o Playground ou sua chave de API para gerar dados.
            </p>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
              <h2 className="mb-3 text-sm font-semibold">Requisições por dia</h2>
              <BarChart data={data.series} value={(d) => d.requests} label="Requisições por dia" />
            </div>
            <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
              <h2 className="mb-3 text-sm font-semibold">Tokens por dia</h2>
              <BarChart data={data.series} value={(d) => d.tokens} label="Tokens por dia" />
            </div>
            <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
              <h2 className="mb-3 text-sm font-semibold">Erros por dia</h2>
              <BarChart data={data.series} value={(d) => d.errors} label="Erros por dia" />
            </div>
            <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
              <h2 className="mb-3 text-sm font-semibold">Latência média por dia (ms)</h2>
              <BarChart data={data.series} value={(d) => d.latency_ms} label="Latência média por dia" />
            </div>
            <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
              <h2 className="mb-3 text-sm font-semibold">Modelos mais usados</h2>
              <Ranking items={data.models} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
