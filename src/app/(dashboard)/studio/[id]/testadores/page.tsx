"use client";
import React, { useEffect, useState } from "react";
import { TestersTable } from "../components/TestersTable";
import { authHeaders } from "@/lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");

export default function TestadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  
  const [testers, setTesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const appLink = typeof window !== "undefined" ? `${window.location.origin}/apps/${id}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg({ ok: false, text: "Não foi possível copiar. Selecione o link e copie manualmente." });
    }
  };

  const sendInvites = async () => {
    const list = Array.from(new Set(emails.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean)));
    if (!list.length) {
      setMsg({ ok: false, text: "Informe pelo menos um e-mail." });
      return;
    }
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/invites/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ emails: list }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Não foi possível enviar os convites.");
      const sent = data.created.filter((c: { email_sent: boolean }) => c.email_sent).length;
      const skipped = data.skipped.length;
      setMsg({
        ok: true,
        text: `${data.created.length} convite(s) criado(s), ${sent} e-mail(s) enviado(s)` +
          (skipped ? `; ${skipped} ignorado(s) (já têm conta: envie o link do app para eles)` : "") + ".",
      });
      setEmails("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Não foi possível enviar os convites." });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetch(`http://localhost:8001/api/upzlab/campaigns/app/${id}/dashboard`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTesters(json.data.recent_testers || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-slate-400 font-mono p-6">Carregando lista de testadores...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="bg-[#131D33]/60 p-6 rounded-2xl border border-slate-800/80 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Membros e Testadores Ativos</h2>
          <p className="text-xs text-slate-400 font-mono">Gerencie quem tem acesso ao seu aplicativo.</p>
        </div>
        <button
          onClick={() => { setOpen(true); setMsg(null); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs uppercase transition-colors"
        >
          Convidar
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-[#131D33] border border-slate-700 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white mb-4">Convidar testadores</h3>

            <label className="block text-xs text-slate-400 font-mono mb-1">Link do app (para quem já tem conta)</label>
            <div className="flex gap-2 mb-5">
              <input readOnly value={appLink} className="flex-1 bg-[#0B1220] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono" />
              <button onClick={copyLink} className="px-4 py-2 bg-white text-black font-bold rounded-lg text-xs">
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>

            <label className="block text-xs text-slate-400 font-mono mb-1">Convite por e-mail (para quem ainda não tem conta)</label>
            <textarea
              value={emails}
              onChange={e => setEmails(e.target.value)}
              rows={4}
              placeholder="um@email.com, outro@email.com"
              className="w-full bg-[#0B1220] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono mb-3"
            />

            {msg && <p className={`text-xs mb-3 ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 border border-slate-600 text-slate-200 rounded-lg text-xs">Fechar</button>
              <button onClick={sendInvites} disabled={sending} className="px-4 py-2 bg-white text-black font-bold rounded-lg text-xs disabled:opacity-50">
                {sending ? "Enviando..." : "Enviar convites"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <TestersTable testers={testers} />
    </div>
  );
}
