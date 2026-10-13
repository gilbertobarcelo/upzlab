"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useComunidade } from "../../ComunidadeContext";
import { authHeaders } from "../../../lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

function VerifyEmail() {
  const router = useRouter();
  const params = useSearchParams();
  const { logout } = useComunidade();
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState("");
  const [error, setError] = useState(params.get("error") === "invalid_link" ? "Link inválido ou expirado. Envie um novo e-mail." : "");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/me`, { headers: authHeaders() });
      if (!res.ok) return;
      const json = await res.json();
      setEmail(json.data?.email || "");
      if (json.data?.email_verified) router.replace("/comunidade");
    } catch {}
  }, [router]);

  useEffect(() => {
    check();
    const id = setInterval(check, 4000);
    return () => clearInterval(id);
  }, [check]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setSending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/email/resend`, { method: "POST", headers: authHeaders() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || "Não foi possível reenviar.");
      if (json.verified) { router.replace("/comunidade"); return; }
      if (json.email_sent) setInfo("E-mail reenviado. Verifique sua caixa de entrada e o spam.");
      else setError("O serviço de e-mail ainda não está configurado. Avise a equipe UpzLab.");
      setCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao reenviar.");
    } finally {
      setSending(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/email/change`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || "Não foi possível alterar o e-mail.");
      setEmail(json.email);
      setEditing(false);
      setNewEmail("");
      setCooldown(60);
      if (json.email_sent) setInfo("E-mail atualizado. Enviamos um novo link de confirmação.");
      else setError("E-mail atualizado, mas o serviço de e-mail ainda não está configurado. Avise a equipe UpzLab.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar e-mail.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center px-5 py-12">
      <img src="/upzlab-wordmark-v6.svg" alt="UpzLab" width={124} height={48} className="mb-8 object-contain" />
      <h1 className="text-3xl font-semibold tracking-tight text-[#e7e9ec]">Confirme seu e-mail</h1>
      <p className="mt-4 text-sm leading-7 text-[#9ba1a9]">
        Enviamos um link de confirmação para <span className="text-white">{email || "seu e-mail"}</span>.
        Clique nele para ativar sua conta. Esta página avança sozinha assim que for confirmado.
      </p>
      {info && <p className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{info}</p>}
      {error && <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      <button
        onClick={resend}
        disabled={sending || cooldown > 0}
        className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldown > 0 ? `Reenviar em ${cooldown}s` : sending ? "Enviando..." : "Reenviar e-mail"}
      </button>
      <div className="mt-6 text-sm text-white/50">
        {editing ? (
          <form onSubmit={changeEmail} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              value={newEmail}
              onChange={ev => setNewEmail(ev.target.value)}
              placeholder="Novo e-mail"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white"
            />
            <div className="flex gap-3">
              <button type="submit" disabled={sending} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50">Salvar e reenviar</button>
              <button type="button" onClick={() => setEditing(false)} className="text-white/60 underline underline-offset-4">Cancelar</button>
            </div>
          </form>
        ) : (
          <>
            E-mail errado?{" "}
            <button onClick={() => { setEditing(true); setNewEmail(email); }} className="text-white/80 underline underline-offset-4">Alterar e-mail</button>
            {" · "}
            <button onClick={() => { logout(); }} className="underline underline-offset-4">Sair</button>
            {" · "}
            <Link href="/" className="underline underline-offset-4">Início</Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
