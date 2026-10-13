"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useComunidade } from "@/app/ComunidadeContext";

const marketingItems = [
  { label: "Para Testers", href: "/#testers" },
  { label: "Para Criadores", href: "/#criadores" },
  { label: "Funcionalidades", href: "/#features" },
  { label: "UpzPoints", href: "/#points" },
  { label: "SDK Android", href: "/sdk" },
];

const communityItems = [
  { label: "Feed da comunidade", href: "/comunidade" },
  { label: "AppsLab", href: "/apps" },
  { label: "Reportar", href: "/postar" },
  { label: "Notificações", href: "/notificacoes" },
  { label: "Ranking", href: "/ranking" },
  { label: "UpzPoints", href: "/upzpoints" },
  { label: "Convidar testers", href: "/convites" },
  { label: "Studio Labs", href: "/studio" },
  { label: "DocsLab IA", href: "/auto-docs" },
  { label: "Meus Docs", href: "/auto-docs/meus-docs" },
  { label: "Fórum & Discussões", href: "/discussoes" },
  { label: "Desafios & Bounties", href: "/desafios" },
  { label: "Cursos", href: "/cursos" },
  { label: "SDK & Check-in", href: "/sdk/monitoramento" },
  { label: "LabsAi", href: "/ai-support" },
];

const directItems = [
  { label: "UpzLab Router", href: "/upzlabrouter" },
];

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function UpzLabHeader() {
  const pathname = usePathname();
  const { isLoggedIn, devUser, notifications, logout } = useComunidade();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 20);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const hrefForCurrentPage = (href: string) =>
    pathname === "/" && href.startsWith("/#") ? href.slice(1) : href;

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
    return `shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] transition ${
      active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
    }`;
  };

  return (
    <header className={`sticky inset-x-0 top-0 z-50 transition-all duration-200 ${
      scrolled ? "border-b border-white/[0.08] bg-[#171a1d]/95 backdrop-blur-xl" : "border-b border-white/[0.06] bg-[#121416]/95 backdrop-blur-md"
    }`}>
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" aria-label="UpzLab — página inicial" onClick={() => setMobileMenuOpen(false)} className="shrink-0">
          <Image src="/upzlab-wordmark-v6.svg" alt="UpzLab" width={124} height={48} className="h-9 w-auto" priority />
        </Link>

        <nav aria-label="Navegação principal" className="hidden shrink-0 items-center gap-0.5 xl:flex">
          {marketingItems.map((item) => (
            <Link key={item.href} href={hrefForCurrentPage(item.href)} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          {directItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              aria-expanded={communityMenuOpen}
              onClick={() => setCommunityMenuOpen((open) => !open)}
              className="rounded-lg px-3 py-2 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Comunidade
              <span className="ml-1 text-[10px]" aria-hidden="true">▾</span>
            </button>
            {communityMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#171a1d] p-1.5 shadow-2xl">
                {communityItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setCommunityMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {isLoggedIn ? (
            <>
              <Link href="/notificacoes" aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ""}`} className="relative rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1.1-.6 1.4L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-[#121416]">{unreadCount}</span>}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Abrir menu do perfil"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="max-w-28 truncate">{devUser?.name || "Minha conta"}</span>
                  <span className="text-[10px]" aria-hidden="true">▾</span>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-[#171a1d] p-1.5 shadow-2xl">
                    <Link
                      href={devUser?.username ? `/lab/${devUser.username}` : "/lab/perfil"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      Ver perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setProfileMenuOpen(false); logout(); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-[13px] font-semibold text-white/55 transition-colors hover:text-white">
                Entrar
              </Link>
              <Link href="/cadastro" className="rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-[#101416] transition hover:bg-slate-200">
                Criar conta grátis
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/5 hover:text-white xl:hidden"
        >
          <MenuIcon open={mobileMenuOpen} />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-white/10 bg-[#171a1d] px-4 py-3 xl:hidden">
          <nav aria-label="Navegação mobile" className="mx-auto max-w-6xl space-y-1">
            {[...marketingItems, ...directItems, ...communityItems].map((item) => (
              <Link
                key={item.href}
                href={hrefForCurrentPage(item.href)}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="space-y-2 border-t border-white/10 pt-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href={devUser?.username ? `/lab/${devUser.username}` : "/lab/perfil"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg border border-white/10 py-2.5 text-center text-sm font-semibold text-white/70"
                  >
                    Perfil{devUser?.name ? ` · ${devUser.name}` : ""}
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="block w-full rounded-lg border border-white/10 py-2.5 text-center text-sm font-semibold text-white/70"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg border border-white/10 py-2.5 text-center text-sm font-semibold text-white/65">
                    Entrar
                  </Link>
                  <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)} className="block rounded-lg bg-white py-2.5 text-center text-sm font-bold text-[#101416]">
                    Criar conta grátis
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
