"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/communityApi";

function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video${u.pathname}`;
  } catch {}
  return null;
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const [err, setErr] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const [lesson, setLesson] = useState({ title: "", content: "", video_url: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try { setC(await api(`/courses/${id}`)); } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); } catch (e: any) { alert(e.message); }
  };
  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    await act(async () => { await api(`/courses/${id}/lessons`, { method: "POST", body: JSON.stringify({ ...lesson, video_url: lesson.video_url || null }) }); setLesson({ title: "", content: "", video_url: "" }); });
    setAdding(false);
  };

  if (err) return <p className="text-center text-slate-400 py-20">{err}</p>;
  if (!c) return <p className="text-center text-slate-500 font-mono py-20">Carregando...</p>;

  const canView = c.enrolled || c.is_owner;
  const current = c.lessons.find((l: any) => l.id === active) || (canView ? c.lessons[0] : null);
  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";
  const pct = c.lesson_count ? Math.round((c.completed_count / c.lesson_count) * 100) : 0;
  const embed = current?.video_url ? embedUrl(current.video_url) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/cursos" className="text-xs font-mono text-slate-400 hover:text-white">← Voltar aos cursos</Link>

      <div className="bg-[#131D33]/80 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{c.category_label}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{c.level_label}</span>
          {!c.is_published && <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">RASCUNHO</span>}
        </div>
        <h1 className="text-2xl font-black text-white break-words">{c.title}</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono"><Avatar name={c.author.name} url={c.author.avatar_url} size={6} /><span className="text-white font-bold">{c.author.name}</span><span>· {c.lesson_count} aulas · {c.enrolled_count} alunos</span></div>
        <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{c.description}</p>
        {!c.enrolled && !c.is_owner && c.is_published && (
          <button onClick={() => act(() => api(`/courses/${id}/enroll`, { method: "POST" }))} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold">Matricular-se grátis</button>
        )}
        {c.enrolled && (
          <div><div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-white" style={{ width: `${pct}%` }} /></div><p className="text-[11px] font-mono text-slate-400 mt-1">{c.completed_count}/{c.lesson_count} aulas concluídas ({pct}%)</p></div>
        )}
        {c.is_owner && (
          <div className="flex gap-4 pt-1 text-xs font-bold">
            <button onClick={() => act(() => api(`/courses/${id}/publish`, { method: "POST" }))} className="text-slate-300 hover:text-white">{c.is_published ? "Despublicar" : "Publicar curso"}</button>
            <button onClick={() => confirm("Excluir este curso, aulas e progresso dos alunos?") && api(`/courses/${id}`, { method: "DELETE" }).then(() => router.push("/cursos"))} className="text-rose-400 hover:text-rose-300">Excluir</button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 items-start">
        <div className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-3 space-y-1">
          <h2 className="text-white font-bold text-sm px-2 py-1">Aulas</h2>
          {c.lessons.length === 0 && <p className="text-xs text-slate-500 font-mono px-2 py-2">Nenhuma aula ainda.</p>}
          {c.lessons.map((l: any) => (
            <div key={l.id} className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${current?.id === l.id ? "bg-white/10" : ""}`}>
              {c.enrolled && <input type="checkbox" checked={l.done} onChange={() => act(() => api(`/courses/${id}/lessons/${l.id}/complete`, { method: "POST" }))} />}
              <button disabled={!canView} onClick={() => setActive(l.id)} className={`flex-1 text-left ${canView ? "text-slate-200 hover:text-white" : "text-slate-500"}`}>{l.position}. {l.title}</button>
              {c.is_owner && <button onClick={() => confirm("Excluir aula?") && act(() => api(`/courses/${id}/lessons/${l.id}`, { method: "DELETE" }))} className="text-rose-400 text-xs">✕</button>}
            </div>
          ))}
        </div>

        <div className="space-y-4 min-w-0">
          {current ? (
            <div className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-xl font-black text-white">{current.title}</h2>
              {embed ? <iframe src={embed} className="w-full aspect-video rounded-xl" allowFullScreen /> : current.video_url && <a href={current.video_url} target="_blank" rel="noopener noreferrer nofollow" className="text-white underline text-sm break-all">{current.video_url}</a>}
              {current.content && <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{current.content}</p>}
            </div>
          ) : (
            <div className="bg-[#0A0E1A] border border-slate-800 border-dashed rounded-2xl p-10 text-center text-slate-400 font-mono text-sm">Matricule-se para acessar o conteúdo das aulas.</div>
          )}

          {c.is_owner && (
            <form onSubmit={addLesson} className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-white font-bold">Adicionar aula</h2>
              <input required minLength={3} value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} placeholder="Título da aula" className={input} />
              <input type="url" value={lesson.video_url} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} placeholder="Link do vídeo (YouTube/Vimeo) — opcional" className={input} />
              <textarea rows={5} value={lesson.content} onChange={(e) => setLesson({ ...lesson, content: e.target.value })} placeholder="Conteúdo em texto — obrigatório se não houver vídeo" className={input} />
              <button disabled={adding} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{adding ? "Adicionando..." : "Adicionar aula"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
