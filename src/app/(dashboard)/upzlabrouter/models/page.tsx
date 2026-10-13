"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/auth";

type FreeModel = {
  id: string;
  name: string;
  description: string;
  context_window: number | null;
  is_free: boolean;
  category: "text" | "reasoning" | "code" | "multimodal" | "audio" | "video" | string;
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const CATALOG_URL = `${API_ORIGIN}/api/upzlabrouter/dashboard/models`;

const categories = [
  { id: "all", label: "Todos" },
  { id: "text", label: "Texto" },
  { id: "reasoning", label: "Raciocínio" },
  { id: "code", label: "Código" },
  { id: "multimodal", label: "Multimodal" },
  { id: "audio", label: "Áudio" },
  { id: "video", label: "Vídeo" },
];

const categoryLabels: Record<string, string> = {
  text: "Texto",
  reasoning: "Raciocínio",
  code: "Código",
  multimodal: "Multimodal",
  audio: "Áudio",
  video: "Vídeo",
};

async function readError(response: Response): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
    return data.detail;
  }
  return `Falha ao consultar catálogo (${response.status}).`;
}

function formatContext(value: number | null): string {
  if (!value || value <= 0) return "Contexto não informado";
  return `${new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)} tokens`;
}

export default function UpzLabRouterModelsPage() {
  const [models, setModels] = useState<FreeModel[]>([]);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(CATALOG_URL, { headers: authHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response));
        const payload: unknown = await response.json();
        if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
          throw new Error("O catálogo retornou um formato inválido.");
        }
        const catalogCount = "catalog_count" in payload && typeof payload.catalog_count === "number"
          ? payload.catalog_count
          : null;
        return { models: payload.data as FreeModel[], catalogCount };
      })
      .then(({ models: data, catalogCount: count }) => {
        if (isMounted) {
          setModels(data.filter((model) => model.is_free));
          setCatalogCount(count);
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os modelos.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return models.filter((model) => {
      const matchesCategory = filter === "all" || model.category === filter;
      const matchesQuery = !normalizedQuery ||
        `${model.name} ${model.id} ${model.description}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [filter, models, query]);

  const copyModelId = async (modelId: string) => {
    try {
      await navigator.clipboard.writeText(modelId);
      setCopiedId(modelId);
      window.setTimeout(() => setCopiedId((current) => current === modelId ? null : current), 1500);
    } catch {
      setError("Não foi possível copiar o ID do modelo. Selecione o texto para copiar.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 space-y-6 pb-8 text-white">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200/60">UpzLabRouter / Novita</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Modelos gratuitos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Catálogo atualizado pela API da Novita. Só mostramos aqui modelos com preço de entrada e saída igual a zero.
          </p>
        </div>
        <span className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 font-mono text-xs text-emerald-200">
          {isLoading ? "Consultando..." : `${models.length} disponíveis`}
        </span>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-200">
          {error}
          <p className="mt-1 text-xs text-rose-100/65">Se o catálogo não estiver configurado, o administrador deve definir <code>NOVITA_API_KEY</code> em <code>backend/novita.env</code> e reiniciar o backend.</p>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filtrar por capacidade" className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={filter === category.id}
                onClick={() => setFilter(category.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  filter === category.id
                    ? "bg-white text-[#101719]"
                    : "border border-[#2a2e35] text-slate-400 hover:text-slate-100"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar modelo..."
            aria-label="Buscar modelo"
            className="w-full rounded-lg border border-[#2a2e35] bg-[#121212] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-white/40 lg:max-w-xs"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-[#20242b]" />)}
          </div>
        ) : filteredModels.length > 0 ? (
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {filteredModels.map((model) => (
              <article key={model.id} className="flex min-w-0 flex-col rounded-xl border border-[#2a2e35] bg-[#121212]/70 p-4 transition hover:border-white/20">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-semibold text-slate-100">{model.name}</h2>
                    <code className="mt-1 block break-all font-mono text-[10px] text-slate-300/65">{model.id}</code>
                  </div>
                  <span className="shrink-0 rounded-md bg-emerald-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                    Grátis
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">{model.description || "Descrição não informada pelo provedor."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="rounded-md bg-white/[0.04] px-2 py-1">{categoryLabels[model.category] ?? "Texto"}</span>
                  <span>{formatContext(model.context_window)}</span>
                  <span>Sem cobrança UpzPoints</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/upzlabrouter/playground?model=${encodeURIComponent(model.id)}`}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#101719] transition hover:bg-slate-200"
                  >
                    Testar modelo
                  </Link>
                  <button
                    type="button"
                    onClick={() => void copyModelId(model.id)}
                    className="rounded-lg border border-[#2a2e35] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
                  >
                    {copiedId === model.id ? "Copiado" : "Copiar ID"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#2a2e35] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-300">
              {filter === "audio" || filter === "video"
                ? `Catálogo de ${filter === "audio" ? "áudio" : "vídeo"} em integração`
                : models.length === 0 && catalogCount !== null && catalogCount > 0 && filter === "all" && !query.trim()
                  ? "A Novita não retornou modelos gratuitos"
                  : "Nenhum modelo encontrado"}
            </p>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500">
              {filter === "audio" || filter === "video"
                ? "Áudio e vídeo usam APIs próprias da Novita, separadas da API de chat. Vamos adicioná-las depois do catálogo inicial de modelos gratuitos de texto."
                : models.length === 0 && catalogCount !== null && catalogCount > 0 && filter === "all" && !query.trim()
                  ? `A API retornou ${catalogCount} modelos, mas nenhum está confirmado com preço zero na entrada e na saída. Modelos pagos continuam bloqueados até existir um sistema de pagamento.`
                : "Tente outra busca ou categoria. Modelos pagos não aparecem porque o pagamento ainda não está habilitado."}
            </p>
            {(filter === "audio" || filter === "video") && (
              <a
                href="https://docs.novita.ai/api-reference/model-apis-introduction"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-xs font-semibold text-slate-200 hover:text-slate-300"
              >
                Ver APIs multimodais da Novita <span className="ml-1" aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
