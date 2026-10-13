"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/auth";

type FreeModel = { id: string; category: string };

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const DASHBOARD_API = `${API_ORIGIN}/api/upzlabrouter/dashboard`;

export default function UpzLabRouterDashboardPage() {
  const [modelCount, setModelCount] = useState<number | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`${DASHBOARD_API}/models`, { headers: authHeaders(), cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(typeof payload.detail === "string" ? payload.detail : "Não foi possível consultar o catálogo.");
        }
        if (!Array.isArray(payload.data)) throw new Error("A resposta do catálogo está em formato inválido.");
        return payload.data as FreeModel[];
      })
      .then((models) => {
        if (isMounted) setModelCount(models.length);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setSetupMessage(error instanceof Error ? error.message : "Não foi possível carregar o catálogo.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 space-y-7 pb-8 text-white">
      <header className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1a1d21] via-[#1a1d21] to-[#1a1d21] p-6 sm:p-9">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-200/70">AI Infrastructure · Novita</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">UpzLabRouter</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300/75">
              Explore modelos gratuitos, teste prompts e conecte suas aplicações por uma API compatível com OpenAI.
              Modelos pagos ficam desativados até existir uma forma de pagamento.
            </p>
          </div>
          <Link
            href="/upzlabrouter/models"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#101719] transition hover:bg-slate-200"
          >
            Explorar modelos <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-2">
          {["Texto", "Raciocínio", "Código", "Multimodal", "Áudio", "Vídeo"].map((category) => (
            <span key={category} className="rounded-lg border border-white/[0.08] bg-black/15 px-3 py-1.5 text-xs text-slate-300">
              {category}
            </span>
          ))}
        </div>
      </header>

      {setupMessage && (
        <div role="status" className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
          <p className="text-sm font-medium text-amber-100">Catálogo Novita indisponível</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/65">{setupMessage}</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/65">O administrador precisa configurar <code className="text-amber-100">NOVITA_API_KEY</code> em <code className="text-amber-100">backend/novita.env</code> e reiniciar o backend.</p>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/upzlabrouter/models" className="group rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 transition hover:border-white/25 hover:bg-[#20242b]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-300" aria-hidden="true">◇</span>
          <h2 className="mt-4 text-base font-semibold text-slate-100 group-hover:text-slate-300">Catálogo gratuito</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Filtre por texto, raciocínio, código e outras capacidades.</p>
          <p className="mt-4 font-mono text-xs text-slate-200">
            {modelCount === null ? "Consultar catálogo" : `${modelCount} modelos gratuitos`}
          </p>
        </Link>
        <Link href="/upzlabrouter/playground" className="group rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 transition hover:border-white/25 hover:bg-[#20242b]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-300" aria-hidden="true">⌘</span>
          <h2 className="mt-4 text-base font-semibold text-slate-100 group-hover:text-slate-300">Playground</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Escolha um modelo grátis e teste sem configurar seu projeto.</p>
          <p className="mt-4 font-mono text-xs text-slate-200">Testar um prompt →</p>
        </Link>
        <Link href="/upzlabrouter/api/keys" className="group rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 transition hover:border-white/25 hover:bg-[#20242b]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-slate-300" aria-hidden="true">⌑</span>
          <h2 className="mt-4 text-base font-semibold text-slate-100 group-hover:text-slate-300">Chaves de API</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Crie e revogue chaves privadas para suas integrações.</p>
          <p className="mt-4 font-mono text-xs text-slate-200">Gerenciar chaves →</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Comece em três passos</p>
            <h2 className="mt-1 text-lg font-semibold">Do modelo à sua aplicação</h2>
          </div>
          <Link href="/upzlabrouter/docs" className="text-xs font-semibold text-slate-200 hover:text-slate-300">Abrir guia de integração →</Link>
        </div>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Escolha um modelo", "Use o catálogo para comparar categorias e contexto."],
            ["02", "Teste gratuitamente", "Valide seu prompt no Playground antes de integrar."],
            ["03", "Conecte sua aplicação", "Crie uma UPZLAB_KEY e use a API compatível com OpenAI."],
          ].map(([number, title, description]) => (
            <li key={number} className="flex gap-3">
              <span className="font-mono text-xs text-slate-200/70">{number}</span>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
