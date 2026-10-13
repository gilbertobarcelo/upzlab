import type { Metadata } from "next";
import CodeSnippet from "../../code-snippet";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SDK Android para React Native",
  description:
    "Instale o SDK TypeScript UpzLab em React Native e conecte o check-in ao AppState do Android.",
  alternates: { canonical: "/sdk/integracao/react-native" },
};

const example = `import { useEffect } from "react";
import { AppState } from "react-native";
import UpzLabSDK from "./upzlab-sdk";

export function useUpzLabCheckin() {
  useEffect(() => {
    const sdk = new UpzLabSDK({
      appId: "com.suaempresa.app",
      apiUrl: "https://HOST_CONFIGURADO/api/upzlab",
      getAccessToken: () => authRepository.getAccessToken(),
      platform: "android",
    });

    const trackOpen = () => {
      void sdk.trackOpen().catch((error: unknown) => {
        console.error("Não foi possível registrar a abertura no UpzLab.", error);
      });
    };

    if (AppState.currentState === "active") trackOpen();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") trackOpen();
    });
    return () => subscription.remove();
  }, []);
}`;

export default function ReactNativeGuidePage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Guia de plataforma · JavaScript / TypeScript
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Integrar o SDK no React Native para Android
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Use o mesmo cliente TypeScript oferecido para apps JavaScript. O React Native
        fornece o evento <code className="font-mono text-slate-300">AppState</code>,
        usado para registrar quando o aplicativo está ativo ou retorna do segundo plano.
      </p>

      <section className="mt-8 space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">1. Adicione o cliente</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Depois de cadastrar o app, obtenha no Lab Studio o código configurado com
            o Package ID correto. Inclua o cliente TypeScript no projeto; não é necessário
            importar APIs do navegador para enviar a requisição. Use como identificador
            o Package ID que aparece na configuração do Lab Studio.
          </p>
          <Link
            href="/cadastro?next=%2Fapps%2Fnovo"
            className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
          >
            Criar conta e gerar meu código
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">2. Conecte o AppState</h2>
          <p className="mb-4 mt-2 text-xs leading-6 text-slate-400">
            Monte o hook uma vez na raiz autenticada do app. A limpeza do listener ao
            desmontar evita inscrições duplicadas durante navegação e Fast Refresh.
          </p>
          <CodeSnippet code={example} label="useUpzLabCheckin.ts" />
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">3. Valide o registro</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Use a URL HTTPS completa da API, incluindo <code>/api/upzlab</code>, e o JWT atual do desenvolvedor. Faça login no
            app de teste, abra-o e consulte o resultado em{" "}
            <a className="underline underline-offset-4 hover:text-white" href="/sdk/monitoramento">
              Monitoramento
            </a>
            .
          </p>
        </div>
      </section>

      <aside className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-6 text-amber-100/75">
        Um projeto React para web, sem empacotamento como aplicativo Android, não
        oferece o ciclo de vida nativo do app. Para React/Next dentro de um app Android,
        consulte o guia Capacitor.
      </aside>
    </article>
  );
}
