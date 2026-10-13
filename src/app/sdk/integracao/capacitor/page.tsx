import type { Metadata } from "next";
import CodeSnippet from "../../code-snippet";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SDK Android React e Next.js com Capacitor",
  description:
    "Empacote uma aplicação React ou Next.js estática como app Android via Capacitor e conecte o SDK UpzLab ao ciclo de vida nativo.",
  alternates: { canonical: "/sdk/integracao/capacitor" },
};

const example = `import { useEffect } from "react";
import { App } from "@capacitor/app";
import UpzLabSDK from "./upzlab-sdk";

export function useUpzLabCheckin() {
  useEffect(() => {
    const sdk = new UpzLabSDK({
      appId: "com.suaempresa.app",
      apiUrl: "https://HOST_CONFIGURADO/api/upzlab",
      getAccessToken: () => authRepository.getAccessToken(),
      platform: "android",
    });
    let isMounted = true;
    let removeListener: (() => Promise<void>) | undefined;

    const trackOpen = () => {
      void sdk.trackOpen().catch((error: unknown) => {
        console.error("Não foi possível registrar a abertura no UpzLab.", error);
      });
    };

    trackOpen();
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) trackOpen();
    }).then((listener) => {
      if (isMounted) removeListener = () => listener.remove();
      else void listener.remove();
    }).catch((error: unknown) => {
      console.error("Não foi possível iniciar o listener Capacitor.", error);
    });

    return () => {
      isMounted = false;
      void removeListener?.();
    };
  }, []);
}`;

export default function CapacitorGuidePage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Guia de plataforma · Web empacotada
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        React ou Next.js em Android com Capacitor
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Se seu app Android é uma interface web executada dentro do Capacitor, reutilize
        o cliente TypeScript e o plugin de ciclo de vida Capacitor. Um site comum aberto
        no navegador não é uma instalação Android nem pode observar as transições do
        aplicativo nativo.
      </p>

      <section className="mt-8 space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">1. Pré-requisitos</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-5 text-slate-400">
            <li>Uma aplicação React/Next compatível com exportação estática.</li>
            <li>Capacitor configurado e projeto Android sincronizado.</li>
            <li>Plugin <code className="font-mono text-slate-300">@capacitor/app</code> instalado no mesmo major da plataforma Capacitor.</li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-amber-100/70">
            Recursos server-side do Next.js não são empacotados em uma exportação estática.
            Se o app depende de SSR/API routes do Next, use uma arquitetura compatível ou
            considere React Native/Kotlin.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">2. Instale o listener de foreground</h2>
          <p className="mb-4 mt-2 text-xs leading-6 text-slate-400">
            Gere o código personalizado no Lab Studio depois de cadastrar o app. Monte o
            hook uma vez na área autenticada. Substitua o identificador de exemplo pelo
            Package ID do Lab Studio. O hook registra a abertura inicial e novas
            transições para ativo, removendo o listener ao desmontar.
          </p>
          <CodeSnippet code={example} label="useUpzLabCheckin.ts" />
          <Link
            href="/cadastro?next=%2Fapps%2Fnovo"
            className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
          >
            Criar conta e gerar meu código
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">3. Configure rede e autenticação</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            O SDK requer a URL HTTPS pública e o JWT atual de uma sessão UpzLab ativa. Para
            chamadas de uma WebView, configure a origem real do Capacitor em{" "}
            <code className="font-mono text-slate-300">UPZLAB_ALLOWED_ORIGINS</code>.
            Origens padrão <code className="font-mono text-slate-300">http://localhost</code>{" "}
            e <code className="font-mono text-slate-300">https://localhost</code> já são aceitas.
          </p>
        </div>
      </section>
    </article>
  );
}
