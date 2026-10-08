"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useComunidade } from "../ComunidadeContext";

const getAppIconSrc = (icon: string) => {
  if (!icon) return "/logo_transparent.png";
  if (icon.startsWith("http")) return icon;
  if (icon.startsWith("/uploads")) return `http://localhost:8001${icon}`;
  if (icon === "/logo_egolpe.png") return "/logo_transparent.png";
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
      setImgSrc("/logo_transparent.png");
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, devUser, notifications, logout, topDevs, recentApps, formatPoints } = useComunidade();
  const unreadCount = notifications.filter(n => !n.read).length;

  // Para evitar erro de Hydration (incompatibilidade entre o servidor e o cliente),
  // sempre iniciamos como true (carregando). O useEffect abaixo fará a liberação.
  const hasCookieAuth = () =>
    typeof document !== "undefined" &&
    (document.cookie.includes("upzlab_dev_jwt=") || document.cookie.includes("auth_token="));

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  useEffect(() => {
    // Re-verifica quando o contexto confirmar o estado de login
    const hasAuth = hasCookieAuth();
    if (!hasAuth && !isLoggedIn) {
      router.push("/login");
    } else {
      setIsCheckingAuth(false);
    }
  }, [isLoggedIn, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
          <span className="text-emerald-400 font-mono text-sm font-bold tracking-widest uppercase">Validando Secap...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: "/",
      label: "Feed",
      shortLabel: "Feed",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      href: "/apps",
      label: "AppsLab",
      shortLabel: "AppsLab",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/postar",
      label: "Reportar",
      shortLabel: "Postar",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },

    {
      href: "/notificacoes",
      label: "Notificações",
      shortLabel: "Alertas",
      badgeCount: unreadCount,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      href: "/ranking",
      label: "Ranking",
      shortLabel: "Ranking",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      href: "/upzpoints",
      label: "UpzPoints",
      shortLabel: "UpzPoints",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/ai-support",
      label: "LabsAi",
      shortLabel: "LabsAi",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-[#0A0E1A] text-white min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md pt-safe-top pt-6 md:pt-0 shadow-lg">
        <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-decoration-none shrink-0">
              <img src="/logo_transparent.png" alt="É Golpe Logo" title="Comunidade Dev É Golpe" className="h-7 w-auto drop-shadow-lg" />
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-4 border-r border-slate-700 pr-6 mr-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/comunidade" && pathname.startsWith(item.href));
                
                if (item.href === "/notificacoes") {
                  return (
                    <div key={item.href} className="relative">
                      <button
                        onClick={() => setIsNotificationsModalOpen(!isNotificationsModalOpen)}
                        title={item.label}
                        className={`flex items-center justify-center p-3 rounded-xl transition-all ${isActive ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                      >
                        <span className="relative flex">
                          {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
                          {!!item.badgeCount && item.badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-sm ring-2 ring-[#0A0E1A]">
                              {item.badgeCount}
                            </span>
                          )}
                        </span>
                      </button>

                      {isNotificationsModalOpen && (
                        <div className="absolute right-0 top-full mt-3 w-[340px] bg-[#0A0E1A]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden z-50">
                          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                            <h3 className="text-white font-bold text-xs uppercase tracking-widest">Notificações</h3>
                            <button onClick={() => setIsNotificationsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                          
                          <div className="max-h-[320px] overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
                            {notifications.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-8 font-mono">Você não possui novas notificações.</p>
                            ) : (
                              notifications.slice(0, 5).map((notif: any, idx: number) => (
                                <Link href={`/notificacoes/${notif.id}`} onClick={() => setIsNotificationsModalOpen(false)} key={idx} className="group flex items-start gap-3 p-3 hover:bg-slate-800/40 rounded-xl transition-all duration-200 cursor-pointer">
                                   <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 transition-colors ${!notif.read ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                                   <div className="flex-1 min-w-0">
                                      <p className={`text-xs leading-snug ${!notif.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                        {notif.title || "Notificação"}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                        {notif.message || notif.content}
                                      </p>
                                   </div>
                                </Link>
                              ))
                            )}
                          </div>

                          <div className="p-3 border-t border-slate-800/60 bg-slate-900/20">
                            <Link href="/notificacoes" onClick={() => setIsNotificationsModalOpen(false)} className="block w-full text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 py-2 transition-colors">
                              Ver todas as notificações →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all ${isActive ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <span className="relative flex">
                      {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
                      {!!item.badgeCount && item.badgeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-sm ring-2 ring-[#0A0E1A]">
                          {item.badgeCount}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-48 bg-[#131D33] border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                      <div className="px-4 py-3 mb-1 border-b border-slate-800/80 bg-slate-900/30">
                        <div className="text-xs font-bold text-white truncate">{devUser?.name}</div>
                        <div className="text-[10px] font-mono font-bold text-emerald-400 mt-1">{devUser?.points || 0} PTS</div>
                      </div>
                      <Link href={devUser?.username ? `/lab/${devUser.username}` : "/lab/perfil"} onClick={() => setIsProfileOpen(false)} className="block px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        Ver Perfil
                      </Link>
                      <button onClick={() => { setIsProfileOpen(false); logout(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/30 transition-colors border-t border-slate-800/50">
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex gap-6 lg:gap-10 items-start">
          <aside className="hidden lg:block w-[240px] shrink-0 sticky top-24 h-[calc(100vh-7rem)]">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 pr-1">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-3 px-2">Workspace</div>

                <Link href="/studio" className="text-sm font-bold text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/80 rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all shadow-sm mb-2 border border-slate-700/50 hover:border-emerald-500/40 group">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Studio Labs
                </Link>

                <Link href="/apps/novo" className="text-sm font-bold text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/80 rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all shadow-sm mb-2 border border-slate-700/50 hover:border-emerald-500/40 group">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Cadastrar App
                </Link>

                <Link href="/auto-docs" className="text-sm font-bold text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/80 rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all shadow-sm mb-3 border border-slate-700/50 hover:border-emerald-500/40 group">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  DocsLab IA
                </Link>

                <Link href="/auto-docs/meus-docs" className="text-sm font-bold text-slate-300 hover:text-white bg-slate-800/30 hover:bg-slate-800/80 rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-all shadow-sm mb-3 border border-slate-700/50 hover:border-emerald-500/40 group">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  Meus Docs
                </Link>

                <div className="h-px w-full bg-slate-800/60 my-2" />
                
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-3 px-2 mt-4">Comunidade UpzLab</div>

                <Link href="/discussoes" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                  Fórum & Discussões
                </Link>

                <Link href="/desafios" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Desafios & Bounties
                </Link>

                <Link href="/cursos" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                  Cursos & Masterclass
                </Link>

                <Link href="/vagas" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Vagas & Networking
                </Link>

                <Link href="/ferramentas" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Ferramentas Lab
                </Link>

                <Link href="/ai-support" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  LabsAi FAQ
                </Link>

                <div className="h-px w-full bg-slate-800/60 my-2" />

                <Link href="/upzpoints" className="text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <aside className="hidden lg:block w-[220px] shrink-0 sticky top-24 h-[calc(100vh-7rem)]">
            <div className="flex flex-col gap-5 h-full">
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-5 pr-1 pb-4">
                
                {/* WIDGET: Devs em Destaque */}
                <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="px-1 py-2 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Devs em Destaque</span>
                  </div>
                  <div className="space-y-3 px-1">
                    {topDevs.slice(0, 5).map((dev, idx) => (
                      <div key={dev.id} className="flex items-center gap-2.5">
                        <span className={`text-xs font-mono font-black w-4 shrink-0 text-center ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-slate-600"}`}>
                          {idx + 1}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-[10px] font-mono shrink-0">
                          {dev.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate leading-tight">{dev.name}</div>
                          <div className="text-[10px] font-mono text-emerald-400">{dev.points} pts</div>
                        </div>
                      </div>
                    ))}
                    <Link href="/ranking" className="block pt-2 border-t border-slate-800 text-center text-[10px] font-mono font-bold text-slate-500 hover:text-emerald-400 transition-colors">
                      Ver ranking completo →
                    </Link>
                  </div>
                </div>

                <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl mt-4">
                  <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">AppsLab</span>
                    </div>
                    <Link href="/apps" className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                      Ver todos →
                    </Link>
                  </div>
                  <div className="p-2.5 space-y-2">
                    {recentApps && recentApps.length > 0 ? (
                      recentApps.slice(0, 5).map((app) => (
                        <Link
                          key={app.id}
                          href={`/apps/${app.slug}`}
                          className="flex items-center gap-3 p-2 rounded-xl bg-[#0A0E1A]/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1 group-hover:border-emerald-500/50 transition-colors">
                            <SidebarAppIcon iconUrl={app.icon} appName={app.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                {app.name}
                              </span>
                              {app.is_founder_app && (
                                <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-mono font-bold uppercase shrink-0">
                                  OFICIAL
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-400 truncate">
                                {app.category}
                              </span>
                              <span className="text-slate-600 text-[9px]">•</span>
                              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                {app.reward || 500} pts
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 py-3 text-center font-mono">
                        Nenhum app cadastrado.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rodapé legal — sempre visível na base */}
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
                <p className="text-[10px] text-slate-600">© {new Date().getFullYear()} UpzLab</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0F172A] border-t border-slate-800">
        <div className="flex h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/comunidade" && pathname.startsWith(item.href));

            if (item.href === "/notificacoes") {
              return (
                <div key={item.href} className="flex-1 flex flex-col items-center justify-center relative">
                  <button 
                    onClick={() => setIsNotificationsModalOpen(!isNotificationsModalOpen)} 
                    className={`flex flex-col items-center justify-center gap-0.5 w-full h-full relative ${isActive ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {!!item.badgeCount && item.badgeCount > 0 && (
                      <span className="absolute top-2 right-[calc(50%-16px)] w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badgeCount}</span>
                    )}
                    {item.icon}
                    <span className="text-[9px] font-mono font-bold">{item.shortLabel}</span>
                    {isActive && <span className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 rounded-full" />}
                  </button>

                  {isNotificationsModalOpen && (
                    <div className="absolute bottom-full right-[calc(50%-170px)] sm:right-[-20px] md:right-0 mb-4 w-[calc(100vw-2rem)] max-w-[340px] bg-[#0A0E1A]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.7)] overflow-hidden z-[100]">
                      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                        <h3 className="text-white font-bold text-xs uppercase tracking-widest">Notificações</h3>
                        <button onClick={() => setIsNotificationsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-8 font-mono">Você não possui novas notificações.</p>
                        ) : (
                          notifications.slice(0, 5).map((notif: any, idx: number) => (
                            <Link href={`/notificacoes/${notif.id}`} onClick={() => setIsNotificationsModalOpen(false)} key={idx} className="group flex items-start gap-3 p-3 hover:bg-slate-800/40 rounded-xl transition-all duration-200 cursor-pointer">
                               <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 transition-colors ${!notif.read ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                               <div className="flex-1 min-w-0">
                                  <p className={`text-xs text-left leading-snug ${!notif.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                                    {notif.title || "Notificação"}
                                  </p>
                                  <p className="text-[10px] text-left text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                    {notif.message || notif.content}
                                  </p>
                               </div>
                            </Link>
                          ))
                        )}
                      </div>

                      <div className="p-3 border-t border-slate-800/60 bg-slate-900/20">
                        <Link href="/notificacoes" onClick={() => setIsNotificationsModalOpen(false)} className="block w-full text-center text-xs font-bold text-emerald-400 hover:text-emerald-300 py-2 transition-colors">
                          Ver todas as notificações →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                {!!item.badgeCount && item.badgeCount > 0 && (
                  <span className="absolute top-2 right-[calc(50%-16px)] w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.badgeCount}</span>
                )}
                {item.icon}
                <span className="text-[9px] font-mono font-bold">{item.shortLabel}</span>
                {isActive && <span className="absolute top-0 inset-x-4 h-0.5 bg-emerald-500 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
