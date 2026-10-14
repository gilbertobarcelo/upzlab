"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CodeSnippet from "@/app/sdk/code-snippet";
import { authHeaders } from "@/lib/auth";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const API_BASE = API_ORIGIN.endsWith("/api/upzlab") ? API_ORIGIN : `${API_ORIGIN}/api/upzlab`;
// Endpoint embutido no código do SDK: sempre o domínio público, nunca localhost.
const SDK_ENDPOINT = "https://upzlab.com/api/upzlab";

type AppConfiguration = {
  id: number;
  name: string;
  package_id: string | null;
  app_id: string | null;
  version: string | null;
};

type Platform = "kotlin" | "react-native" | "capacitor";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "kotlin", label: "Android nativo · Kotlin" },
  { id: "react-native", label: "React Native" },
  { id: "capacitor", label: "React / Next + Capacitor" },
];

export default function SDKConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [app, setApp] = useState<AppConfiguration | null>(null);
  const [platform, setPlatform] = useState<Platform>("kotlin");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pkgInput, setPkgInput] = useState("");
  const [savingPkg, setSavingPkg] = useState(false);

  const savePackageId = async () => {
    if (!app) return;
    setSavingPkg(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("packageId", pkgInput.trim());
      const response = await fetch(`${API_BASE}/campaigns/app/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: authHeaders(),
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.detail === "string" ? result.detail : "Não foi possível salvar o Package ID.");
      setApp({ ...app, package_id: pkgInput.trim() });
      setNotice("Package ID salvo.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar o Package ID.");
    } finally {
      setSavingPkg(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/sdk/apps/${encodeURIComponent(id)}/configuration`, {
      headers: authHeaders(),
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Não foi possível carregar o app.");
        return result.data as AppConfiguration;
      })
      .then((data) => {
        if (!active) return;
        setApp(data);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Falha ao carregar o app.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const code = useMemo(() => {
    if (!app?.package_id) return "";
    const appId = JSON.stringify(app.package_id);
    const apiBaseUrl = JSON.stringify(SDK_ENDPOINT);
    const appNameComment = app.name.replace(/[\r\n\u2028\u2029]/g, " ");
    const appVersion = JSON.stringify(app.version || "");

    if (platform === "kotlin") {
      return `// UpzLab app: ${appNameComment}
class UpzLabApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        UpzLabSdk(
            application = this,
            appId = ${appId},
            apiBaseUrl = ${apiBaseUrl},
            accessTokenProvider = {
                authRepository.getAccessToken()
            },
            appVersion = ${appVersion},
        ).startTracking()
    }
}`;
    }

    const frameworkImport = platform === "react-native"
      ? 'import { AppState } from "react-native";'
      : 'import { App } from "@capacitor/app";';
    const listenerCode = platform === "react-native"
      ? `if (AppState.currentState === "active") trackOpen();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") trackOpen();
    });
    return () => subscription.remove();`
      : `trackOpen();
    let isMounted = true;
    let removeListener: (() => Promise<void>) | undefined;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) trackOpen();
    }).then((listener) => {
      if (isMounted) removeListener = () => listener.remove();
      else void listener.remove().catch((error: unknown) => {
        console.error("Não foi possível remover o listener Capacitor.", error);
      });
    }).catch((error: unknown) => {
      console.error("Não foi possível iniciar o listener Capacitor.", error);
    });
    return () => {
      isMounted = false;
      void removeListener?.().catch((error: unknown) => {
        console.error("Não foi possível remover o listener Capacitor.", error);
      });
    };`

    return `// UpzLab app: ${appNameComment}
import { useEffect } from "react";
${frameworkImport}
import UpzLabSDK from "./upzlab-sdk";

export function useUpzLabCheckin() {
  useEffect(() => {
    const sdk = new UpzLabSDK({
      appId: ${appId},
      apiUrl: ${JSON.stringify(SDK_ENDPOINT)},
      appVersion: ${appVersion},
      getAccessToken: () => authRepository.getAccessToken(),
      platform: "${platform === "react-native" ? "react-native" : "android"}",
    });

    const trackOpen = () => {
      void sdk.trackOpen().catch((error: unknown) => {
        console.error("Não foi possível registrar a abertura no UpzLab.", error);
      });
    };

    ${listenerCode.split("\n").join("\n    ")}
  }, []);
}`;
  }, [app, platform]);

  const downloadIntegrationCode = () => {
    if (!code || !app) return;
    const fileName = platform === "kotlin" ? "UpzLabApplication.kt" : "useUpzLabCheckin.tsx";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${app.name.replace(/[^A-Za-z0-9_-]/g, "-")}-${fileName}`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Código de integração ${platform === "kotlin" ? "Kotlin" : "TypeScript"} baixado.`);
  };

  const downloadClient = async () => {
    setError(null);
    setNotice(null);
    setDownloading(true);
    try {
      const response = await fetch(
        `/api/sdk/apps/${encodeURIComponent(id)}/download/${platform === "kotlin" ? "android" : "typescript"}`,
        { headers: authHeaders() },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.detail || result.error || "Não foi possível baixar o SDK.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = platform === "kotlin" ? "UpzLabSdk.kt" : "upzlab-sdk.ts";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Arquivo do SDK baixado. Use também o código de integração gerado abaixo.");
    } catch (downloadError: unknown) {
      setError(downloadError instanceof Error ? downloadError.message : "Não foi possível baixar o SDK.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center font-mono text-sm text-slate-400">Carregando configuração do SDK...</div>;
  }

  if (error && !app) {
    return <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">{error}</div>;
  }

  if (!app) return null;
  const configurationSaved = Boolean(app.package_id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">Lab Studio / Integração SDK</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Configure o SDK de {app.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Os dados do app vêm do cadastro existente. Escolha a tecnologia e baixe o SDK e o código de integração já preenchidos.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Endpoint do código: <code className="font-mono text-slate-300">{SDK_ENDPOINT}</code>
        </p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</div>}

      <section className="grid gap-3 rounded-2xl border border-slate-800 bg-[#131D33]/70 p-5 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Aplicativo</p>
          <p className="mt-1 text-sm font-semibold text-white">{app.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Package ID</p>
          <p className="mt-1 break-all font-mono text-sm text-slate-200">{app.package_id || "Não informado no cadastro"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Versão cadastrada</p>
          <p className="mt-1 text-sm text-slate-200">{app.version || "Não informada"}</p>
        </div>
        <p className="text-xs leading-5 text-slate-500 sm:col-span-3">
          Esses dados são carregados do cadastro do app e usados automaticamente no código. Configure{" "}
          <code className="font-mono text-slate-300">NEXT_PUBLIC_API_URL</code> com um endereço da API acessível pelo dispositivo Android.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#131D33]/70 p-5">
        <label htmlFor="sdk-platform" className="block text-xs font-bold uppercase tracking-wide text-slate-300">Tecnologia Android</label>
        <select
          id="sdk-platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as Platform)}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0A0E1A] px-3 py-2.5 text-sm text-white sm:max-w-md"
        >
          {PLATFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadClient}
            disabled={!configurationSaved || downloading}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
          >
            {downloading ? "Preparando SDK..." : `Baixar SDK ${platform === "kotlin" ? "Kotlin" : "TypeScript"}`}
          </button>
          <button
            type="button"
            onClick={downloadIntegrationCode}
            disabled={!configurationSaved}
            className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] transition hover:bg-white/90 disabled:opacity-50"
          >
            Baixar código personalizado
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#0A0E1A] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Código de integração</h3>
            <p className="mt-1 text-xs text-slate-500">App: {app.name} · ID: <code className="font-mono">{app.package_id || "indisponível"}</code> · Versão: {app.version || "não informada"}</p>
          </div>
          <Link href="/sdk/integracao" className="text-xs font-semibold text-slate-300 underline underline-offset-4 hover:text-white">
            Abrir guia de instalação
          </Link>
        </div>
        {configurationSaved ? (
          <CodeSnippet code={code} label={platform === "kotlin" ? "UpzLabApplication.kt" : "useUpzLabCheckin.tsx"} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Este app ainda não tem Package ID. Informe o ID do app Android (o mesmo do Play Console) para gerar a integração.</p>
            <div className="flex flex-wrap gap-2">
              <input
                value={pkgInput}
                onChange={(event) => setPkgInput(event.target.value)}
                placeholder="com.empresa.app"
                className="w-full rounded-lg border border-slate-700 bg-[#0A0E1A] px-3 py-2.5 font-mono text-sm text-white sm:max-w-sm"
              />
              <button
                type="button"
                onClick={savePackageId}
                disabled={savingPkg || !pkgInput.trim()}
                className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] disabled:opacity-50"
              >
                {savingPkg ? "Salvando..." : "Salvar Package ID"}
              </button>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4 text-xs leading-6 text-amber-100/80">
        A integração precisa obter a sessão UpzLab atual da pessoa que está testando. Cada testador deve se inscrever no app; não embuta tokens fixos, senhas ou credenciais do dono no APK.
      </aside>
    </div>
  );
}
