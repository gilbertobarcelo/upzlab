"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useComunidade } from "@/app/ComunidadeContext";

export default function DashboardHeader() {
  const pathname = usePathname();
  const { isLoggedIn, devUser, notifications, logout } = useComunidade();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const rawAvatar = devUser?.avatarUrl || devUser?.github_avatar_url || "";
  const avatarSrc = rawAvatar.startsWith("/uploads") ? `http://localhost:8001${rawAvatar}` : rawAvatar;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  const navItems = [
    {
      href: "/comunidade",
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
  <>
  <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md pt-safe-top pt-6 md:pt-0 shadow-lg">
    <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 h-12 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/comunidade" className="flex items-center gap-2 text-decoration-none shrink-0">
          <img src="/upzlab-wordmark-v6.svg" alt="UpzLab" title="UpzLab" className="h-7 w-auto" />
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
                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
              >
                <img
                  src={avatarSrc || "/favicon.svg?v=5"}
                  alt={devUser?.name || "Perfil"}
                  className="w-full h-full object-cover bg-[#0d0d0d]"
                  onError={(e) => {
                    if (!e.currentTarget.src.endsWith("/favicon.svg?v=5")) e.currentTarget.src = "/favicon.svg?v=5";
                  }}
                />
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

  <nav aria-label="Navegação principal" className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0F172A] border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
    <div className="flex h-14">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/comunidade" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 relative ${isActive ? "text-emerald-400" : "text-slate-400"}`}
          >
            {!!item.badgeCount && item.badgeCount > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] min-w-[14px] h-[14px] px-1 rounded-full text-[8px] font-bold bg-rose-500 text-white flex items-center justify-center">
                {item.badgeCount}
              </span>
            )}
            {item.icon}
            <span className="text-[9px] font-mono font-bold truncate max-w-full px-0.5">{item.shortLabel}</span>
          </Link>
        );
      })}
    </div>
  </nav>
  </>
  );
}
