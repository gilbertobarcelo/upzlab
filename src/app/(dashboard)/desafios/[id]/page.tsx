"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api, timeAgo } from "@/lib/communityApi";

export default function BountyPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<any>(null);
  const [err, setErr] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try { setB(await api(`/bounties/${id}`)); } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); } catch (e: any) { alert(e.message); }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await act(async () => { await api(`/bounties/${id}/submissions`, { method: "POST", body: JSON.stringify({ body, link: link || null }) }); setBody(""); setLink(""); });
    setSending(false);
  };

  if (err) return <p className="text-center text-slate-400 py-20">{err}</p>;
  if (!b) return <p className="text-center text-slate-500 font-mono py-20">Carregando...</p>;

  const canSubmit = b.status === "open" && !b.expired && !b.is_owner && !b.my_submission_id;
  const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/desafios" className="text-xs font-mono text-slate-400 hover:text-white">← Voltar aos desafios</Link>

      <div className="bg-[#131D33]/80 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{b.category_label}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{b.difficulty_label}</span>
              {b.status === "awarded" && <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">CONCLUÍDO</span>}
              {b.status === "cancelled" && <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">CANCELADO</span>}
              {b.expired && <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">PRAZO ENCERRADO</span>}
            </div>
            <h1 className="text-2xl font-black text-white break-words">{b.title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Avatar name={b.author.name} url={b.author.avatar_url} size={6} />
              <span className="text-white font-bold">{b.author.name}</span><span>· {timeAgo(b.created_at)}</span>
              {b.deadline && <span>· prazo {new Date(b.deadline).toLocaleString("pt-BR")}</span>}
            </div>
          </div>
          <div className="text-center shrink-0 rounded-xl bg-[#0A0E1A] border border-slate-800 px-4 py-2">
            <div className="text-2xl font-black text-white">{b.reward}</div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">UpzPoints</div>
          </div>
        </div>
        <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{b.description}</p>
        {b.is_owner && b.status === "open" && b.submission_count === 0 && (
          <button onClick={() => confirm("Cancelar o desafio e receber o reembolso?") && act(() => api(`/bounties/${id}/cancel`, { method: "POST" }))} className="text-xs font-bold text-rose-400 hover:text-rose-300">Cancelar e reembolsar</button>
        )}
      </div>

      {canSubmit && (
        <form onSubmit={send} className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold">Enviar solução</h2>
          <textarea required minLength={10} rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Explique sua solução, passos e evidências." className={input} />
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (repositório, vídeo, PR) — opcional" className={input} />
          <button disabled={sending} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{sending ? "Enviando..." : "Enviar solução"}</button>
        </form>
      )}

      <h2 className="text-white font-bold">
        {b.is_owner ? `${b.submissions.length} soluções recebidas` : `${b.submission_count} ${b.submission_count === 1 ? "solução enviada" : "soluções enviadas"}`}
      </h2>
      {!b.is_owner && b.submissions.length === 0 && <p className="text-slate-500 text-sm font-mono">As soluções ficam visíveis apenas para o autor do desafio.</p>}
      {b.submissions.map((s: any) => (
        <div key={s.id} className={`bg-[#131D33]/60 border rounded-2xl p-5 space-y-2 ${s.is_winner ? "border-emerald-500/50" : "border-slate-800"}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Avatar name={s.author.name} url={s.author.avatar_url} size={6} />
              <span className="text-white font-bold">{s.author.name}</span><span>· {timeAgo(s.created_at)}</span>
            </div>
            {s.is_winner && <span className="text-[10px] font-bold text-emerald-300">🏆 VENCEDOR</span>}
          </div>
          <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{s.body}</p>
          {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-white underline break-all">{s.link}</a>}
          {b.is_owner && b.status === "open" && (
            <div><button onClick={() => confirm(`Pagar ${b.reward} UpzPoints para ${s.author.name}?`) && act(() => api(`/bounties/${id}/award/${s.id}`, { method: "POST" }))} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-black">Escolher vencedor</button></div>
          )}
        </div>
      ))}
    </div>
  );
}
