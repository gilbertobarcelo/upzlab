import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SDK Android: integração e check-in",
  description:
    "Conheça o SDK UpzLab para testar aplicativos Android, acompanhar check-ins diários e escolher a integração para React Native, Capacitor ou Kotlin.",
  alternates: { canonical: "/sdk" },
};

const integrationOptions = [
  {
    title: "React Native",
    eyebrow: "TypeScript · app Android",
    description:
      "Integre o cliente TypeScript ao ciclo de vida do app com AppState. Serve para projetos React Native compilados para Android.",
    href: "/sdk/integracao/react-native",
  },
  {
    title: "React / Next.js + Capacitor",
    eyebrow: "Web empacotada como app",
    description:
      "Reutilize o cliente TypeScript em uma aplicação web compatível com exportação estática, empacotada para Android via Capacitor.",
    href: "/sdk/integracao/capacitor",
  },
  {
    title: "Android nativo · Kotlin",
    eyebrow: "Sem WebView",
    description:
      "Use a implementação Kotlin que observa o ciclo de vida Android sem depender de React Native ou de uma WebView.",
    href: "/sdk/integracao/kotlin",
  },
];

export default function SDKOverviewPage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Documentação pública · Android
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        SDK UpzLab para testes Android
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        O SDK conecta seu aplicativo Android à UpzLab para registrar check-ins de uso
        durante ciclos de teste. Escolha a tecnologia nesta documentação; depois,
        crie sua conta, cadastre o app e receba no Lab Studio o código de integração
        já preenchido com o Package ID do seu aplicativo.
      </p>
      <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
        Os exemplos públicos usam um host ilustrativo. O endereço real da API é definido
        pela implantação e aparece no código gerado pelo Lab Studio.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Como funciona">
        <div className="rounded-xl border border-white/10 bg-[#151719] p-4">
          <span className="font-mono text-[10px] text-slate-500">01</span>
          <h2 className="mt-2 text-sm font-semibold">Crie sua conta</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Cadastre-se como desenvolvedor ou entre na sua conta para continuar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/cadastro?next=%2Fapps%2Fnovo"
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
            >
              Criar conta
            </Link>
            <Link
              href="/login?next=%2Fapps%2Fnovo"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Fazer login
            </Link>
          </div>
        </div>
        {[
          ["02", "Cadastre o app", "Informe nome, Package ID e versão Android para vincular o projeto."],
          ["03", "Configure no Studio", "Escolha a tecnologia e baixe o código preenchido para seu app."],
        ].map(([number, title, description]) => (
          <div key={number} className="rounded-xl border border-white/10 bg-[#151719] p-4">
            <span className="font-mono text-[10px] text-slate-500">{number}</span>
            <h2 className="mt-2 text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
          </div>
        ))}
      </section>
      <p className="mt-3 rounded-xl border border-white/10 bg-[#151719] p-4 text-xs leading-6 text-slate-400">
        O check-in identifica o desenvolvedor pela sessão UpzLab ativa e o app pelo
        Package ID configurado. A conta que está testando precisa estar inscrita no
        app na comunidade. A recompensa diária continua limitada a uma por desenvolvedor.
      </p>

      <section className="mt-10" aria-labelledby="choose-integration">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="choose-integration" className="text-xl font-semibold tracking-tight">
              Escolha sua integração
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Uma implementação compartilhada para runtimes JavaScript; Kotlin para apps nativos.
            </p>
          </div>
          <Link
            href="/sdk/integracao"
            className="text-xs font-semibold text-slate-200 underline decoration-white/20 underline-offset-4 hover:decoration-white/60"
          >
            Ver início rápido →
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {integrationOptions.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="group rounded-xl border border-white/10 bg-[#151719] p-5 transition hover:border-white/25 hover:bg-white/[0.03]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                {option.eyebrow}
              </p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-slate-100">{option.title}</h3>
                <span className="text-sm text-slate-500 transition group-hover:translate-x-1 group-hover:text-white">→</span>
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">{option.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-white/10 bg-[#151719] p-5">
        <h2 className="text-sm font-semibold">O que o SDK registra</h2>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          O evento registra que o app de teste entrou em primeiro plano, separadamente
          por desenvolvedor, aplicativo e dia local. Novas aberturas no mesmo dia
          atualizam a última atividade, sem criar sessões independentes. Os pontos
          continuam sendo creditados no máximo uma vez por desenvolvedor por dia.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/cadastro?next=%2Fapps%2Fnovo"
          className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
        >
          Criar conta e configurar meu app
        </Link>
        <Link
          href="/login?next=%2Fapps%2Fnovo"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.04]"
        >
          Já tenho conta
        </Link>
      </div>
    </article>
  );
}
