"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useComunidade } from "../ComunidadeContext";
import DashboardHeader from "@/components/DashboardHeader";

const getAppIconSrc = (icon: string) => {
  if (!icon) return "/favicon.svg?v=5";
  if (icon.startsWith("http")) return icon;
  if (icon.startsWith("/uploads")) return `http://localhost:8001${icon}`;
  if (icon === "/logo_egolpe.png") return "/favicon.svg?v=5";
  return icon;
};

const SidebarAppIcon = ({ iconUrl, appName }: { iconUrl: string; appName: string }) => {
  const [imgSrc, setImgSrc] = useState(() => getAppIconSrc(iconUrl));
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setImgSrc(getAppIconSrc(iconUrl));
    setErrorCount(0);
  }, [iconUrl]);

  const handleError = () => {
    if (errorCount === 0) {
      setImgSrc("/favicon.svg?v=5");
      setErrorCount(1);
    } else {
      setErrorCount(2);
    }
  };

  if (errorCount >= 2) {
    return (
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-700/30 flex items-center justify-center text-emerald-400 font-black text-xs font-mono border border-emerald-500/30">
        {appName ? appName.charAt(0).toUpperCase() : "A"}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={appName}
      className="w-full h-full object-contain p-0.5"
      onError={handleError}
    />
  );
};

interface CommunityMember {
  username: string;
  name: string;
  avatar_url?: string | null;
  level?: string;
  points: number;
}

const memberAvatar = (url?: string | null) => {
  if (!url || url.includes("ui-avatars.com")) return "";
  if (url.startsWith("/uploads")) return `http://localhost:8001${url}`;
  return url;
};

function CommunityMembers() {
  const [total, setTotal] = useState(0);
  const [members, setMembers] = useState<CommunityMember[]>([]);

  useEffect(() => {
    fetch("http://localhost:8001/api/upzlab/dev/members?limit=5")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          setTotal(d.total || 0);
          setMembers(d.data || []);
        }
      })
      .catch(() => {});
  }, []);

  if (members.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Devs na comunidade</h2>
        <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-200">{total}</span>
      </div>
      <ul className="mt-3 space-y-1">
        {members.slice(0, 5).map((m) => (
          <li key={m.username}>
            <Link href={`/lab/${m.username}`} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-white/[0.045]">
              <img
                src={memberAvatar(m.avatar_url) || "/favicon.svg?v=5"}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full border border-[#2a2e35] bg-[#0d0d0d] object-cover"
                onError={(e) => {
                  if (!e.currentTarget.src.endsWith("/favicon.svg?v=5")) e.currentTarget.src = "/favicon.svg?v=5";
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-100">{m.name}</span>
                <span className="block truncate text-[10px] text-slate-500">@{m.username}{m.level ? ` · ${m.level}` : ""}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/ranking" className="mt-3 block text-[10px] font-semibold text-slate-500 transition hover:text-emerald-300">
        Ver ranking completo <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRouterDashboard = pathname.startsWith("/upzlabrouter");
  const router = useRouter();
  const { isLoggedIn, recentApps } = useComunidade();
  const promotedApps = recentApps
    .filter((app) => !app.is_founder_app && (app.boost_level ?? 0) > 0)
    .sort((a, b) => (b.boost_level ?? 0) - (a.boost_level ?? 0));

  // Para evitar erro de Hydration (incompatibilidade entre o servidor e o cliente),
  // sempre iniciamos como true (carregando). O useEffect abaixo fará a liberação.
  const hasCookieAuth = () =>
    typeof document !== "undefined" &&
    (document.cookie.includes("upzlab_dev_jwt=") || document.cookie.includes("auth_token="));

  const requiresLogin = !hasCookieAuth() && !isLoggedIn;

  useEffect(() => {
    if (requiresLogin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, requiresLogin, router]);

  if (requiresLogin) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
          <span className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Validando Secap...</span>
        </div>
      </div>
    );
  }

  const sidebarLinkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      active
        ? "border border-emerald-400/15 bg-emerald-400/[0.08] font-semibold text-emerald-200"
        : "border border-transparent font-medium text-slate-300 hover:bg-white/[0.045] hover:text-white"
    }`;
  };

  return (
    <div className="bg-[#121212] text-white min-h-screen pb-16 lg:pb-0">
      <DashboardHeader />

      {isRouterDashboard ? (
        <div className="mx-auto w-full max-w-[1920px] min-w-0 px-4 py-5 pb-10 md:px-6 xl:px-8">
          {children}
        </div>
      ) : (
      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-6 xl:px-8 py-5 pb-8">
        <div className="flex items-start gap-5 xl:gap-8">
          <aside aria-label="Navegação principal" className="hidden lg:block w-[300px] shrink-0 sticky top-20 h-[calc(100vh-6rem)] bg-transparent p-3 [&_svg]:text-white">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 pr-1">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-3 px-2">Workspace</div>

                <Link href="/studio" className={`${sidebarLinkClass("/studio")} mb-2`}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Studio Labs
                </Link>

                <Link href="/apps/novo" className={`${sidebarLinkClass("/apps/novo")} mb-2`}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Cadastrar App
                </Link>

                <Link href="/auto-docs" className={`${sidebarLinkClass("/auto-docs")} mb-3`}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a2 2 0 01.707.293l5.414 5.414a2 2 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  DocsLab IA
                </Link>

                <Link href="/auto-docs/meus-docs" className={`${sidebarLinkClass("/auto-docs/meus-docs")} mb-3`}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Meus Docs
                </Link>

                <Link href="/convites" className={`${sidebarLinkClass("/convites")} mb-3`}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19a6 6 0 00-12 0m12 0H3m12 0h6m-3-3v6M9 10a3 3 0 100-6 3 3 0 000 6zm9-1a3 3 0 11-2.83-3" />
                  </svg>
                  Convidar testers
                </Link>

                <Link href="/upzlabrouter/dashboard" className={`${sidebarLinkClass("/upzlabrouter")} mb-3`}>
                  <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h8l-1 8 11-12h-8l1-8z" />
                  </svg>
                  UpzLab Router
                </Link>

                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-3 px-2 mt-4">Comunidade UpzLab</div>

                <Link href="/discussoes" className={sidebarLinkClass("/discussoes")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                  Fórum & Discussões
                </Link>

                <Link href="/desafios" className={sidebarLinkClass("/desafios")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Desafios & Bounties
                </Link>

                <Link href="/cursos" className={sidebarLinkClass("/cursos")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                  Cursos & Masterclass
                </Link>

                <Link href="/vagas" className={sidebarLinkClass("/vagas")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Vagas & Networking
                </Link>

                <Link href="/ferramentas" className={sidebarLinkClass("/ferramentas")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Ferramentas Lab
                </Link>

                <Link href="/ai-support" className={sidebarLinkClass("/ai-support")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  LabsAi FAQ
                </Link>

                <Link href="/upzpoints" className={sidebarLinkClass("/upzpoints")}>
                  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  UpzPoints
                </Link>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>

          <aside aria-label="Apps promovidos e UpzLabRouter" className="hidden xl:block w-[300px] shrink-0 sticky top-20 h-[calc(100vh-6rem)] bg-transparent p-3">
            <div className="flex flex-col gap-5 h-full min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-3 pr-1 pb-4 pt-2">
                <Link
                  href="/upzlabrouter"
                  className="group block overflow-hidden rounded-2xl border border-slate-300/20 bg-gradient-to-br from-[#1a1d21] via-[#1a1d21] to-[#1a1d21] p-4 transition-colors hover:border-white/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 2L3 14h8l-1 8 11-12h-8l1-8z" />
                        </svg>
                      </span>
                      UpzLabRouter
                    </span>
                    <span className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-200" aria-hidden="true">→</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Acesse modelos de IA por uma API unificada. Crie chaves e veja como integrar.
                  </p>
                  <span className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-[#101719] transition group-hover:bg-slate-200">
                    Conhecer o Router
                  </span>
                </Link>

                <CommunityMembers />

                {promotedApps.length > 0 && (
                  <div className="flex items-center justify-between px-1 pt-2">
                    <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Apps promovidos</h2>
                    <Link href="/apps" className="text-[10px] font-semibold text-slate-500 transition hover:text-emerald-300">
                      Vitrine <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                )}
                {promotedApps.slice(0, 3).map((app) => (
                    <Link
                      key={app.id}
                      href={`/apps/${app.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-[#2a2e35] bg-[#1a1d21] transition-colors hover:border-emerald-400/30 hover:bg-[#20242b]"
                    >
                      <div className="flex items-center justify-between border-b border-[#2a2e35] px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Promovido
                        </span>
                        <span className="font-mono text-[9px] text-slate-500">
                          {app.boost_level === 3 ? "Elite" : app.boost_level === 2 ? "Destaque" : "Feed"}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 p-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#2a2e35] bg-[#20242b] p-1.5 transition-colors group-hover:border-emerald-400/30">
                          <SidebarAppIcon iconUrl={app.icon} appName={app.name} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-emerald-200">
                            {app.name}
                          </span>
                          <span className="mt-1 block truncate text-[10px] text-slate-400">{app.category}</span>
                          {app.description && (
                            <span className="mt-2 line-clamp-2 block text-[11px] leading-4 text-slate-500">
                              {app.description}
                            </span>
                          )}
                          <span className="mt-2 inline-flex rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-300">
                            {app.reward || 500} pts para testers
                          </span>
                        </div>
                      </div>
                    </Link>
                ))}

                {promotedApps.length === 0 && (
                  <Link
                    href="/studio"
                    className="group block rounded-2xl border border-dashed border-[#2a2e35] px-4 py-4 transition-colors hover:border-emerald-400/30 hover:bg-[#1a1d21]"
                  >
                    <span className="block text-xs font-semibold text-slate-300 transition group-hover:text-emerald-200">Promova seu app</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500">Ative uma campanha no Lab Studio para aparecer neste espaço.</span>
                  </Link>
                )}
              </div>

              <div className="shrink-0 space-y-1.5 pb-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <Link href="/privacidade" className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors">Privacidade</Link>
                  <span className="text-[10px] text-slate-700">·</span>
                  <Link href="/privacidade-saude" className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors">Privacidade da Saúde do Consumidor</Link>
                  <span className="text-[10px] text-slate-700">·</span>
                  <Link href="/termos" className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors">Termos</Link>
                  <span className="text-[10px] text-slate-700">·</span>
                  <Link href="/publicidade" className="text-[10px] text-slate-500 hover:text-slate-400 transition-colors">Publicidade</Link>
                </div>
                <p className="text-[10px] text-slate-600">Desenvolvido por UpzLab · © {new Date().getFullYear()}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      )}



    </div>
  );
}
