"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authHeaders, getAuthToken } from "@/lib/auth";
import UpzLabSDK from "@/lib/upzlab-sdk";

type CheckinStatus = {
  app_id: string;
  opened_today: boolean;
  status: string;
  deadline: string;
  timezone: string;
  reward: number;
  points_awarded: number;
  last_seen_at: string | null;
  alert_required: boolean;
  alert_message: string | null;
  email_sent: boolean;
  history: { date: string; opened: boolean; points_awarded: number }[];
  streak_days: number;
};

type StatusEnvelope = { success: boolean; data: CheckinStatus };
type MonitoredApp = { id: number; name: string; app_id: string; package_id: string; is_owner: boolean };

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const API_URL = API_ORIGIN.endsWith("/api/upzlab") ? API_ORIGIN : `${API_ORIGIN}/api/upzlab`;

function formatDate(value: string | null, timezone: string): string {
  if (!value) return "Ainda não registrado";
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
}

export default function SDKDashboardPage() {
  const [timezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
  );
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [apps, setApps] = useState<MonitoredApp[]>([]);
  const [appId, setAppId] = useState("");
  const [appsLoading, setAppsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadApps = async () => {
      try {
        const response = await fetch(`${API_URL}/sdk/apps`, {
          headers: authHeaders(),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.detail || "Não foi possível carregar seus apps.");
        }
        if (isMounted) {
          const availableApps = result.data as MonitoredApp[];
          setApps(availableApps);
          setAppId((current) =>
            availableApps.some((app) => app.app_id === current)
              ? current
              : availableApps[0]?.app_id || "upzlab-community",
          );
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar seus apps.");
          setAppId("upzlab-community");
        }
      } finally {
        if (isMounted) setAppsLoading(false);
      }
    };
    void loadApps();
    return () => {
      isMounted = false;
    };
  }, []);

  const sdk = useMemo(
    () => appId
      ? new UpzLabSDK({
        appId,
        apiUrl: API_URL,
        getAccessToken: getAuthToken,
        timezone,
        platform: "web",
      })
      : null,
    [appId, timezone],
  );

  const refreshStatus = useCallback(async () => {
    if (!sdk) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sdk.getStatus<StatusEnvelope>();
      if (!result.success) {
        throw new Error("A API não confirmou a consulta do check-in.");
      }
      setStatus(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível consultar o SDK.");
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  useEffect(() => {
    let isMounted = true;
    if (!sdk) return;

    const loadStatus = async () => {
      try {
        const result = await sdk.getStatus<StatusEnvelope>();
        if (!result.success) {
          throw new Error("A API não confirmou a consulta do check-in.");
        }
        if (isMounted) setStatus(result.data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Não foi possível consultar o SDK.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStatus();
    return () => {
      isMounted = false;
    };
  }, [sdk]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 text-white md:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            SDK UpzLab / Monitoramento
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Check-in diário</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Acompanhe a atividade, os pontos e a sequência do app selecionado na sua conta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/sdk"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
          >
            Documentação SDK
          </Link>
          {apps.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-slate-400">
              App
              <select
                value={appId}
                onChange={(event) => {
                  setAppId(event.target.value);
                  setStatus(null);
                  setError(null);
                  setLoading(true);
                }}
                disabled={appsLoading}
                className="max-w-xs rounded-lg border border-white/15 bg-[#151719] px-3 py-2.5 text-sm text-white"
              >
                {apps.map((app) => (
                  <option key={app.id} value={app.app_id}>{app.name} · {app.package_id}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      {!appsLoading && apps.length === 0 && (
        <section className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">Conecte um app do seu Studio</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Cadastre o app e confirme seus dados no Lab Studio. Para registrar atividade como testador, inscreva-se também no app pela comunidade.
          </p>
          <Link href="/apps/novo" className="mt-3 inline-flex text-xs font-semibold text-white underline underline-offset-4">
            Cadastrar um app →
          </Link>
        </section>
      )}

      <section aria-labelledby="checkin-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Visão por desenvolvedor e app</p>
            <h2 id="checkin-title" className="mt-1 text-xl font-bold tracking-tight">Check-in diário</h2>
          </div>
          <button
            type="button"
            onClick={() => void refreshStatus()}
            disabled={loading}
            className="rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:text-white disabled:cursor-wait disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "Atualizar status"}
          </button>
        </div>
      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading && !status ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          Consultando o status do SDK...
        </div>
      ) : status ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hoje</p>
              <p className={`mt-3 text-xl font-bold ${status.opened_today ? "text-emerald-300" : "text-amber-300"}`}>
                {status.opened_today ? "Check-in confirmado" : "Pendente"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Limite diário: {status.deadline}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pontos hoje</p>
              <p className="mt-3 text-2xl font-black text-emerald-300">
                {status.points_awarded} <span className="text-sm font-medium text-slate-400">UpzPoints</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Recompensa diária: {status.reward} pontos</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sequência atual</p>
              <p className="mt-3 text-2xl font-black text-indigo-300">
                {status.streak_days} <span className="text-sm font-medium text-slate-400">dias</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Dias seguidos com abertura registrada</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Última abertura</p>
              <p className="mt-3 text-sm font-bold text-white">
                {formatDate(status.last_seen_at, status.timezone)}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500" title={status.app_id}>
                App: {status.app_id}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Histórico de check-ins</h2>
                  <p className="mt-1 text-xs text-slate-400">Últimos sete dias · {status.timezone}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {status.history.filter((day) => day.opened).length}/7 dias
                </span>
              </div>
              <ol className="space-y-2">
                {status.history.map((day) => (
                  <li key={day.date} className="flex items-center justify-between rounded-xl bg-slate-950/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${day.opened ? "bg-emerald-400" : "bg-slate-700"}`} />
                      <span className="text-sm text-slate-200">
                        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" })
                          .format(new Date(`${day.date}T12:00:00Z`))}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${day.opened ? "text-emerald-300" : "text-slate-500"}`}>
                      {day.opened ? `+${day.points_awarded} pts` : "Sem registro"}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-slate-900/60 p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Ação do SDK</p>
              <h2 className="mt-3 text-xl font-bold">Registrar abertura</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                O check-in é enviado pelo app integrado quando ele entra em primeiro plano. Este painel apenas consulta o status e não credita pontos manualmente.
              </p>
              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
                Identificador monitorado: <span className="font-mono text-slate-200">{appId}</span>
              </div>
              {status.alert_required && status.alert_message && (
                <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
                  {status.alert_message}
                  {status.email_sent ? " O lembrete também foi enviado por e-mail." : ""}
                </p>
              )}
            </aside>
          </section>
        </div>
      ) : !error ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          Não há dados de check-in disponíveis.
        </div>
      ) : null}
      </section>
    </main>
  );
}
