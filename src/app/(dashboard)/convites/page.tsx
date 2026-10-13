"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");

type Invite = {
  id: number;
  email: string;
  code: string;
  status: "pending" | "registered" | "joined";
  email_sent_at?: string | null;
  email_error?: string | null;
};

type InviteData = {
  referral_code: string;
  referrals: number;
  points_earned: number;
  invites: Invite[];
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return fallback;
}

function extractEmails(value: string): string[] {
  return [...new Set(value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [])];
}

export default function ConvitesPage() {
  const [data, setData] = useState<InviteData | null>(null);
  const [manualEmails, setManualEmails] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<number | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/dev/auth/invites`, {
        headers: authHeaders(),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível carregar sua lista."));
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar sua lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInvites();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadInvites]);

  const referralUrl = useMemo(
    () => data?.referral_code && typeof window !== "undefined"
      ? `${window.location.origin}/cadastro?ref=${encodeURIComponent(data.referral_code)}`
      : "",
    [data?.referral_code],
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");
    try {
      const emails = extractEmails(await file.text());
      if (!emails.length) throw new Error("Não encontrei endereços de e-mail nesse arquivo.");
      if (emails.length > 50) throw new Error("O arquivo contém mais de 50 endereços. Importe até 50 por envio.");
      setSelectedEmails(emails);
      setFileName(file.name);
      setNotice(`${emails.length} e-mail(s) encontrados no arquivo.`);
    } catch (cause) {
      setSelectedEmails([]);
      setFileName("");
      setError(cause instanceof Error ? cause.message : "Não foi possível ler o arquivo.");
    } finally {
      event.target.value = "";
    }
  };

  const handleInvite = async () => {
    const emails = [...new Set([...selectedEmails, ...extractEmails(manualEmails).map((email) => email.toLowerCase())])];
    if (!emails.length) {
      setError("Selecione um arquivo ou informe os e-mails que deseja convidar.");
      return;
    }
    if (emails.length > 50) {
      setError("Envie no máximo 50 e-mails por vez.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/dev/auth/invites/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ emails }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível criar os convites."));
      const sent = payload.created.filter((invite: { email_sent: boolean }) => invite.email_sent).length;
      const failed = payload.created.length - sent;
      const skipped = payload.skipped.length;
      setNotice(
        `${payload.created.length} convite(s) adicionado(s); ${sent} e-mail(s) enviado(s)` +
        (failed ? `; ${failed} envio(s) falharam — os links continuam disponíveis para compartilhar` : "") +
        (skipped ? `; ${skipped} endereço(s) ignorado(s)` : "") +
        ".",
      );
      setSelectedEmails([]);
      setManualEmails("");
      setFileName("");
      await loadInvites();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar os convites.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link. Selecione e copie manualmente.");
    }
  };

  const handleResend = async (inviteId: number) => {
    setBusyInviteId(inviteId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/dev/auth/invites/emails/${inviteId}/send`, {
        method: "POST",
        headers: authHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível reenviar o convite."));
      setNotice(payload.email_sent ? "Convite enviado por e-mail." : `E-mail não enviado: ${payload.email_error}`);
      await loadInvites();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível reenviar o convite.");
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleDelete = async (inviteId: number) => {
    setBusyInviteId(inviteId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/api/dev/auth/invites/emails/${inviteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível remover o convite."));
      setNotice("Convite removido da sua lista.");
      await loadInvites();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível remover o convite.");
    } finally {
      setBusyInviteId(null);
    }
  };

  const emailLink = (code: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/cadastro?invite=${encodeURIComponent(code)}` : "";

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Comunidade UpzLab</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Convide seus testers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Compartilhe seu link ou importe a lista de e-mails. Os convites ficam visíveis e gerenciáveis somente na sua conta.
          </p>
        </div>
        <Link href="/comunidade" className="text-sm text-slate-400 transition hover:text-white">Voltar à comunidade</Link>
      </header>

      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{notice}</p>}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#17191c] p-5">
          <p className="text-xs text-slate-500">Testers confirmados</p>
          <p className="mt-2 text-2xl font-semibold text-white">{data?.referrals ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#17191c] p-5">
          <p className="text-xs text-slate-500">UpzPoints ganhos</p>
          <p className="mt-2 text-2xl font-semibold text-white">{data?.points_earned ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#17191c] p-5">
          <p className="text-xs text-slate-500">Recompensa por tester confirmado</p>
          <p className="mt-2 text-2xl font-semibold text-white">50 <span className="text-sm font-normal text-slate-400">UpzPoints</span></p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#17191c] p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-white">Convide pelo seu link</h2>
        <p className="mt-1 text-sm text-slate-400">Qualquer tester que criar a conta por este link será associado a você.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={referralUrl || (loading ? "Carregando seu link..." : "")} aria-label="Seu link de convite" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#111315] px-3 py-2.5 font-mono text-xs text-slate-300 outline-none" />
          <button type="button" disabled={!referralUrl} onClick={() => void copyLink(referralUrl)} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#111315] transition hover:bg-white/90 disabled:opacity-50">
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#17191c] p-5 sm:p-7">
        <h2 className="text-lg font-semibold text-white">Importe seus e-mails</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Enviaremos um convite para cada endereço. Aceitamos CSV ou TXT com até 50 e-mails por envio. Também é possível digitar ou colar os endereços.
        </p>
        <label htmlFor="tester-email-file" className="mt-5 inline-flex cursor-pointer items-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.05]">
          Escolher arquivo CSV ou TXT
          <input id="tester-email-file" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => void handleFile(event)} className="sr-only" />
        </label>
        {fileName && <p className="mt-2 text-xs text-slate-500">{fileName} · {selectedEmails.length} endereço(s)</p>}
        <label htmlFor="tester-emails" className="mt-5 block text-xs font-medium text-slate-400">E-mails separados por vírgula, espaço ou linha</label>
        <textarea id="tester-emails" rows={4} value={manualEmails} onChange={(event) => setManualEmails(event.target.value)} placeholder="tester1@exemplo.com&#10;tester2@exemplo.com" className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#111315] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/30" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Limite de 100 convites enviados por dia.</p>
          <button type="button" disabled={saving || loading} onClick={() => void handleInvite()} className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#111315] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-50">
            {saving ? "Enviando convites..." : "Salvar lista e enviar convites"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#17191c] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Minha lista de testers</h2>
            <p className="mt-1 text-sm text-slate-400">Somente você pode ver e gerenciar estes endereços.</p>
          </div>
          <button type="button" onClick={() => void loadInvites()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]">Atualizar</button>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Carregando sua lista...</p>
        ) : data?.invites.length ? (
          <ul className="mt-5 divide-y divide-white/[0.07]">
            {data.invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{invite.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {invite.status === "joined" ? "Cadastro confirmado · +50 pontos" : invite.status === "registered" ? "Cadastro iniciado · aguardando confirmação" : invite.email_sent_at ? "Convite enviado por e-mail" : invite.email_error ? "E-mail não enviado" : "Convite pendente"}
                    {invite.email_error && <span className="ml-2 text-rose-300">{invite.email_error}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => void copyLink(emailLink(invite.code))} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]">Copiar link</button>
                  {invite.status === "pending" && invite.email_error && (
                    <button type="button" disabled={busyInviteId === invite.id} onClick={() => void handleResend(invite.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05] disabled:opacity-50">
                      Reenviar e-mail
                    </button>
                  )}
                  {invite.status === "pending" && (
                    <button type="button" disabled={busyInviteId === invite.id} onClick={() => void handleDelete(invite.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:border-rose-300/30 hover:text-rose-200 disabled:opacity-50">
                      Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Sua lista ainda está vazia. Compartilhe seu link ou importe os e-mails dos seus testers.</p>
        )}
      </section>
    </main>
  );
}
