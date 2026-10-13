"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authHeaders } from "@/lib/auth";

type RouterKey = {
  id: number;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

type CreatedKey = { key: string; warning: string };

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const KEYS_URL = `${API_ORIGIN}/api/upzlabrouter/keys`;

async function errorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return `Falha na solicitação (${response.status}).`;
}

function formatDate(value: string | null): string {
  if (!value) return "Nunca utilizada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function UpzLabRouterKeysPage() {
  const [keys, setKeys] = useState<RouterKey[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<CreatedKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(KEYS_URL, { headers: authHeaders(), cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await errorMessage(response));
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error("A resposta de chaves está em formato inválido.");
        return payload as RouterKey[];
      })
      .then((data) => {
        if (isMounted) setKeys(data);
      })
      .catch((loadError: unknown) => {
        if (isMounted) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as chaves.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshKeys = async () => {
    const response = await fetch(KEYS_URL, { headers: authHeaders(), cache: "no-store" });
    if (!response.ok) throw new Error(await errorMessage(response));
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("A resposta de chaves está em formato inválido.");
    setKeys(payload as RouterKey[]);
  };

  const createKey = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(KEYS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: name.trim() || "Minha chave" }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const created = (await response.json()) as CreatedKey;
      setNewKey(created);
      setName("");
      await refreshKeys();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar a chave.");
    } finally {
      setIsCreating(false);
    }
  };

  const revokeKey = async (key: RouterKey) => {
    if (!window.confirm(`Revogar "${key.name}"? Aplicações que usam essa chave perderão acesso.`)) return;
    setRevokingId(key.id);
    setError(null);
    try {
      const response = await fetch(`${KEYS_URL}/${key.id}`, { method: "DELETE", headers: authHeaders() });
      if (!response.ok) throw new Error(await errorMessage(response));
      await refreshKeys();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Não foi possível revogar a chave.");
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey.key);
      setCopied(true);
    } catch {
      setError("Não foi possível copiar a chave. Selecione o valor e copie manualmente.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 space-y-6 pb-8 text-white">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200/60">UpzLabRouter / Segurança</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Chaves de API</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Crie uma chave por integração e revogue imediatamente qualquer acesso que não reconhecer.</p>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-200">{error}</div>}

      {newKey && (
        <section aria-live="polite" className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-amber-100">Guarde esta chave agora</h2>
              <p className="mt-1 text-xs leading-5 text-amber-100/65">{newKey.warning} Ela não poderá ser consultada novamente.</p>
            </div>
            <button type="button" onClick={() => { setNewKey(null); setCopied(false); }} className="text-xs text-amber-100/65 hover:text-white">Fechar</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-amber-100/10 bg-black/25 px-3 py-2.5 font-mono text-xs text-amber-50">{newKey.key}</code>
            <button type="button" onClick={() => void copyKey()} className="rounded-xl bg-amber-200 px-4 py-2.5 text-xs font-bold text-[#17130a] hover:bg-amber-100">
              {copied ? "Copiada" : "Copiar chave"}
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <form onSubmit={createKey} className="h-fit rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Nova integração</p>
          <h2 className="mt-1 text-lg font-semibold">Criar chave</h2>
          <label htmlFor="key-name" className="mt-5 block text-xs font-medium text-slate-300">Nome para identificar a chave</label>
          <input
            id="key-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="Ex.: Backend de produção"
            className="mt-2 w-full rounded-xl border border-[#2a2e35] bg-[#121212] px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/35"
          />
          <button type="submit" disabled={isCreating} className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#101719] transition hover:bg-slate-200 disabled:opacity-50">
            {isCreating ? "Criando chave..." : "Gerar chave segura"}
          </button>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">Nunca inclua a chave em aplicações de navegador, repositórios ou mensagens públicas.</p>
        </form>

        <section className="min-w-0 rounded-2xl border border-[#2a2e35] bg-[#1a1d21] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Acesso da conta</p>
              <h2 className="mt-1 text-lg font-semibold">Suas chaves</h2>
            </div>
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] text-slate-400">{keys.filter((key) => key.is_active).length} ativas</span>
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              <p className="py-8 text-center text-xs text-slate-500">Carregando chaves...</p>
            ) : keys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2a2e35] px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-300">Nenhuma chave cadastrada</p>
                <p className="mt-1 text-xs text-slate-500">Crie uma chave para começar sua integração.</p>
              </div>
            ) : keys.map((key) => (
              <article key={key.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#2a2e35] bg-[#121212]/60 p-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="max-w-full truncate text-sm font-semibold text-slate-200">{key.name}</h3>
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${key.is_active ? "bg-emerald-300/10 text-emerald-200" : "bg-white/[0.05] text-slate-500"}`}>
                      {key.is_active ? "Ativa" : "Revogada"}
                    </span>
                  </div>
                  <code className="mt-1 block break-all font-mono text-[10px] text-slate-500">{key.key_prefix}••••••••</code>
                  <p className="mt-1 text-[10px] text-slate-600">Último uso: {formatDate(key.last_used_at)}</p>
                </div>
                {key.is_active && (
                  <button type="button" onClick={() => void revokeKey(key)} disabled={revokingId === key.id} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-50">
                    {revokingId === key.id ? "Revogando..." : "Revogar"}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
