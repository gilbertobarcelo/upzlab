import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Começar a integrar o SDK",
  description:
    "Guia inicial para instalar o SDK UpzLab no aplicativo Android, escolher TypeScript ou Kotlin e registrar o check-in diário.",
  alternates: { canonical: "/sdk/integracao" },
};

const steps = [
  {
    title: "Identifique como seu app Android foi construído",
    text: "React Native e aplicações web empacotadas em Capacitor podem usar o cliente TypeScript. Apps Android nativos sem WebView usam o SDK Kotlin.",
  },
  {
    title: "Gere a integração para o seu app",
    text: "No Lab Studio, escolha a tecnologia. A UpzLab gera o código com o Package ID cadastrado e orienta onde instalar o listener de primeiro plano.",
  },
  {
    title: "Forneça uma sessão UpzLab válida",
    text: "O app deve obter o JWT atualizado do desenvolvedor que está testando. Não grave token fixo no código nem envie credenciais administrativas.",
  },
  {
    title: "Teste e monitore",
    text: "Abra o app Android com a sessão válida e consulte a área de monitoramento da sua conta.",
  },
];

const options = [
  { label: "React Native", detail: "TypeScript + AppState", href: "/sdk/integracao/react-native" },
  { label: "React / Next.js + Capacitor", detail: "TypeScript + @capacitor/app", href: "/sdk/integracao/capacitor" },
  { label: "Android nativo Kotlin", detail: "Application.ActivityLifecycleCallbacks", href: "/sdk/integracao/kotlin" },
];

export default function IntegrationStartPage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Guia de instalação</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Comece a integrar o SDK Android
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Esta página explica o processo. Para obter o arquivo e o código personalizados,
        crie uma conta, cadastre seu app e abra a aba Integração SDK no Lab Studio.
      </p>

      <ol className="mt-8 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="grid gap-3 rounded-xl border border-white/10 bg-[#151719] p-5 sm:grid-cols-[44px_1fr]">
            <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="text-sm font-semibold">{step.title}</h2>
              <p className="mt-1 text-xs leading-6 text-slate-400">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-9" aria-labelledby="platform-guides">
        <h2 id="platform-guides" className="text-lg font-semibold">Guias por tecnologia</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-xl border border-white/10 bg-[#151719] p-4 transition hover:border-white/25"
            >
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="mt-2 block font-mono text-[10px] text-slate-500">{option.detail}</span>
              <span className="mt-4 block text-xs font-semibold text-slate-300">Abrir guia →</span>
            </Link>
          ))}
        </div>
      </section>

      <aside className="mt-8 rounded-xl border border-white/10 bg-[#151719] p-5">
        <h2 className="text-sm font-semibold">Limite atual do check-in</h2>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          O monitoramento registra atividade por desenvolvedor, app e dia, sem criar
          sessões independentes a cada abertura. Os pontos continuam limitados a uma
          recompensa diária por desenvolvedor.
        </p>
      </aside>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/cadastro?next=%2Fapps%2Fnovo"
          className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
        >
          Criar conta e configurar app
        </Link>
        <Link
          href="/login?next=%2Fapps%2Fnovo"
          className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-white/30"
        >
          Já tenho conta
        </Link>
      </div>
    </article>
  );
}
