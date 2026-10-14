"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routerNavigation = [
  { href: "/upzlabrouter/dashboard", label: "Painel", shortLabel: "Painel" },
  { href: "/upzlabrouter/models", label: "Modelos gratuitos", shortLabel: "Modelos" },
  { href: "/upzlabrouter/playground", label: "Playground", shortLabel: "Testar" },
  { href: "/upzlabrouter/usage", label: "Uso da API", shortLabel: "Uso" },
  { href: "/upzlabrouter/api/keys", label: "Chaves de API", shortLabel: "Chaves" },
  { href: "/upzlabrouter/docs", label: "Integração", shortLabel: "Docs" },
];

export default function UpzLabRouterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/upzlabrouter/api/keys") return children;

  return (
    <div className="mx-auto grid w-full max-w-[1920px] min-w-0 gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside aria-label="Navegação do UpzLabRouter" className="min-w-0">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-2 xl:sticky xl:top-20 xl:flex-col xl:overflow-visible xl:p-3">
          <p className="hidden px-3 pb-2 pt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 xl:block">
            Workspace Router
          </p>
          {routerNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                  active
                    ? "bg-white/[0.1] text-slate-300"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-slate-200" : "bg-slate-600"}`} />
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
