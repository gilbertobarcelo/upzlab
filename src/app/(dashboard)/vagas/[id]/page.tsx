"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api, timeAgo } from "@/lib/communityApi";

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [j, setJ] = useState<any>(null);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try { setJ(await api(`/jobs/${id}`)); } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); } catch (e: any) { alert(e.message); }
  };
  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await act(async () => { await api(`/jobs/${id}/apply`, { method: "POST", body: JSON.stringify({ message }) }); setMessage(""); });
    setSending(false);
  };

  if (err) return <p className="text-center text-slate-400 py-20">{err}</p>;
  if (!j) return <p className="text-center text-slate-500 font-mono py-20">Carregando...</p>;

  const Person = ({ a, date }: { a: any; date?: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
      <Avatar name={a.name} url={a.avatar_url} size={6} />
      {a.username ? <Link href={`/lab/${a.username}`} className="text-white font-bold hover:underline">{a.name}</Link> : <span className="text-white font-bold">{a.name}</span>}
      {date && <span>· {timeAgo(date)}</span>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/vagas" className="text-xs font-mono text-slate-400 hover:text-white">← Voltar às vagas</Link>
      <div className="bg-[#131D33]/80 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{j.job_type_label}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{j.level_label}</span>
          {j.is_remote && <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Remoto</span>}
          {j.status === "closed" && <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">ENCERRADA</span>}
        </div>
        <h1 className="text-2xl font-black text-white break-words">{j.title}</h1>
        <p className="text-slate-300">{j.company}{j.location ? ` · ${j.location}` : ""}{j.salary ? ` · ${j.salary}` : ""}</p>
        <Person a={j.author} date={j.created_at} />
        <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{j.description}</p>
        {j.tags.length > 0 && <div className="flex gap-2 flex-wrap">{j.tags.map((t: string) => <span key={t} className="px-2 py-0.5 rounded border border-slate-700 text-[11px] font-mono text-slate-300">{t}</span>)}</div>}
        {j.apply_url && j.status === "open" && (
          <a href={j.apply_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-block px-5 py-2 rounded-xl bg-white text-black text-sm font-bold">Candidatar-se no site da vaga</a>
        )}
        {j.is_owner && (
          <div className="flex gap-4 pt-2 text-xs font-bold">
            <button onClick={() => act(() => api(`/jobs/${id}/toggle`, { method: "POST" }))} className="text-slate-300 hover:text-white">{j.status === "open" ? "Encerrar vaga" : "Reabrir vaga"}</button>
            <button onClick={() => confirm("Excluir esta vaga e as candidaturas?") && api(`/jobs/${id}`, { method: "DELETE" }).then(() => router.push("/vagas"))} className="text-rose-400 hover:text-rose-300">Excluir</button>
          </div>
        )}
      </div>

      {!j.is_owner && j.status === "open" && (j.applied ? (
        <p className="text-emerald-300 text-sm font-mono">✓ Você já se candidatou a esta vaga.</p>
      ) : (
        <form onSubmit={apply} className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold">Candidatar-se pelo UpzLab</h2>
          <textarea required minLength={10} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Apresente-se e diga por que combina com a vaga. O autor verá seu perfil UpzLab." className="w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white" />
          <button disabled={sending} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{sending ? "Enviando..." : "Enviar candidatura"}</button>
        </form>
      ))}

      {j.is_owner && (
        <>
          <h2 className="text-white font-bold">{j.applications.length} candidaturas</h2>
          {j.applications.map((a: any) => (
            <div key={a.id} className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-2">
              <Person a={a.applicant} date={a.created_at} />
              <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{a.message}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
