"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { useComunidade } from "@/app/ComunidadeContext";
import { api, timeAgo } from "@/lib/communityApi";

const STATUS = [
  { key: "open", label: "Abertos" },
  { key: "awarded", label: "Concluídos" },
  { key: "all", label: "Todos" },
];
const DIFF_COLOR: Record<string, string> = { facil: "text-emerald-300 bg-emerald-500/15", medio: "text-amber-300 bg-amber-500/15", dificil: "text-rose-300 bg-rose-500/15" };

export default function DesafiosPage() {
  const router = useRouter();
  const { devUser } = useComunidade();
  const [meta, setMeta] = useState<any>({ categories: [], difficulties: [], min_reward: 10, max_reward: 10000 });
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "bug", difficulty: "medio", reward: 100, deadline: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api("/bounties/meta").then(setMeta).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await api(`/bounties?status=${status}&category=${category}`)).items); } catch { setItems([]); }
    setLoading(false);
  }, [status, category]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const body = { ...form, reward: Number(form.reward), deadline: form.deadline ? new Date(form.deadline).toISOString() : null };
      const b = await api("/bounties", { method: "POST", body: JSON.stringify(body) });
      router.push(`/desafios/${b.id}`);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Desafios & Bounties</h1>
          <p className="text-sm font-mono text-slate-400 mt-1">Publique desafios pagos em UpzPoints ou resolva os da comunidade e ganhe a recompensa. O valor fica retido até você escolher o vencedor.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition shrink-0">Criar desafio</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS.map((s) => (
          <button key={s.key} onClick={() => setStatus(s.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${status === s.key ? "bg-white text-black border-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{s.label}</button>
        ))}
        <span className="w-px bg-slate-700 mx-1" />
        {[{ key: "all", label: "Todas categorias" }, ...meta.categories].map((c: any) => (
          <button key={c.key} onClick={() => setCategory(c.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${category === c.key ? "bg-white text-black border-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>{c.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-center text-slate-500 font-mono text-sm py-12">Carregando...</p>
          : items.length === 0 ? (
            <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-12 text-center">
              <p className="text-white font-bold mb-1">Nenhum desafio por aqui</p>
              <p className="text-slate-400 text-sm font-mono">Crie o primeiro e defina uma recompensa em UpzPoints.</p>
            </div>
          ) : items.map((b) => (
            <Link key={b.id} href={`/desafios/${b.id}`} className="flex gap-4 bg-[#131D33]/70 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition">
              <div className="flex flex-col items-center justify-center w-20 shrink-0 rounded-xl bg-[#0A0E1A] border border-slate-800">
                <span className="text-lg font-black text-white">{b.reward}</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">UpzPoints</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-bold truncate">{b.title}</h2>
                  {b.status === "awarded" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">CONCLUÍDO</span>}
                  {b.status === "cancelled" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">CANCELADO</span>}
                  {b.expired && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">PRAZO ENCERRADO</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{b.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{b.category_label}</span>
                  <span className={`px-2 py-0.5 rounded ${DIFF_COLOR[b.difficulty] || ""}`}>{b.difficulty_label}</span>
                  <span className="flex items-center gap-1.5"><Avatar name={b.author.name} url={b.author.avatar_url} size={4} />{b.author.name}</span>
                  <span>{b.submission_count} soluções</span>
                  {b.deadline && <span>prazo {new Date(b.deadline).toLocaleDateString("pt-BR")}</span>}
                  <span>{timeAgo(b.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-[#131D33] border border-slate-700 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-black text-white">Criar desafio</h2>
            <input required minLength={5} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do desafio" className={input} />
            <textarea required minLength={20} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o desafio, critérios de aceitação e como enviar a solução." className={input} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>{meta.categories.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={input}>{meta.difficulties.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              <label className="text-[11px] font-mono text-slate-400">Recompensa (UpzPoints){devUser ? ` · saldo ${devUser.points}` : ""}
                <input type="number" required min={meta.min_reward} max={meta.max_reward} value={form.reward} onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })} className={`${input} mt-1`} />
              </label>
              <label className="text-[11px] font-mono text-slate-400">Prazo (opcional)
                <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={`${input} mt-1`} />
              </label>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">O valor é descontado agora e devolvido se você cancelar antes de receber soluções.</p>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white">Cancelar</button>
              <button disabled={saving} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{saving ? "Publicando..." : "Publicar desafio"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
