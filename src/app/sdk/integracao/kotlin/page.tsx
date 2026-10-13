import type { Metadata } from "next";
import CodeSnippet from "../../code-snippet";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SDK Android nativo em Kotlin",
  description:
    "Guia para integrar o SDK nativo Kotlin da UpzLab, adicionar permissão de rede e registrar check-ins no ciclo de vida Android.",
  alternates: { canonical: "/sdk/integracao/kotlin" },
};

const applicationCode = `class UpzLabApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        UpzLabSdk(
            application = this,
            appId = "com.suaempresa.app",
            apiBaseUrl = "https://HOST_CONFIGURADO/api/upzlab",
            accessTokenProvider = {
                authRepository.getAccessToken()
            },
            appVersion = BuildConfig.VERSION_NAME,
        ).startTracking()
    }
}`;

const manifestCode = `<uses-permission android:name="android.permission.INTERNET" />

<application
    android:name=".UpzLabApplication"
    ...>
    ...
</application>`;

export default function KotlinGuidePage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Guia de plataforma · Android nativo
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        SDK nativo UpzLab para Kotlin
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        Para aplicativos Android feitos diretamente com Kotlin, esta implementação
        observa o ciclo de vida de Activities sem adicionar uma WebView ou framework
        JavaScript. O SDK usa APIs do Android e não requer dependências Gradle externas.
      </p>

      <section className="mt-8 space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">1. Gere o código para seu app</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Cadastre o app na UpzLab para que o Lab Studio gere o código com os dados
            existentes, incluindo Package ID, versão e endpoint. Os valores do exemplo
            são ilustrativos; use o código personalizado gerado para seu app. Salve o SDK Kotlin em{" "}
            <code className="font-mono text-slate-300">
              app/src/main/java/com/upzlab/sdk/UpzLabSdk.kt
            </code>
            . Ele declara o pacote <code className="font-mono text-slate-300">com.upzlab.sdk</code>.
          </p>
          <Link
            href="/cadastro?next=%2Fapps%2Fnovo"
            className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#111315] transition hover:bg-white/90"
          >
            Criar conta e gerar meu código
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="mb-4 text-sm font-semibold">2. Habilite acesso à internet</h2>
          <CodeSnippet code={manifestCode} label="app/src/main/AndroidManifest.xml" />
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="mb-4 text-sm font-semibold">3. Inicie no Application</h2>
          <CodeSnippet code={applicationCode} label="UpzLabApplication.kt" />
          <p className="mt-3 text-xs leading-6 text-slate-400">
            Registre a subclasse no atributo <code className="font-mono text-slate-300">android:name</code>{" "}
            do elemento <code className="font-mono text-slate-300">&lt;application&gt;</code>.
            Importe <code className="font-mono text-slate-300">com.upzlab.sdk.UpzLabSdk</code>.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">4. Forneça a sessão do desenvolvedor</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Troque <code className="font-mono text-slate-300">authRepository.getAccessToken()</code>{" "}
            pelo repositório real de sessão do seu app. O token deve ser válido no momento
            do envio. Não use tokens hardcoded ou credenciais administrativas. Configure
            o host HTTPS público da API no código gerado pelo Studio, incluindo o caminho
            completo <code className="font-mono text-slate-300">/api/upzlab</code>. O host
            depende da implantação da UpzLab.
          </p>
        </div>
      </section>

      <aside className="mt-6 rounded-xl border border-white/10 bg-[#151719] p-5">
        <h2 className="text-sm font-semibold">Java e outros frameworks nativos</h2>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          Java pode chamar código Kotlin compilado, mas ainda é necessário configurar
          corretamente as APIs e o ciclo de vida do app. Para React Native ou Capacitor,
          prefira o SDK TypeScript; não misture listeners nativos duplicados com o listener
          do framework.
        </p>
      </aside>
    </article>
  );
}
