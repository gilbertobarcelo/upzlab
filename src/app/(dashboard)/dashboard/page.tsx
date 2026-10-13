"use client";

import Link from "next/link";
import { useComunidade } from "@/app/ComunidadeContext";

const shortcuts = [
  {
    href: "/comunidade",
    label: "Abrir comunidade",
    description: "Acompanhe conversas, compartilhe descobertas e ajude outros devs.",
    icon: "01",
  },
  {
    href: "/apps",
    label: "Explorar AppsLab",
    description: "Encontre aplicativos da comunidade para testar.",
    icon: "02",
  },
  {
    href: "/studio",
    label: "Gerenciar meus apps",
    description: "Acesse o Lab Studio para acompanhar seus projetos.",
    icon: "03",
  },
  {
    href: "/sdk/monitoramento",
    label: "Monitorar SDK",
    description: "Veja a atividade dos apps Android integrados.",
    icon: "04",
  },
];

export default function DashboardPage() {
  const { devUser, topDevs, recentApps, formatPoints } = useComunidade();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#142138] via-[#111a2a] to-[#10151e] p-6 shadow-2xl shadow-black/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/[0.045]" />
        <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-white/[0.06]" />
        <div className="relative max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
            Seu workspace UpzLab
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Olá, {devUser?.name?.split(" ")[0] || "desenvolvedor"}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300/75">
            Seu ponto de partida para testar apps, participar da comunidade e acompanhar
            seus projetos em um só lugar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/comunidade"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#07120f] transition hover:bg-emerald-300"
            >
              Ir para a comunidade
            </Link>
            <Link
              href="/apps/novo"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.035] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              Cadastrar um app
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Resumo da conta" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111722] p-5">
          <p className="text-xs font-medium text-slate-400">Saldo UpzPoints</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {formatPoints(devUser?.points ?? 0)}
          </p>
          <Link href="/upzpoints" className="mt-3 inline-flex text-xs font-semibold text-emerald-300 hover:text-emerald-200">
            Ver extrato <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111722] p-5">
          <p className="text-xs font-medium text-slate-400">Posição no ranking</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {devUser?.rankPosition ? `#${devUser.rankPosition}` : "—"}
          </p>
          <Link href="/ranking" className="mt-3 inline-flex text-xs font-semibold text-emerald-300 hover:text-emerald-200">
            Ver ranking <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#111722] p-5">
          <p className="text-xs font-medium text-slate-400">Nível de desenvolvedor</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {devUser?.role || "Membro"}
          </p>
          <Link
            href={devUser?.username ? `/lab/${devUser.username}` : "/lab/perfil"}
            className="mt-3 inline-flex text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Ver meu perfil <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Acesso rápido</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Continue de onde quiser</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-h-28 items-start gap-4 rounded-2xl border border-white/[0.08] bg-[#111722] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-[#141d2a]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-mono text-[10px] text-slate-400 transition group-hover:border-emerald-300/20 group-hover:text-emerald-200">
                {item.icon}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-100">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
              </span>
              <span className="ml-auto text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-200" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      {recentApps.length > 0 && (
        <section className="rounded-2xl border border-white/[0.08] bg-[#111722] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">AppsLab</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Projetos da comunidade</h2>
            </div>
            <Link href="/apps" className="text-xs font-semibold text-slate-300 transition hover:text-white">
              Explorar todos →
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentApps.slice(0, 3).map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.slug}`}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
              >
                <span className="block truncate text-sm font-semibold text-slate-100">{app.name}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{app.category}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topDevs.length > 0 && (
        <p className="text-xs text-slate-500">
          Destaques da comunidade:{" "}
          {topDevs.slice(0, 3).map((dev) => dev.name).join(" · ")}{" "}
          <Link href="/ranking" className="font-semibold text-slate-300 hover:text-white">— ver ranking</Link>
        </p>
      )}
    </main>
  );
}
