"use client";

import { useState } from "react";
import Link from "next/link";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const API_BASE = `${API_ORIGIN}/api/upzlabrouter`;

export default function UpzLabRouterDocsPage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const curl = `curl ${API_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer SUA_UPZLAB_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Olá!"}]}'`;

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(curl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError("Não foi possível copiar o exemplo. Selecione o comando e copie manualmente.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 space-y-6 pb-8 text-white">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200/60">UpzLabRouter / Integração</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Conecte sua aplicação</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          O Router recebe requisições no formato de chat completions da OpenAI e encaminha aos modelos gratuitos disponíveis.
        </p>
      </header>

      <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 sm:p-6">
        <h2 className="text-base font-semibold">1. Crie uma chave</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Gere uma UPZLAB_KEY na página de chaves. O segredo é mostrado apenas uma vez; mantenha-o no servidor ou em um gerenciador de segredos.
        </p>
        <Link href="/upzlabrouter/api/keys" className="mt-3 inline-flex text-xs font-semibold text-slate-200 hover:text-slate-300">Gerenciar chaves →</Link>
      </section>

      <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 sm:p-6">
        <h2 className="text-base font-semibold">2. Escolha um modelo gratuito</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          No campo <code className="text-slate-200">model</code>, use <code className="text-slate-200">auto</code> para deixar o roteador escolher um modelo disponível ou informe o ID copiado do catálogo.
        </p>
        <Link href="/upzlabrouter/models" className="mt-3 inline-flex text-xs font-semibold text-slate-200 hover:text-slate-300">Abrir catálogo →</Link>
      </section>
      {copyError && <p role="alert" className="text-xs text-rose-200">{copyError}</p>}

      <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">3. Faça sua primeira chamada</h2>
            <p className="mt-1 text-xs text-slate-400">Exemplo em cURL. Substitua o placeholder da chave e do modelo.</p>
          </div>
          <button type="button" onClick={() => void copyExample()} className="shrink-0 rounded-lg border border-[#2a2e35] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/30 hover:text-white">
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre className="mt-4 max-w-full overflow-x-auto rounded-xl border border-[#2a2e35] bg-[#121212] p-4 font-mono text-[11px] leading-5 text-slate-300">
          <code>{curl}</code>
        </pre>
      </section>

    </main>
  );
}
