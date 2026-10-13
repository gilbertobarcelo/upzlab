import Link from "next/link";
import UpzLabHeader from "@/components/UpzLabHeader";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "UpzLab Router — modelos de IA gratuitos por uma API",
  description: "Conheça os modelos gratuitos disponíveis no UpzLab Router. Compare capacidades e integre IA ao seu app por uma API unificada.",
  alternates: { canonical: "/upzlabrouter" },
};

type PublicModel = {
  id: string;
  name: string;
  description: string;
  context_window: number | null;
  category: string;
  is_free: true;
};

const API_ORIGIN = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8001"
).replace(/\/+$/, "");

const categoryLabels: Record<string, string> = {
  text: "Texto",
  reasoning: "Raciocínio",
  code: "Código",
  multimodal: "Multimodal",
  audio: "Áudio",
  video: "Vídeo",
};

const pageNavigation = [
  { href: "#inicio", label: "Visão geral" },
  { href: "#modelos", label: "Modelos gratuitos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#custos", label: "Custos e disponibilidade" },
];

async function getPublicModels(): Promise<{ models: PublicModel[]; error: string | null }> {
  try {
    const response = await fetch(`${API_ORIGIN}/api/upzlabrouter/public/models`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return {
        models: [],
        error: response.status === 503
          ? "O catálogo está temporariamente indisponível. Tente novamente mais tarde."
          : `Não foi possível carregar o catálogo de modelos (HTTP ${response.status}).`,
      };
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
      return { models: [], error: "O catálogo retornou uma resposta inválida." };
    }

    const models = payload.data.filter((model): model is PublicModel =>
      !!model &&
      typeof model === "object" &&
      "id" in model &&
      typeof model.id === "string" &&
      "name" in model &&
      typeof model.name === "string" &&
      "is_free" in model &&
      model.is_free === true
    );
    return { models, error: null };
  } catch (error) {
    console.error("Falha ao carregar modelos do UpzLab Router para a página pública:", error);
    return { models: [], error: "Não foi possível consultar o catálogo agora. Tente novamente mais tarde." };
  }
}

function formatContext(value: number | null): string {
  if (!value || value <= 0) return "Contexto não informado";
  return `${new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)} tokens`;
}

export default async function UpzLabRouterPublicPage() {
  const { models, error } = await getPublicModels();
  const visibleModels = models.slice(0, 24);
  const modelsByCategory = visibleModels.reduce<Record<string, PublicModel[]>>((groups, model) => {
    groups[model.category] ??= [];
    groups[model.category].push(model);
    return groups;
  }, {});
  const categories = Object.keys(modelsByCategory);

  return (
    <div className="min-h-screen bg-[#121416] text-[#e2e5e8] antialiased">
      <UpzLabHeader />
      <div className="px-5">
        <div className="mx-auto grid w-full max-w-7xl gap-8 pb-12 pt-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside aria-label="Navegação desta página" className="min-w-0">
          <nav className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible lg:rounded-xl lg:border lg:border-white/[0.08] lg:bg-[#17191b] lg:p-3">
            <p className="hidden px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35 lg:block">
              UpzLab Router
            </p>
            {pageNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-2 text-xs text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </a>
            ))}
            {categories.length > 0 && (
              <div className="hidden border-t border-white/[0.08] pt-2 lg:block">
                <p className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Categorias</p>
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`#categoria-${category}`}
                    className="block rounded-lg px-3 py-2 text-xs text-white/45 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    {categoryLabels[category] ?? category}
                  </a>
                ))}
              </div>
            )}
            <Link
              href="/login?next=%2Fupzlabrouter%2Fdashboard"
              className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white lg:block"
            >
              Acessar o painel →
            </Link>
          </nav>
          </aside>

          <main className="min-w-0 space-y-10">
          <section id="inicio" className="scroll-mt-20">
            <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#1b1d20] via-[#181a1c] to-[#141619] px-6 py-12 sm:px-10 sm:py-16">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-white/[0.035] blur-3xl" />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Infraestrutura de IA · UpzLab</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Modelos de IA gratuitos, <span className="text-white/55">conectados por uma API.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                O UpzLab Router facilita a descoberta e a integração de modelos de linguagem. Compare modelos gratuitos,
                teste prompts e conecte seu app por uma API unificada.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?next=%2Fupzlabrouter%2Fdashboard" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#101416] transition hover:bg-slate-200">
                  Acessar o Router
                </Link>
                <Link href="/login?next=%2Fupzlabrouter%2Fdocs" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.06] hover:text-white">
                  Ver integração
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/35">O painel, Playground e gerenciamento de chaves exigem login.</p>
            </div>
          </section>

          <section id="modelos" className="scroll-mt-20 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Catálogo Novita</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Modelos gratuitos disponíveis</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  A lista mostra somente modelos confirmados com preço zero tanto na entrada quanto na saída.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 px-3 py-2 font-mono text-xs text-white/55">
                {error ? "Catálogo indisponível" : `${models.length} modelos gratuitos`}
              </span>
            </div>

            {error ? (
              <div role="status" className="rounded-xl border border-white/10 bg-[#17191b] px-5 py-6 text-sm text-white/55">
                {error}
              </div>
            ) : models.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#17191b] px-5 py-6 text-sm text-white/55">
                Nenhum modelo gratuito está confirmado no catálogo neste momento.
              </div>
            ) : (
              <>
                {categories.map((category) => (
                  <section key={category} id={`categoria-${category}`} className="scroll-mt-24 space-y-3">
                    <h3 className="text-sm font-semibold text-white/70">{categoryLabels[category] ?? category}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {modelsByCategory[category].map((model) => (
                        <article
                          key={model.id}
                          className="min-w-0 rounded-xl border border-white/[0.09] bg-[#17191b] p-4 transition hover:border-white/20"
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="break-words text-sm font-semibold text-white/90">{model.name}</h4>
                              <code className="mt-1 block break-all font-mono text-[10px] text-white/40">{model.id}</code>
                            </div>
                            <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/55">
                              Gratuito
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/45">
                            {model.description || "Modelo de linguagem disponível pela API unificada do UpzLab Router."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/35">
                            <span className="rounded-md bg-white/[0.05] px-2 py-1">{categoryLabels[model.category] ?? "Texto"}</span>
                            <span className="py-1">{formatContext(model.context_window)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                {models.length > visibleModels.length && (
                  <p className="text-xs text-white/40">
                    Exibindo {visibleModels.length} de {models.length} modelos.{" "}
                    <Link href="/login?next=%2Fupzlabrouter%2Fmodels" className="text-white/75 underline underline-offset-4 hover:text-white">
                      Entre para explorar o catálogo completo.
                    </Link>
                  </p>
                )}
              </>
            )}
          </section>

          <section id="como-funciona" className="scroll-mt-20 space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Como funciona</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Da escolha do modelo à integração</h2>
            </div>
            <ol className="grid gap-3 md:grid-cols-3">
              {[
                ["01", "Escolha", "Compare os modelos gratuitos por categoria e contexto."],
                ["02", "Teste", "Use o Playground autenticado para validar seus prompts."],
                ["03", "Integre", "Crie uma chave privada e conecte seu backend à API."],
              ].map(([number, title, description]) => (
                <li key={number} className="rounded-xl border border-white/[0.08] bg-[#17191b] p-4">
                  <span className="font-mono text-xs text-white/35">{number}</span>
                  <h3 className="mt-3 text-sm font-semibold text-white/85">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/45">{description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="custos" className="scroll-mt-20 rounded-xl border border-white/[0.08] bg-[#17191b] p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">Custos e disponibilidade</p>
            <h2 className="mt-2 text-xl font-semibold">Sem modelos pagos nesta etapa</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              O Router só lista e executa modelos confirmados como gratuitos na Novita. Não há cobrança em UpzPoints.
              Modelos pagos permanecem bloqueados até existir um sistema de pagamento, e integrações próprias de áudio
              e vídeo ainda serão adicionadas.
            </p>
          </section>
          </main>
        </div>
      </div>
    </div>
  );
}
