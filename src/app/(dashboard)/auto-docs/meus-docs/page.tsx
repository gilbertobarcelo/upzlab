"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/auth";

type DocApp = {
  id: number;
  app_name: string;
  github_url: string;
  status: string;
  created_at: string | null;
};

const API = "http://localhost:8001/api/auto-docs";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Na fila", cls: "bg-slate-700/40 text-slate-300 border-slate-600/50" },
  processing: { label: "Gerando", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  completed: { label: "Rascunho", cls: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  published: { label: "Publicada", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  error: { label: "Erro", cls: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
};

export default function MeusDocsPage() {
  const [apps, setApps] = useState<DocApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/apps`, { headers: authHeaders() });
      if (res.status === 401) throw new Error("Faça login para ver suas documentações.");
      if (!res.ok) throw new Error();
      setApps(await res.json());
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não foi possível carregar suas documentações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (confirmId === null) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-delete-popover]")) setConfirmId(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setConfirmId(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [confirmId]);

  const handleDelete = async (app: DocApp) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API}/${app.id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) setApps((prev) => prev.filter((a) => a.id !== app.id));
      else setError("Erro ao excluir a documentação.");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Docs</h1>
          <p className="text-sm text-slate-400 mt-1">Todas as documentações que você gerou no DocsLab.</p>
        </div>
        <Link
          href="/auto-docs"
          className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-4 py-2 transition-colors"
        >
          Gerar nova doc
        </Link>
      </div>

      {loading && <p className="text-slate-400 text-sm">Carregando...</p>}
      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {!loading && !error && apps.length === 0 && (
        <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center">
          <p className="text-slate-300 font-semibold">Você ainda não gerou nenhuma documentação.</p>
          <Link href="/auto-docs" className="text-emerald-400 text-sm hover:underline mt-2 inline-block">
            Começar agora
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {apps.map((app) => {
          const st = STATUS_LABEL[app.status] || STATUS_LABEL.pending;
          return (
            <div
              key={app.id}
              className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-xl px-5 py-4 transition-all"
            >
              <Link href={`/auto-docs/${encodeURIComponent(app.app_name)}`} className="flex-1 min-w-0 group">
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold truncate group-hover:text-emerald-400 transition-colors">
                    {app.app_name}
                  </span>
                  <span className={`text-[11px] font-semibold border rounded-full px-2 py-0.5 ${st.cls}`}>{st.label}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {app.github_url}
                  {app.created_at && <> &middot; {new Date(app.created_at).toLocaleDateString("pt-BR")}</>}
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/auto-docs/${encodeURIComponent(app.app_name)}`}
                  className="text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1.5"
                >
                  Abrir
                </Link>
                <div className="relative" data-delete-popover>
                  <button
                    id={`delete-doc-${app.id}`}
                    onClick={() => setConfirmId(confirmId === app.id ? null : app.id)}
                    className="text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg px-3 py-1.5"
                  >
                    Excluir
                  </button>
                  {confirmId === app.id && (
                    <div className="absolute right-0 top-full mt-3 z-20 w-80 bg-slate-900/95 backdrop-blur border border-slate-700/70 rounded-xl shadow-2xl shadow-black/50 p-5 animate-in fade-in zoom-in-95">
                      <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-slate-900 border-l border-t border-slate-700/70" />
                      <p className="text-sm font-semibold text-white">Excluir documentação</p>
                      <p className="text-sm text-slate-400 leading-relaxed mt-1.5 break-words">
                        Toda a documentação de <span className="font-semibold text-slate-200 break-all">{app.app_name}</span> será removida. Essa ação não pode ser desfeita.
                      </p>
                      <div className="flex justify-end gap-2 mt-5">
                        <button
                          id={`cancel-delete-${app.id}`}
                          onClick={() => setConfirmId(null)}
                          className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          id={`confirm-delete-${app.id}`}
                          disabled={deleting}
                          onClick={() => handleDelete(app)}
                          className="text-sm font-semibold text-white bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 disabled:opacity-60 px-4 py-2 rounded-lg transition-colors"
                        >
                          {deleting ? "Excluindo..." : "Sim, excluir"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
