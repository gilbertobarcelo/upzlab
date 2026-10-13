"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/communityApi";

export default function CursosPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<any>({ categories: [], levels: [] });
  const [scope, setScope] = useState("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "qa", level: "iniciante" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api("/courses/meta").then(setMeta).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ scope, category });
      if (query) p.set("q", query);
      setItems((await api(`/courses?${p}`)).items);
    } catch { setItems([]); }
    setLoading(false);
  }, [scope, category, query]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const c = await api("/courses", { method: "POST", body: JSON.stringify(form) });
      router.push(`/cursos/${c.id}`);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-bold border transition ${on ? "bg-white text-black border-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Cursos & Masterclass</h1>
          <p className="text-sm font-mono text-slate-400 mt-1">Aprenda com a comunidade ou ensine o que você sabe. Matricule-se e acompanhe seu progresso aula a aula.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition shrink-0">Criar curso</button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cursos..." className={input} />
        <button className="px-4 rounded-xl bg-white text-black text-sm font-bold">Buscar</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {[["all", "Todos"], ["enrolled", "Meus estudos"], ["mine", "Criados por mim"]].map(([k, l]) => <button key={k} onClick={() => setScope(k)} className={chip(scope === k)}>{l}</button>)}
        <span className="w-px bg-slate-700 mx-1" />
        {[{ key: "all", label: "Todas categorias" }, ...meta.categories].map((c: any) => <button key={c.key} onClick={() => setCategory(c.key)} className={chip(category === c.key)}>{c.label}</button>)}
      </div>

      {loading ? <p className="text-center text-slate-500 font-mono text-sm py-12">Carregando...</p>
        : items.length === 0 ? (
          <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-12 text-center">
            <p className="text-white font-bold mb-1">Nenhum curso por aqui</p>
            <p className="text-slate-400 text-sm font-mono">Crie o primeiro curso da comunidade.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((c) => (
              <Link key={c.id} href={`/cursos/${c.id}`} className="flex flex-col bg-[#131D33]/70 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition">
                <div className="flex gap-2 text-[11px] font-mono mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{c.category_label}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{c.level_label}</span>
                  {!c.is_published && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">RASCUNHO</span>}
                </div>
                <h2 className="text-lg font-bold text-white">{c.title}</h2>
                <p className="text-sm text-slate-400 mt-1 line-clamp-3 flex-1">{c.description}</p>
                <div className="flex items-center justify-between mt-4 text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1.5"><Avatar name={c.author.name} url={c.author.avatar_url} size={4} />{c.author.name}</span>
                  <span>{c.lesson_count} aulas · {c.enrolled_count} alunos</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-[#131D33] border border-slate-700 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-black text-white">Criar curso</h2>
            <input required minLength={5} maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do curso" className={input} />
            <textarea required minLength={20} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que o aluno vai aprender?" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={input}>{meta.categories.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={input}>{meta.levels.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">O curso começa como rascunho. Adicione as aulas e publique quando estiver pronto.</p>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white">Cancelar</button>
              <button disabled={saving} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{saving ? "Criando..." : "Criar curso"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
