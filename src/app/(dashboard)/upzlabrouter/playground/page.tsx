"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authHeaders } from "@/lib/auth";

type FreeModel = {
  id: string;
  name: string;
  category: string;
  is_free: boolean;
};

type PlaygroundMessage = { role: "user" | "assistant"; content: string };
type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { total_tokens?: number };
  model?: string;
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const DASHBOARD_API = `${API_ORIGIN}/api/upzlabrouter/dashboard`;

async function responseError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return `Falha ao executar a chamada (${response.status}).`;
}

export default function UpzLabRouterPlaygroundPage() {
  const [models, setModels] = useState<FreeModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`${DASHBOARD_API}/models`, { headers: authHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
          throw new Error("O catálogo retornou um formato inválido.");
        }
        return payload.data as FreeModel[];
      })
      .then((data) => {
        if (isMounted) {
          const freeModels = data.filter((model) => model.is_free);
          setModels(freeModels);
          setSelectedModel(freeModels[0]?.id ?? "");
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os modelos.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingModels(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || !selectedModel || isSending) return;

    const nextMessages: PlaygroundMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setPrompt("");
    setIsSending(true);
    setError(null);
    setTotalTokens(null);
    try {
      const requestMessages = [
        ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
        ...nextMessages,
      ];
      const response = await fetch(`${DASHBOARD_API}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ model: selectedModel, messages: requestMessages }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as ChatResponse;
      const answer = result.choices?.[0]?.message?.content;
      if (typeof answer !== "string") throw new Error("A Novita retornou uma resposta sem texto.");
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
      setTotalTokens(result.usage?.total_tokens ?? null);
    } catch (sendError) {
      setMessages(nextMessages);
      setError(sendError instanceof Error ? sendError.message : "Não foi possível consultar o modelo.");
    } finally {
      setIsSending(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    setTotalTokens(null);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl min-w-0 flex-col gap-5 pb-8 text-white">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200/60">UpzLabRouter / Teste</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Playground</h1>
          <p className="mt-2 text-sm text-slate-400">Experimente modelos gratuitos sem expor credenciais do provedor.</p>
        </div>
        <button
          type="button"
          onClick={clearConversation}
          disabled={messages.length === 0}
          className="rounded-lg border border-[#2a2e35] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Limpar conversa
        </button>
      </header>

      <section className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#2a2e35] bg-[#1a1d21]">
          <div aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {messages.length === 0 && !isSending ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-slate-300" aria-hidden="true">✳</span>
                <h2 className="mt-4 text-base font-semibold text-slate-100">Teste seu primeiro prompt</h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                  As chamadas do playground são limitadas aos modelos confirmados como gratuitos pela Novita.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`max-w-[90%] rounded-2xl px-4 py-3 ${message.role === "user" ? "ml-auto bg-white text-[#101719]" : "bg-[#20242b] text-slate-200"}`}>
                  <p className={`mb-1 text-[9px] font-bold uppercase tracking-wider ${message.role === "user" ? "text-[#475569]" : "text-slate-300/60"}`}>
                    {message.role === "user" ? "Você" : "Modelo"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                </article>
              ))
            )}
            {isSending && (
              <div className="max-w-[90%] rounded-2xl bg-[#20242b] px-4 py-3 text-xs text-slate-400" role="status">
                O modelo está respondendo...
              </div>
            )}
          </div>

          <div className="border-t border-[#2a2e35] p-3 sm:p-4">
            {error && <p role="alert" className="mb-3 rounded-lg bg-rose-300/[0.06] px-3 py-2 text-xs text-rose-200">{error}</p>}
            <form onSubmit={sendPrompt} className="flex items-end gap-2">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={3}
                maxLength={20_000}
                placeholder="Escreva uma mensagem... (Enter para enviar)"
                aria-label="Mensagem para o modelo"
                className="min-h-20 min-w-0 flex-1 resize-y rounded-xl border border-[#2a2e35] bg-[#121212] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/35"
              />
              <button
                type="submit"
                disabled={isLoadingModels || isSending || !selectedModel || !prompt.trim()}
                className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#101719] transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4">
            <label htmlFor="router-model" className="text-xs font-semibold text-slate-200">Modelo gratuito</label>
            <select
              id="router-model"
              value={selectedModel}
              onChange={(event) => {
                setSelectedModel(event.target.value);
                clearConversation();
              }}
              disabled={isLoadingModels || models.length === 0}
              className="mt-2 w-full min-w-0 rounded-xl border border-[#2a2e35] bg-[#121212] px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-white/35 disabled:opacity-50"
            >
              {isLoadingModels && <option value="">Carregando modelos...</option>}
              {!isLoadingModels && models.length === 0 && <option value="">Nenhum modelo gratuito disponível</option>}
              {models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.category}</option>)}
            </select>
            {!isLoadingModels && models.length === 0 && (
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Verifique se o catálogo Novita está configurado e se há modelos gratuitos disponíveis.</p>
            )}
          </section>

          <section className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4">
            <label htmlFor="system-prompt" className="text-xs font-semibold text-slate-200">Instrução do sistema</label>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">Opcional. Define como o modelo deve responder.</p>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Ex.: Responda sempre em português."
              className="mt-3 w-full resize-y rounded-xl border border-[#2a2e35] bg-[#121212] px-3 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-white/35"
            />
          </section>

          <section className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
            <p className="text-xs font-semibold text-emerald-100">Sem cobrança nesta fase</p>
            <p className="mt-1 text-[10px] leading-4 text-emerald-100/60">
              Apenas modelos com custo zero confirmado são executados. Não usamos UpzPoints para pagar modelos.
            </p>
            {totalTokens !== null && <p className="mt-2 font-mono text-[10px] text-emerald-100/70">Tokens nesta resposta: {totalTokens}</p>}
          </section>
        </aside>
      </section>
    </main>
  );
}
