"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useComunidade, DevPost } from "../../ComunidadeContext";
import InlineComments from "../InlineComments";
import TextWithMentions from "../../components/TextWithMentions";

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

interface BetaApp {
  id: string;
  slug: string;
  name: string;
  developer: string;
  description: string;
  category: string;
  reward: number;
  requiredLevel: string;
  slots: string;
  tags: string[];
  icon: string;
  cover_url?: string;
  is_founder_app?: boolean;
  is_tester?: boolean;
  account_age_days?: number;
  boost_level?: number;
}

const AppIcon = ({ iconUrl, appName }: { iconUrl: string, appName: string }) => {
  const [error, setError] = useState(false);
  const isValidUrl = iconUrl && (iconUrl.startsWith("/") || iconUrl.startsWith("http"));
  const src = iconUrl.startsWith("/") ? `http://localhost:8001${iconUrl}` : iconUrl;

  if (!isValidUrl || error) {
    return <span className="opacity-80 uppercase">{appName.charAt(0)}</span>;
  }

  return (
    <img 
      src={src} 
      alt={appName} 
      className="w-full h-full object-cover" 
      onError={() => setError(true)} 
    />
  );
};

// Definição da interface para o AppRelease
interface AppRelease {
  id: number;
  version_name: string;
  version_code: number;
  file_type: string;
  release_notes: string;
  status: string;
  created_at: string;
  firebase_url?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getAdInterval(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return 3 + (hash % 3);
}

export default function ComunidadeFeedPage() {
  const { posts, likePost, formatPoints, addPost, devUser, refreshFeed, deletePost, editPost } = useComunidade();
  const [filterCategory, setFilterCategory] = useState("all");
  const [latestRelease, setLatestRelease] = useState<AppRelease | null>(null);
  const [apps, setApps] = useState<BetaApp[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Post Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postDescription, setPostDescription] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Menu de ações (3 pontos) por post
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null);

  // Modal de edição
  const [editingPost, setEditingPost] = useState<DevPost | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    refreshFeed().finally(() => setIsLoadingFeed(false));

    // Busca a última versão disponível
    fetch(`${API_BASE}/api/dev/distribution/latest`, {
      headers: {
        "Authorization": `Bearer ${getToken()}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.id) {
          setLatestRelease(data);
        }
      })
      .catch(err => console.error("Erro ao buscar versão do app:", err));

    const fetchApps = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8001/api/upzlab/campaigns/", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setApps(json.data);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar apps:", err);
      }
    };

    fetchApps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- Fetch once when the feed page mounts.

  const filteredPosts = posts.filter(
    p => filterCategory === "all" || p.category === filterCategory
  );

  // Detecta novo usuário: account_age_days === 0 e ainda não é tester do founder
  const founderApp = apps.find(a => a.is_founder_app);
  const isNewUser = !!founderApp && !founderApp.is_tester &&
    (founderApp.account_age_days === 0 || founderApp.account_age_days === null || founderApp.account_age_days === undefined);

  // Modal de boas-vindas — aparece uma vez por sessão para novos usuários
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  useEffect(() => {
    if (isNewUser && founderApp) {
      const key = `welcome_shown_${founderApp.id}`;
      if (!sessionStorage.getItem(key)) {
        const timer = window.setTimeout(() => setShowWelcomeModal(true), 0);
        sessionStorage.setItem(key, "1");
        return () => window.clearTimeout(timer);
      }
    }
  }, [isNewUser, founderApp]);

  // Monta o feed misturando posts e apps de forma natural
  const buildMixedFeed = () => {
    const result: { type: string; data: DevPost | BetaApp }[] = [];

    // Apps boosted entram antes dos regulares no rodízio
    const boostedApps = apps.filter(a => !a.is_founder_app && (a.boost_level ?? 0) > 0)
                            .sort((a, b) => (b.boost_level ?? 0) - (a.boost_level ?? 0));
    const regularApps = apps.filter(a => !a.is_founder_app && !(a.boost_level ?? 0));

    // Novo usuário: founder é o PRIMEIRO item do feed
    if (isNewUser && founderApp) {
      result.push({ type: 'founder', data: founderApp });
    }

    // Fila: boosted primeiro, depois regulares
    const appQueue = [...boostedApps, ...regularApps];
    let appQueueIndex = 0;
    let nextAdAt = getAdInterval(filteredPosts[0]?.id ?? "feed");
    let postsSinceLastAd = 0;

    for (let i = 0; i < filteredPosts.length; i++) {
      result.push({ type: 'post', data: filteredPosts[i] });
      postsSinceLastAd++;

      // Founder antigo (não novo usuário) entra no rodízio normal
      if (!isNewUser && founderApp && !founderApp.is_tester && postsSinceLastAd >= nextAdAt) {
        result.push({ type: 'founder', data: founderApp });
        postsSinceLastAd = 0;
        nextAdAt = getAdInterval(`${filteredPosts[i].id}:founder`);
        continue;
      }

      if (postsSinceLastAd >= nextAdAt && appQueueIndex < appQueue.length) {
        result.push({ type: 'app', data: appQueue[appQueueIndex] });
        appQueueIndex++;
        postsSinceLastAd = 0;
        nextAdAt = getAdInterval(`${filteredPosts[i].id}:app`);
      }
    }

    // Apps restantes no final
    while (appQueueIndex < appQueue.length) {
      result.push({ type: 'app', data: appQueue[appQueueIndex] });
      appQueueIndex++;
    }

    return result;
  };

  const mixedFeed = useMemo(() => buildMixedFeed(), [filteredPosts, apps, isNewUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">

      {/* Modal de Boas-vindas — App Founder para novos usuários */}
      {showWelcomeModal && founderApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1d21] border border-indigo-500/30 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            
            {/* Cover do app se tiver, senão gradient */}
            <div className="relative h-36 bg-gradient-to-br from-indigo-900/80 to-[#121212] flex items-center justify-center overflow-hidden">
              {founderApp.cover_url ? (
                <img
                  src={founderApp.cover_url.startsWith('/') ? `http://localhost:8001${founderApp.cover_url}` : founderApp.cover_url}
                  alt={founderApp.name}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#121212] border border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-lg">
                  {founderApp.icon ? (
                    <img src={founderApp.icon.startsWith('/') ? `http://localhost:8001${founderApp.icon}` : founderApp.icon} alt={founderApp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-400 font-black text-xl">{founderApp.name[0]}</span>
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-600/20 px-3 py-1 rounded-full border border-indigo-500/30">
                  App Founder
                </span>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-3">
              <h2 className="text-white font-black text-xl leading-tight">
                Bem-vindo à comunidade! 👋
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Você acabou de entrar. Seu primeiro passo é testar o <span className="text-white font-bold">{founderApp.name}</span> — o app fundador da comunidade. Reporte bugs, ganhe UpzPoints e suba no ranking.
              </p>

              <div className="flex gap-3 bg-[#121212] rounded-xl p-3 mt-2">
                <div className="flex-1 text-center">
                  <div className="text-emerald-400 font-black font-mono text-lg">{formatPoints(founderApp.reward)}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">UpzPoints</div>
                </div>
                <div className="w-px bg-slate-800" />
                <div className="flex-1 text-center">
                  <div className="text-indigo-400 font-black font-mono text-lg">{founderApp.slots}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Vagas</div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowWelcomeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                Agora não
              </button>
              <Link
                href={`/apps/${founderApp.slug || founderApp.id}`}
                onClick={() => setShowWelcomeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold text-center transition-colors shadow-md shadow-indigo-600/20"
              >
                Testar agora
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Banner Missão Inicial ────────────────────── */}
      {latestRelease && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 to-[#1a1d21] border border-emerald-500/30 rounded-2xl px-4 py-5 md:px-6 shadow-lg shadow-emerald-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase border border-emerald-500/30 tracking-widest flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Missão Inicial
              </span>
              <h2 className="text-sm md:text-base font-black text-white">App Founder: É Golpe®</h2>
            </div>
            <p className="text-slate-400 text-[11px] md:text-xs">
              A forma mais rápida de ganhar UpzPoints. Aceite participar do teste, ache bugs e junte pontos para lançar sua própria campanha.
            </p>
          </div>
          <a
            href={latestRelease.firebase_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-emerald-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Participar do Teste ({latestRelease.version_name})
          </a>
        </div>
      )}

      <header className="overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d21]">
        <div className="relative px-5 py-6 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full border border-white/[0.035]" />
          <div className="pointer-events-none absolute -right-2 -top-14 h-48 w-48 rounded-full border border-white/[0.04]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">Comunidade UpzLab · espaço dos membros</span>
              </div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#f1f2f3] md:text-4xl">
                Engenharia melhora <span className="text-white/45">quando é compartilhada.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Troque experiências, mostre o que está construindo e ajude outros devs a resolver problemas reais.
              </p>
            </div>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#121212] transition hover:bg-emerald-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14m7-7H5" />
              </svg>
              Compartilhar com a comunidade
            </button>
          </div>
          <div className="relative mt-7 grid max-w-xl grid-cols-2 gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
            <div>
              <p className="font-mono text-lg font-semibold text-slate-100">{posts.length}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">contribuições</p>
            </div>
            <div>
              <p className="font-mono text-lg font-semibold text-slate-100">{apps.length}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">projetos da comunidade</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-mono text-lg font-semibold text-slate-100">{formatPoints(devUser?.points ?? 0)}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">seus UpzPoints</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-5">
      <section className="min-w-0">
      <nav aria-label="Filtrar publicações" className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#131516] p-2">
        {[
          ["all", "Tudo"],
          ["publicacao", "Conversas"],
          ["bug", "Bugs"],
          ["anomalia", "Anomalias"],
          ["code_fix", "Código"],
          ["update", "Atualizações"],
          ["fraude", "Segurança"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilterCategory(value)}
            aria-pressed={filterCategory === value}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
              filterCategory === value
                ? "bg-[#20242b] text-white"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {isLoadingFeed ? (
        <div className="space-y-4 md:space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#1a1d21] p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-32 bg-slate-800 rounded" />
                  <div className="h-2 w-20 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/60 rounded" />
              <div className="h-3 w-2/3 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      ) : mixedFeed.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#1a1d21] px-6 py-14 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">Ainda não há publicações nesta categoria</p>
          <p className="mt-2 text-sm text-slate-400">Inicie a conversa: compartilhe uma descoberta ou peça uma revisão técnica.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {mixedFeed.map((item, idx) => {
            if (item.type === 'app' || item.type === 'founder') {
              const app = item.data as BetaApp;
              const isFounder = item.type === 'founder';
              return (
                <article
                  key={`app-${app.id}-${idx}`}
                  className={`relative overflow-hidden rounded-2xl border transition-colors ${
                    isFounder 
                      ? 'border-emerald-300/20 bg-[#171c19] hover:border-emerald-300/35' 
                      : 'border-white/[0.09] bg-[#1a1d21] hover:border-white/20'
                  }`}
                >
                  {/* Badge de Destaque Extraordinário */}
                  <div className={`absolute top-0 right-0 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl z-10 backdrop-blur-md shadow-lg ${
                    isFounder ? "bg-emerald-600/90 border-b border-l border-emerald-500" : "bg-indigo-600/90 border-b border-l border-indigo-500"
                  }`}>
                    {isFounder ? "App da comunidade" : (app.boost_level ?? 0) > 0 ? "Em destaque" : "Projeto"}
                  </div>
    
                  {/* Header do Post */}
                  <div className="flex items-start justify-between gap-3 px-4 pt-6 pb-4 md:px-6 md:pt-7">
                    <Link href={`/apps/${app.slug || app.id}`} className="flex items-center gap-4 min-w-0 group cursor-pointer w-full">
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center font-black text-xl font-mono shrink-0 overflow-hidden shadow-xl transition-transform group-hover:scale-105 ${
                        isFounder ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400' : 'bg-indigo-900/50 border-indigo-500/50 text-indigo-400'
                      }`}>
                        <AppIcon iconUrl={app.icon} appName={app.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isFounder ? 'text-emerald-500' : 'text-indigo-500'}`}>
                          Campanha de Teste
                        </p>
                        <h2 className="text-xl md:text-2xl font-black text-white leading-none truncate group-hover:text-slate-200 transition-colors">
                          {app.name}
                        </h2>
                        <p className="text-xs font-mono text-slate-400 mt-1.5 truncate flex items-center gap-1.5">
                          Criado por {app.developer}
                          {(app.name.toLowerCase().includes("golpe") || app.slug?.includes("golpe")) && (
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-label="App Founder">
                              <path fillRule="evenodd" d="M6.267 3.441A11 11 0 0110 2c1.47 0 2.871.285 4.143.791l1.59 1.59A11 11 0 0118 10c0 1.47-.285 2.871-.791 4.143l-1.59 1.59A11 11 0 0110 18a11 11 0 01-4.143-.791l-1.59-1.59A11 11 0 012 10c0-1.47.285-2.871.791-4.143l1.59-1.59zM13.707 8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </p>
                      </div>
                    </Link>
                  </div>
    
                  {/* Cover Photo (Se existir) */}
                  {app.cover_url && (
                    <div className="w-full aspect-video sm:h-64 md:h-80 overflow-hidden bg-black/50 border-y border-slate-800/50">
                      <img 
                        src={app.cover_url.startsWith('/') ? `http://localhost:8001${app.cover_url}` : app.cover_url} 
                        alt={`${app.name} cover`} 
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" 
                      />
                    </div>
                  )}
    
                  {/* Conteúdo do Post */}
                  <div className="px-4 pb-4 md:px-6 space-y-4 mt-5">
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line border-l-2 border-slate-700 pl-3">
                      {app.description}
                    </p>
                    
                    {/* Recompensas Banner Inline */}
                    <div className="flex gap-3 mt-4">
                      <div className="flex-1 bg-[#121212] border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Recompensa</span>
                        <span className="text-emerald-400 font-black font-mono text-sm md:text-base">{formatPoints(app.reward)} PTS</span>
                      </div>
                      <div className="flex-1 bg-[#121212] border border-indigo-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Vagas</span>
                        <span className="text-indigo-400 font-black font-mono text-sm md:text-base">{app.slots}</span>
                      </div>
                    </div>
                  </div>
    
                  {/* Footer/Ação */}
                  <div className="px-4 py-3 md:px-5 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded font-bold uppercase">{app.category}</span>
                    </div>
                    <Link href={`/apps/${app.slug || app.id}`}>
                      <button className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center gap-2 ${
                          isFounder
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                        }`}>
                          {app.is_tester ? "Ver App" : "Testar App"}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </Link>
                  </div>
                </article>
              );
            } else {
              const post = item.data as DevPost;
              return (
                <div key={`post-${post.id}-${idx}`} className="flex flex-col relative">
                  <article
                    className={`relative z-10 overflow-hidden rounded-2xl border transition-colors ${
                      post.authorName === 'UpzLab Team' 
                        ? 'border-white/15 bg-[#17191b] hover:border-white/25' 
                        : 'border-white/[0.09] bg-[#1a1d21] hover:border-white/20'
                    }`}
                  >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 md:px-5 md:pt-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl border flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                        post.authorName === 'UpzLab Team'
                          ? 'bg-white/[0.08] border-white/15 text-white'
                          : 'bg-white/[0.05] border-white/10 text-slate-200'
                      }`}>
                        {post.authorName === 'UpzLab Team' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        ) : (
                          (post.authorName || "Dev").split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DEV"
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/lab/${post.authorUsername || (post.authorName === 'UpzLab Team' ? 'upzlabteam' : 'dev')}`} className="truncate text-sm font-semibold leading-none text-slate-100 transition-opacity hover:opacity-80">
                            {post.authorName || "Dev Tester"}
                          </Link>
                          {post.authorName === 'UpzLab Team' && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-slate-300">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                              Oficial
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                          {post.date}
                          {post.category && post.category !== "publicacao" && (
                            <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[8px] font-bold uppercase ml-1">{post.category}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Menu 3 pontos — só aparece pro autor do post */}
                    {post.db_id && devUser?.id && post.user_id === devUser.id && (
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                          </svg>
                        </button>
                        {openMenuPostId === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
                            {confirmDeletePostId === post.id ? (
                              <div className="p-3 text-center animate-in fade-in zoom-in-95 duration-200">
                                <span className="block text-xs font-bold text-slate-300 mb-2">Excluir post?</span>
                                <div className="flex gap-2">
                                  <button onClick={() => setConfirmDeletePostId(null)} className="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">Não</button>
                                  <button onClick={async () => {
                                    setConfirmDeletePostId(null);
                                    setOpenMenuPostId(null);
                                    await deletePost(post.db_id!);
                                  }} className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)]">Sim</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setEditDescription(post.description);
                                    setOpenMenuPostId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeletePostId(post.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors border-t border-slate-700/50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Deletar
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
    
                  {/* Description & Image */}
                  <div className="px-4 pb-3 md:px-5">
                    {post.title && post.description && !post.description.startsWith(post.title) && post.title !== "Anomalia sem título" && (
                      <h2 className="text-sm md:text-base font-bold text-white leading-snug mb-2">
                        {post.title}
                      </h2>
                    )}
                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                      <TextWithMentions text={post.description} />
                    </div>
                    {post.imageUrl && typeof post.imageUrl === 'string' && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-slate-700">
                        <img 
                          src={post.imageUrl.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}${post.imageUrl}` : post.imageUrl} 
                          alt="Post attachment" 
                          className="w-full object-cover max-h-96" 
                        />
                      </div>
                    )}
                  </div>
    
                  {/* Code Snippet */}
                  {post.codeSnippet && (
                    <div className="mx-4 mb-3 md:mx-5 bg-[#121212] border border-slate-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Trecho de código
                        </span>
                      </div>
                      <div className="overflow-x-auto p-3">
                        <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                          <code>{post.codeSnippet}</code>
                        </pre>
                      </div>
                    </div>
                  )}
    

                  {/* Footer */}
                  <div className="px-4 py-3 md:px-5 border-t border-slate-800/60 flex items-center justify-between bg-slate-900/30">
                    <div className="flex gap-4">
                      <button
                        onClick={() => likePost(post.id)}
                        disabled={post.hasLiked}
                        className={`flex items-center gap-1.5 transition-colors group ${post.hasLiked ? "text-indigo-500 cursor-default" : "text-slate-400 hover:text-indigo-500"}`}
                      >
                        <svg className={`w-4 h-4 transition-transform ${!post.hasLiked && "group-hover:scale-110"}`} fill={post.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2" />
                        </svg>
                        <span className="text-xs font-mono font-bold">{post.likes} curtiu</span>
                      </button>

                      <button
                        onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                        className={`flex items-center gap-1.5 transition-colors group ${expandedPostId === post.id ? "text-emerald-400" : "text-slate-400 hover:text-emerald-400"}`}
                      >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-mono font-bold">{post.commentsCount || 0} Comentários</span>
                      </button>
                    </div>
                  </div>

                  {/* Last Comment Preview (Moved below footer) */}
                  {!expandedPostId && post.lastComment && (
                    <div className="px-4 py-3 md:px-5 border-t border-slate-800/60 bg-slate-900/50">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        <span className="font-bold text-slate-300 mr-1">{post.lastComment.authorName}:</span>
                        {post.lastComment.body}
                      </p>
                    </div>
                  )}
                </article>

                {/* Render the Inline Comments if expanded */}
                {expandedPostId === post.id && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-300 -mt-4 pt-6 z-0">
                    <div className="bg-[#0f1523] border border-slate-800/80 rounded-b-2xl shadow-xl overflow-hidden">
                      <InlineComments post={post} />
                    </div>
                  </div>
                )}
              </div>
              );
            }
          })}
        </div>
      )}
      </section>

      <aside aria-label="Informações da comunidade" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/[0.09] bg-[#1a1d21] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Seu espaço</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] font-mono text-xs font-bold text-slate-200">
              {(devUser?.name || "Dev").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{devUser?.name || "Desenvolvedor"}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{formatPoints(devUser?.points ?? 0)} UpzPoints</p>
            </div>
          </div>
          {devUser?.username ? (
            <Link
              href={`/lab/${devUser.username}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Abrir meu perfil
            </Link>
          ) : (
            <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs leading-5 text-slate-500">
              Seu perfil técnico ainda não tem um identificador público.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#1a1d21] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Princípios da comunidade</p>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-400">
            <li className="flex gap-2.5"><span className="font-mono text-slate-600">01</span><span>Compartilhe contexto, código e o que já tentou.</span></li>
            <li className="flex gap-2.5"><span className="font-mono text-slate-600">02</span><span>Critique ideias com respeito; ajude pessoas a evoluir.</span></li>
            <li className="flex gap-2.5"><span className="font-mono text-slate-600">03</span><span>Dê crédito às contribuições de outros devs.</span></li>
          </ul>
        </section>

        <Link href="/sdk" className="group block rounded-2xl border border-white/[0.09] bg-[#1a1d21] p-5 transition hover:border-white/20">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Construa junto</span>
          <h2 className="mt-2 text-sm font-semibold text-slate-100">Integre o SDK UpzLab</h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">Leve o check-in diário para o seu app e acompanhe a integração.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-200">
            Ver guia de integração <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </aside>
      </div>

      {/* Overlay invisível para fechar menu de 3 pontos */}
      {openMenuPostId && (
        <div className="fixed inset-0 z-10" onClick={() => { setOpenMenuPostId(null); setConfirmDeletePostId(null); }} />
      )}

      {/* Modal de Edição */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 md:pt-32 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1d21] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <h2 className="text-white font-black text-lg">Editar Publicação</h2>
              <button
                onClick={() => setEditingPost(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                {devUser?.name ? devUser.name[0].toUpperCase() : "D"}
              </div>
              <textarea
                autoFocus
                rows={5}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-base resize-none focus:outline-none"
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800/60 flex justify-end gap-3 bg-[#121212]/30">
              <button
                onClick={() => setEditingPost(null)}
                className="px-5 py-2 rounded-full text-slate-400 hover:text-white text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!editDescription.trim() || isSavingEdit}
                onClick={async () => {
                  if (!editingPost.db_id) return;
                  setIsSavingEdit(true);
                  await editPost(editingPost.db_id, editDescription.trim().slice(0, 80), editDescription.trim());
                  setIsSavingEdit(false);
                  setEditingPost(null);
                }}
                className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Publicação */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 md:pt-32 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1d21] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <h2 className="text-white font-black text-lg">Criar Publicação</h2>
              <button 
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex gap-4">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                {devUser?.name ? devUser.name[0].toUpperCase() : "D"}
              </div>
              
              {/* Text Area */}
              <div className="flex-1 flex flex-col gap-3">
                <textarea
                  autoFocus
                  rows={4}
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="No que você está pensando?"
                  className="w-full bg-transparent text-white placeholder-slate-500 text-lg md:text-xl resize-none focus:outline-none"
                />
                
                {/* Image Preview */}
                {postImage && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 w-full max-h-64 bg-black/50">
                    <img src={URL.createObjectURL(postImage)} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => setPostImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions (Image & Submit) */}
            <div className="px-5 py-3 border-t border-slate-800/60 flex items-center justify-between bg-[#121212]/30">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={(e) => setPostImage(e.target.files?.[0] || null)} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-colors group cursor-pointer"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold">Mídia</span>
              </button>

              <button
                disabled={(!postDescription.trim() && !postImage) || isPosting}
                onClick={async () => {
                  setIsPosting(true);
                  await addPost({
                    category: "publicacao",
                    title: "", // Posts da comunidade não usam título
                    description: postDescription,
                    hasImage: !!postImage,
                    authorName: devUser?.name || "Dev Community",
                  }, postImage);
                  setIsPosting(false);
                  setPostDescription("");
                  setPostImage(null);
                  setIsPostModalOpen(false);
                }}
                className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPosting ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
