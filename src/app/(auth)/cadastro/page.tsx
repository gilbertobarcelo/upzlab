"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useComunidade } from "../../ComunidadeContext";
import { requestedAuthDestination } from "../../../lib/auth-flow";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function ComunidadeCadastroPage() {
  const router = useRouter();
  const { login } = useComunidade();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("invite") || params.get("ref") || "";
  });
  const [invitationEmail, setInvitationEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    if (invite) {
      fetch(`${API_BASE}/api/dev/auth/invites/resolve?code=${encodeURIComponent(invite)}`)
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.detail || "Este convite não é válido.");
          setEmail(payload.email);
          setInvitationEmail(payload.email);
        })
        .catch((error: unknown) => setErrorMsg(error instanceof Error ? error.message : "Este convite não é válido."));
    }
  }, []);

  const handleLoginLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const next = requestedAuthDestination(window.location.search);
    router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/dev/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          ...(inviteCode ? { invite_code: inviteCode } : {}),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Não foi possível criar sua conta.");
      }

      const data = await res.json();
      if (typeof data.access_token !== "string") {
        throw new Error("A resposta do cadastro não contém um token válido.");
      }
      login(data.access_token);
      const next = requestedAuthDestination(window.location.search);
      router.replace(data.action === "verify_email" ? "/verificar-email" : `/completar-perfil?next=${encodeURIComponent(next)}`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubRegister = () => {
    window.location.href = `${API_BASE}/api/dev/auth/github/login?action=register`;
  };

  return (
    <main className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1fr_0.8fr] lg:px-8">
      <section className="hidden max-w-xl lg:block">
        <Link href="/" className="mb-16 inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-white/75">
          <img src="/favicon.svg" alt="" className="h-9 w-9 object-contain" />
          UPZLAB <span className="font-mono text-xs font-normal text-white/35">/ COMMUNITY</span>
        </Link>
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/50">Developer network</p>
        <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-[#e7e9ec]">
          Devs evoluem mais rápido quando constroem juntos.
        </h1>
        <p className="mt-6 max-w-lg text-base leading-8 text-[#9ba1a9]">
          Entre para uma comunidade de desenvolvedores que compartilha conhecimento, testa projetos reais e ajuda software a melhorar.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
          <p className="font-mono text-xs leading-6 text-white/45">[01] COMPARTILHE CONHECIMENTO</p>
          <p className="font-mono text-xs leading-6 text-white/45">[02] TESTE PROJETOS REAIS</p>
          <p className="font-mono text-xs leading-6 text-white/45">[03] CONTRIBUA COM FEEDBACK</p>
          <p className="font-mono text-xs leading-6 text-white/45">[04] EVOLUA EM COMUNIDADE</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
            <span className="font-mono text-sm font-semibold tracking-widest text-white/80">UPZLAB</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#17191c] p-7 shadow-2xl shadow-black/20 sm:p-9">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Faça parte da comunidade</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#e7e9ec]">Crie sua conta</h2>
          <p className="mt-2 text-sm leading-6 text-[#9ba1a9]">Comece com seus dados e monte seu perfil dev.</p>
          {invitationEmail && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-5 text-white/65">
              Este convite foi enviado para <strong className="text-white">{invitationEmail}</strong>. O e-mail precisa corresponder para validar o convite.
            </p>
          )}

          {errorMsg && (
            <div role="alert" className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/[0.08] p-3">
              <p className="font-mono text-xs text-rose-200">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 w-full space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-[#aeb4bc]">Nome completo</label>
              <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" className="w-full rounded-lg border border-white/10 bg-[#111315] px-4 py-3 text-sm text-[#e7e9ec] outline-none transition placeholder:text-white/25 focus:border-white/40 focus:ring-2 focus:ring-white/10" />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-[#aeb4bc]">E-mail</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="w-full rounded-lg border border-white/10 bg-[#111315] px-4 py-3 text-sm text-[#e7e9ec] outline-none transition placeholder:text-white/25 focus:border-white/40 focus:ring-2 focus:ring-white/10" />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-[#aeb4bc]">Senha</label>
              <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" className="w-full rounded-lg border border-white/10 bg-[#111315] px-4 py-3 text-sm text-[#e7e9ec] outline-none transition placeholder:text-white/25 focus:border-white/40 focus:ring-2 focus:ring-white/10" />
              <p className="mt-2 text-xs text-white/35">Use uma senha que você ainda não utiliza em outros serviços.</p>
            </div>

            <button type="submit" disabled={loading} className="mt-2 w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#111315] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60">
              {loading ? "Criando sua conta..." : "Criar conta"}
            </button>
          </form>

          <div className="my-6 flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/35">ou continue com</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button type="button" onClick={handleGitHubRegister} className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-[#d5d8dd] transition hover:border-white/20 hover:bg-white/[0.06]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
            </svg>
            Criar conta com GitHub
          </button>

          <p className="mt-7 text-center text-xs text-[#9ba1a9]">
            Já faz parte?{" "}
            <Link href="/login" onClick={handleLoginLink} className="font-semibold text-white hover:text-white/75">Entrar na conta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
