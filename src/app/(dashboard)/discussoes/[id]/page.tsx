"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import { api, timeAgo } from "@/lib/communityApi";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [t, setT] = useState<any>(null);
  const [err, setErr] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try { setT(await api(`/forum/topics/${id}`)); } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<any>) => {
    try { await fn(); await load(); } catch (e: any) { alert(e.message); }
  };

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await act(async () => { await api(`/forum/topics/${id}/replies`, { method: "POST", body: JSON.stringify({ body }) }); setBody(""); });
    setSending(false);
  };

  if (err) return <p className="text-center text-slate-400 py-20">{err}</p>;
  if (!t) return <p className="text-center text-slate-500 font-mono py-20">Carregando...</p>;

  const Vote = ({ type, item }: { type: string; item: any }) => (
    <button onClick={() => act(() => api(`/forum/vote/${type}/${item.id}`, { method: "POST" }))}
      className={`flex flex-col items-center w-12 shrink-0 rounded-lg py-1 border ${item.voted ? "border-white text-white" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}>
      <span className="text-xs">▲</span><span className="text-sm font-black">{item.votes}</span>
    </button>
  );
  const Author = ({ a, date }: { a: any; date: string }) => (
    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
      <Avatar name={a.name} url={a.avatar_url} size={6} />
      {a.username ? <Link href={`/lab/${a.username}`} className="text-white font-bold hover:underline">{a.name}</Link> : <span className="text-white font-bold">{a.name}</span>}
      <span>· {timeAgo(date)}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/discussoes" className="text-xs font-mono text-slate-400 hover:text-white">← Voltar ao fórum</Link>

      <div className="bg-[#131D33]/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex gap-4">
          <Vote type="topic" item={t} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">{t.category_label}</span>
              {t.is_solved && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">RESOLVIDO</span>}
              {t.is_closed && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">FECHADO</span>}
            </div>
            <h1 className="text-2xl font-black text-white break-words">{t.title}</h1>
            <Author a={t.author} date={t.created_at} />
            <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{t.body}</p>
            {t.can_moderate && (
              <div className="flex gap-3 pt-2 text-xs font-bold">
                <button onClick={() => act(() => api(`/forum/topics/${id}/close`, { method: "POST" }))} className="text-slate-300 hover:text-white">{t.is_closed ? "Reabrir" : "Fechar"}</button>
                <button onClick={() => confirm("Excluir este tópico?") && api(`/forum/topics/${id}`, { method: "DELETE" }).then(() => router.push("/discussoes"))} className="text-rose-400 hover:text-rose-300">Excluir</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-white font-bold">{t.replies.length} {t.replies.length === 1 ? "resposta" : "respostas"}</h2>
      {t.replies.map((r: any) => (
        <div key={r.id} className={`bg-[#131D33]/60 border rounded-2xl p-5 flex gap-4 ${r.is_accepted ? "border-emerald-500/50" : "border-slate-800"}`}>
          <Vote type="reply" item={r} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Author a={r.author} date={r.created_at} />
              {r.is_accepted && <span className="text-[10px] font-bold text-emerald-300">✓ RESPOSTA ACEITA</span>}
            </div>
            <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{r.body}</p>
            {t.can_moderate && !r.is_accepted && (
              <button onClick={() => act(() => api(`/forum/replies/${r.id}/accept`, { method: "POST" }))} className="text-xs font-bold text-emerald-300 hover:text-emerald-200">Aceitar resposta</button>
            )}
          </div>
        </div>
      ))}

      {t.is_closed ? (
        <p className="text-center text-slate-500 text-sm font-mono">Este tópico está fechado para novas respostas.</p>
      ) : (
        <form onSubmit={reply} className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva sua resposta..." className="w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white" />
          <button disabled={sending} className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold disabled:opacity-50">{sending ? "Enviando..." : "Responder"}</button>
        </form>
      )}
    </div>
  );
}
