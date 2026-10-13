"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api, timeAgo } from "@/lib/communityApi";

type Topic = {
  id: number; title: string; body: string; category: string; category_label: string;
  votes: number; reply_count: number; views: number; is_solved: boolean; is_closed: boolean; is_pinned: boolean;
  last_activity_at: string; author: { name: string; username?: string; avatar_url?: string };
};

const SORTS = [
  { key: "recent", label: "Recentes" },
  { key: "top", label: "Mais votados" },
  { key: "unanswered", label: "Sem resposta" },
];

export default function DiscussoesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "geral" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api("/forum/categories").then(setCats).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, sort });
      if (query) params.set("q", query);
      const data = await api(`/forum/topics?${params}`);
      setItems(data.items);
    } catch { setItems([]); }
    setLoading(false);
  }, [category, sort, query]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const t = await api("/forum/topics", { method: "POST", body: JSON.stringify(form) });
      router.push(`/discussoes/${t.id}`);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Fórum & Discussões</h1>
          <p className="text-sm font-mono text-slate-400 mt-1">Tire dúvidas, compartilhe conhecimento e ajude outros devs. Respostas aceitas rendem +20 UpzPoints.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition shrink-0">
          Novo tópico
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tópicos..." className={input} />
        <button className="px-4 rounded-xl bg-white text-black text-sm font-bold">Buscar</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {[{ key: "all", label: "Todos" }, ...cats].map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${category === c.key ? "bg-white text-black border-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-xs font-mono">
        {SORTS.map((s) => (
          <button key={s.key} onClick={() => setSort(s.key)} className={sort === s.key ? "text-white underline underline-offset-4" : "text-slate-500 hover:text-slate-300"}>{s.label}</button>
        ))}
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-slate-500 font-mono text-sm py-12">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <p className="text-white font-bold mb-1">Nenhum tópico encontrado</p>
            <p className="text-slate-400 text-sm font-mono">Seja o primeiro a iniciar uma conversa.</p>
          </div>
        ) : items.map((t) => (
          <Link key={t.id} href={`/discussoes/${t.id}`} className="flex gap-4 bg-[#131D33]/70 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition">
            <div className="flex flex-col items-center justify-center w-14 shrink-0 text-center">
              <span className="text-lg font-black text-white">{t.votes}</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">votos</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {t.is_pinned && <span className="text-[10px] font-bold text-amber-400">FIXADO</span>}
                {t.is_solved && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">RESOLVIDO</span>}
                {t.is_closed && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">FECHADO</span>}
                <h2 className="text-white font-bold truncate">{t.title}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.body}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{t.category_label}</span>
                <span className="flex items-center gap-1.5"><Avatar name={t.author.name} url={t.author.avatar_url} size={4} />{t.author.name}</span>
                <span>{t.reply_count} respostas</span><span>{t.views} views</span><span>{timeAgo(t.last_activity_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-[#131D33] border border-slate-700 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-black text-white">Novo tópico</h2>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>
              {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input required minLength={5} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título da dúvida ou assunto" className={input} />
            <textarea required minLength={10} rows={7} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Descreva com detalhes. Cole trechos de código se precisar." className={input} />
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white">Cancelar</button>
              <button disabled={saving} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{saving ? "Publicando..." : "Publicar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
