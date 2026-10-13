"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api, timeAgo } from "@/lib/communityApi";

export default function VagasPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<any>({ types: [], levels: [] });
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState("all");
  const [remote, setRemote] = useState(false);
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", job_type: "clt", level: "pleno", location: "", is_remote: true, salary: "", description: "", tags: "", apply_url: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api("/jobs/meta").then(setMeta).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ job_type: jobType });
      if (query) p.set("q", query);
      if (remote) p.set("remote", "true");
      if (mine) p.set("mine", "true");
      setItems((await api(`/jobs?${p}`)).items);
    } catch { setItems([]); }
    setLoading(false);
  }, [jobType, query, remote, mine]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const j = await api("/jobs", { method: "POST", body: JSON.stringify({ ...form, apply_url: form.apply_url || null }) });
      router.push(`/vagas/${j.id}`);
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-xs font-bold border transition ${on ? "bg-white text-black border-white" : "border-slate-700 text-slate-300 hover:border-slate-500"}`;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Vagas & Networking</h1>
          <p className="text-sm font-mono text-slate-400 mt-1">Encontre oportunidades publicadas pela comunidade ou divulgue a sua vaga. Candidaturas levam seu perfil UpzLab.</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition shrink-0">Publicar vaga</button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cargo, empresa, tecnologia ou cidade..." className={input} />
        <button className="px-4 rounded-xl bg-white text-black text-sm font-bold">Buscar</button>
      </form>
      <div className="flex flex-wrap gap-2">
        {[{ key: "all", label: "Todos" }, ...meta.types].map((t: any) => <button key={t.key} onClick={() => setJobType(t.key)} className={chip(jobType === t.key)}>{t.label}</button>)}
        <span className="w-px bg-slate-700 mx-1" />
        <button onClick={() => setRemote(!remote)} className={chip(remote)}>Remoto</button>
        <button onClick={() => setMine(!mine)} className={chip(mine)}>Minhas vagas</button>
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-center text-slate-500 font-mono text-sm py-12">Carregando...</p>
          : items.length === 0 ? (
            <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-12 text-center">
              <p className="text-white font-bold mb-1">Nenhuma vaga encontrada</p>
              <p className="text-slate-400 text-sm font-mono">Publique a primeira oportunidade da comunidade.</p>
            </div>
          ) : items.map((j) => (
            <Link key={j.id} href={`/vagas/${j.id}`} className="block bg-[#131D33]/70 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-bold">{j.title}</h2>
                {j.status === "closed" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">ENCERRADA</span>}
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{j.company}{j.location ? ` · ${j.location}` : ""}{j.is_remote ? " · Remoto" : ""}{j.salary ? ` · ${j.salary}` : ""}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-500 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{j.job_type_label}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{j.level_label}</span>
                {j.tags.slice(0, 5).map((t: string) => <span key={t} className="px-2 py-0.5 rounded border border-slate-700">{t}</span>)}
                <span className="flex items-center gap-1.5 ml-auto"><Avatar name={j.author.name} url={j.author.avatar_url} size={4} />{j.author.name} · {timeAgo(j.created_at)}</span>
              </div>
            </Link>
          ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-[#131D33] border border-slate-700 rounded-2xl p-6 space-y-3 my-8">
            <h2 className="text-lg font-black text-white">Publicar vaga</h2>
            <input required minLength={5} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cargo (ex.: Dev Android Pleno)" className={input} />
            <input required minLength={2} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Empresa" className={input} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className={input}>{meta.types.map((t: any) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={input}>{meta.levels.map((t: any) => <option key={t.key} value={t.key}>{t.label}</option>)}</select>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Cidade/UF (opcional)" className={input} />
              <input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="Faixa salarial (opcional)" className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.is_remote} onChange={(e) => setForm({ ...form, is_remote: e.target.checked })} />Aceita trabalho remoto</label>
            <textarea required minLength={30} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Responsabilidades, requisitos e benefícios." className={input} />
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags separadas por vírgula (kotlin, android, firebase)" className={input} />
            <input type="url" value={form.apply_url} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} placeholder="Link externo de candidatura (opcional)" className={input} />
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
