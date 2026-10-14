"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useComunidade } from "../../../ComunidadeContext";
import InlineComments from "../../InlineComments";
import TextWithMentions from "../../../components/TextWithMentions";

const API_BASE = "http://localhost:8001";

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

import { useParams } from "next/navigation";
import { authHeaders } from "@/lib/auth";
import { isVideoPost } from "@/lib/media";
import Avatar from "@/components/Avatar";

export default function ComunidadePerfilPage() {
  const { devUser, refreshDevUser, deletePost, editPost } = useComunidade();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDelId, setConfirmDelId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const params = useParams();
  const routeUsernameRaw = params?.username as string;
  const routeUsername = routeUsernameRaw ? decodeURIComponent(routeUsernameRaw) : "";
  const cleanRouteUsername = routeUsername ? routeUsername.replace('lab/', '') : "";

  const isOwnProfile = !cleanRouteUsername || cleanRouteUsername === "perfil" || cleanRouteUsername === devUser?.username;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio]   = useState("");
  const [saving, setSaving] = useState(false);
  
  const [publicProfile, setPublicProfile] = useState<any>(null);
  const [loadingPublic, setLoadingPublic] = useState(!isOwnProfile);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [activeTab, setActiveTab] = useState("Posts");
  const [myPosts, setMyPosts]         = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (isOwnProfile && devUser) { 
      setName(devUser.name || ""); 
      setUsername(devUser.username || "");
      setBio(devUser.bio || ""); 
    }
  }, [devUser, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile && cleanRouteUsername) {
      setLoadingPublic(true);
      fetch(`${API_BASE}/api/dev/auth/public/${cleanRouteUsername}`, { headers: authHeaders() })
        .then(r => r.json())
        .then(d => { if (d.success) setPublicProfile(d.data); })
        .catch(console.error)
        .finally(() => setLoadingPublic(false));
    }
  }, [isOwnProfile, routeUsername]);

  useEffect(() => {
    const targetUserId = isOwnProfile ? devUser?.id : publicProfile?.id;
    if (activeTab === "Posts" && targetUserId) {
      setLoadingPosts(true);
      fetch(`${API_BASE}/api/upzlab/beta-feedback/comunidade/feed/me?dev_id=${targetUserId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setMyPosts(d.data); })
        .catch(console.error)
        .finally(() => setLoadingPosts(false));
    }
  }, [activeTab, devUser?.id, isOwnProfile, publicProfile?.id]);

  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const overviewUser = isOwnProfile ? devUser?.username : cleanRouteUsername;
  useEffect(() => {
    if (!overviewUser || activeTab === "Posts") return;
    setLoadingOverview(true);
    fetch(`${API_BASE}/api/dev/auth/public/${overviewUser}/overview`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setOverview(d.data); })
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  }, [overviewUser, activeTab]);
  const gh = overview?.github;

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const postAvatar = async (path: string, body?: FormData) => {
    const t = getToken();
    const res = await fetch(`${API_BASE}/api/dev/auth/profile/${path}`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body,
    });
    if (res.ok) await refreshDevUser();
    else {
      const j = await res.json().catch(() => null);
      alert(j?.detail || "Não foi possível atualizar a foto.");
    }
  };

  const handleAvatarFile = async (file: File) => {
    setShowAvatarMenu(false);
    const fd = new FormData();
    fd.append("avatar", file);
    await postAvatar("avatar", fd);
  };

  const handleUseGithubAvatar = async () => {
    setShowAvatarMenu(false);
    const t = getToken();
    if (!devUser?.github_connected) {
      if (t && confirm("Conectar o GitHub para usar sua foto de perfil?")) {
        window.location.href = `${API_BASE}/api/dev/auth/github/login?action=connect&token=${t}`;
      }
      return;
    }
    await postAvatar("github-avatar");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getToken();
      
      // Salva perfil normal
      const res = await fetch(`${API_BASE}/api/dev/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, bio }),
      });
      
      // Salva username separado se foi alterado
      if (res.ok && username !== devUser?.username) {
        if (!username || username.match(/^[a-z0-9_\.]+$/)) {
          await fetch(`${API_BASE}/api/upzlab/mentions/username?username=${encodeURIComponent(username)}`, {
            method: "PUT",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } else {
          alert("Username inválido! Use apenas letras minúsculas, números, '_' e '.'");
        }
      }
      
      if (res.ok) { await refreshDevUser(); setIsEditing(false); }
      else alert("Erro ao salvar o perfil.");
    } catch { alert("Erro ao salvar."); }
    finally { setSaving(false); }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setCoverPreview(URL.createObjectURL(file));
    try {
      const token = getToken();
      const fd = new FormData();
      fd.append("cover", file);
      const res = await fetch(`${API_BASE}/api/dev/auth/profile/cover`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success) await refreshDevUser();
      else alert("Erro ao enviar capa.");
    } catch { alert("Erro de conexão."); }
    finally { setUploadingCover(false); }
  };

  const getInitials = (n: string) => {
    if (!n) return "DT";
    return n.split(" ").map((x: string) => x[0]).join("").slice(0, 2).toUpperCase();
  };

  const targetUser = isOwnProfile ? devUser : publicProfile;

  if (loadingPublic || (isOwnProfile && !devUser)) return <div className="p-8 text-white">Carregando perfil...</div>;
  if (!targetUser) return <div className="p-8 text-white flex flex-col items-center justify-center pt-20"><h2 className="text-xl font-bold text-slate-400">Desenvolvedor não encontrado</h2></div>;

  const isStaff  = targetUser.is_staff === true;
  const coverUrl = isOwnProfile && coverPreview ? coverPreview : (targetUser.coverUrl ? `${API_BASE}${targetUser.coverUrl}` : null);

  return (
    <div className="w-full max-w-4xl mx-auto pb-20 space-y-6">

      {/* ── HEADER ─────────────────────────── */}
      <div className={`rounded-2xl border overflow-hidden shadow-xl ${isStaff ? "border-emerald-500/30" : "border-slate-800"}`}>

        {/* Capa */}
        <div className="relative h-36 md:h-52 group">
          {coverUrl
            ? <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
            : <div className={`w-full h-full ${isStaff ? "bg-gradient-to-r from-emerald-900/70 via-teal-900/40 to-[#0A0E1A]" : "bg-gradient-to-r from-slate-900 to-[#131D33]"}`} />
          }
          {isOwnProfile && (
            <>
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center cursor-pointer"
                onClick={() => coverInputRef.current?.click()}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 rounded-xl px-4 py-2 backdrop-blur-sm">
                  {uploadingCover
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  }
                  <span className="text-xs font-bold text-white">Alterar capa</span>
                </div>
              </div>
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
            </>
          )}

          {isStaff && (
            <div className="absolute top-3 left-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Conta Oficial UpzLab</span>
            </div>
          )}

          <div className="absolute bottom-3 right-4">
            {isOwnProfile && (
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={saving}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-full font-bold text-xs transition-colors">
                {saving ? "Salvando..." : isEditing ? "Salvar" : "Editar Perfil"}
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className={`px-5 pb-5 ${isStaff ? "bg-gradient-to-br from-[#0D1F2D] to-[#0A0E1A]" : "bg-[#0A0E1A]"}`}>
          <div className="relative">

            {/* Avatar */}
            <div className="absolute -top-12 md:-top-14 p-1 bg-[#0A0E1A] rounded-full inline-block group/avatar cursor-pointer">
              <img src={targetUser.avatarUrl || "/favicon.svg?v=5"} alt="Avatar" className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-2 object-cover bg-[#0d0d0d] ${isStaff ? "border-emerald-500" : "border-slate-700"}`} />
              {isOwnProfile && (
                <div className="absolute inset-0 m-1 rounded-full bg-black/0 group-hover/avatar:bg-black/50 transition-all flex items-center justify-center"
                  onClick={() => setShowAvatarMenu(v => !v)}>
                  <svg className="w-6 h-6 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              {isOwnProfile && showAvatarMenu && (
                <div className="absolute left-0 top-full mt-2 z-30 w-56 rounded-xl bg-[#0F1629] border border-slate-700 shadow-xl p-1 text-sm text-slate-200" onClick={e => e.stopPropagation()}>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800" onClick={() => avatarInputRef.current?.click()}>Enviar do computador</button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800" onClick={handleUseGithubAvatar}>
                    {devUser?.github_connected ? "Usar foto do GitHub" : "Conectar GitHub e usar foto"}
                  </button>
                  {devUser?.is_staff && (
                    <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800" onClick={async () => { setShowAvatarMenu(false); await postAvatar("avatar/official"); }}>Usar ícone oficial UpzLab</button>
                  )}
                </div>
              )}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = ""; }} />
            </div>

            {/* Cabeçalho do Perfil (Nome, Medalhas, Integrações) */}
            <div className="pt-14 md:pt-16">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Esquerda: Nome e Medalhas */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {isEditing && isOwnProfile
                        ? <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu Nome"
                            className="text-xl font-black text-white bg-[#131D33] border border-slate-700 focus:border-emerald-500 rounded-lg px-2 py-1 focus:outline-none w-64" />
                        : <h1 className="text-xl md:text-2xl font-black text-white">{targetUser.name}</h1>
                      }
                      {isStaff && (
                        <svg className="w-5 h-5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Conta Oficial">
                          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {isEditing && isOwnProfile
                      ? <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono text-sm">{"lab/"}</span>
                          <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} placeholder="username"
                            className="text-sm font-mono text-emerald-400 bg-[#131D33] border border-slate-700 focus:border-emerald-500 rounded-lg px-2 py-1 focus:outline-none w-48" />
                        </div>
                      : (targetUser.username && <p className="text-sm font-mono text-emerald-400">{"lab/"}{targetUser.username}</p>)
                    }
                  </div>

                  {/* Medalhas (Entre o nome e integrações) */}
                  <div className="flex items-center gap-1 border-l border-slate-700/50 pl-3">
                    {isStaff ? (
                      <>
                        <div title="Scanner" className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-600/50 flex items-center justify-center text-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.15)] group relative cursor-help">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <div title="White Hat" className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.25)] group relative cursor-help">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div title="Bug Hunter" className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.25)] group relative cursor-help">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.83L19.17 19H4.83L12 5.83zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z" /></svg>
                        </div>
                        <div title="Cyber Ninja" className="w-7 h-7 rounded-lg bg-amber-900/40 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.25)] group relative cursor-help">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div title="Fundador" className="w-7 h-7 rounded-lg bg-emerald-900/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)] group relative cursor-help">
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                        </div>
                      </>
                    ) : (
                      targetUser.badges?.map((badge: string, i: number) => (
                        <div key={i} title={badge} className="w-6 h-6 rounded bg-indigo-900/40 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                          {badge.charAt(0)}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Direita: Integrações */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {!(targetUser.github_connected || targetUser.github_account_age_days) ? (
                    isOwnProfile && (
                      <button onClick={() => { const t = getToken(); if (t) window.location.href = `${API_BASE}/api/dev/auth/github/login?action=connect&token=${t}`; }}
                        title="Conectar GitHub" className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center border border-slate-600 transition-colors">
                        <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                      </button>
                    )
                  ) : (
                    <div title="GitHub Conectado" className="w-7 h-7 rounded-lg bg-emerald-900/20 flex items-center justify-center border border-emerald-500/30 text-emerald-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                  <button title="LinkedIn (em breve)" className="w-7 h-7 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50 opacity-40 cursor-not-allowed">
                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-1.5">
                <span className="font-bold text-slate-300">{targetUser.role || 'Membro'}</span> · {targetUser.rankPosition > 0 ? `#${targetUser.rankPosition}º` : "Staff"} · {targetUser.points?.toLocaleString() || 0} UpzPoints
              </p>

              {isEditing && isOwnProfile ? (
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                  className="mt-2 w-full bg-[#131D33] text-white text-sm p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Fale sobre você..." />
              ) : (
                <p className="mt-2 text-slate-300 text-sm leading-relaxed">{targetUser.bio || "Nenhuma biografia informada."}</p>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────── */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        {["Posts", "Conquistas", "Apps Testados", "Visão Geral"].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-emerald-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── POSTS ────────────────────────────── */}
      {activeTab === "Posts" && (
        <div className="space-y-4">
          {loadingPosts ? (
            <div className="text-center py-10 text-slate-500 text-sm animate-pulse">Carregando posts...</div>
          ) : myPosts.length === 0 ? (
            <div className="bg-[#0A0E1A] p-10 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-400 text-sm font-bold">Nenhum post ainda.</p>
            </div>
          ) : (
            myPosts.map((post: any, idx: number) => (
              <article key={`${post.id}-${idx}`}
                className={`relative rounded-2xl border transition-colors ${isStaff ? "border-white/15 bg-[#17191b] hover:border-white/25" : "border-white/[0.09] bg-[#1a1d21] hover:border-white/20"}`}>
                <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 md:px-5 md:pt-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar url={targetUser.avatarUrl} name={targetUser.name} size={10} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold leading-none text-slate-100">{targetUser.name}</p>
                        {isStaff && <svg className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Conta Oficial"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.491 4.491 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>}
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{post.time}</p>
                    </div>
                  </div>
                  {isOwnProfile && post.db_id && (
                    <div className="relative shrink-0">
                      <button onClick={() => { setMenuId(menuId === post.db_id ? null : post.db_id); setConfirmDelId(null); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                      </button>
                      {menuId === post.db_id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => { setMenuId(null); setConfirmDelId(null); }} />
                          <div className="absolute right-0 top-full mt-1 w-40 bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
                            {confirmDelId === post.db_id ? (
                              <div className="p-3 text-center">
                                <span className="block text-xs font-bold text-slate-300 mb-2">Excluir post?</span>
                                <div className="flex gap-2">
                                  <button onClick={() => setConfirmDelId(null)} className="flex-1 py-1.5 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg">Não</button>
                                  <button onClick={async () => {
                                    await deletePost(post.db_id);
                                    setMyPosts((l: any[]) => l.filter(x => x.db_id !== post.db_id));
                                    setConfirmDelId(null); setMenuId(null);
                                  }} className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg">Sim</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(post.db_id); setEditText(post.description || ""); setMenuId(null); }} className="w-full px-3 py-2.5 text-left text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white">Editar</button>
                                <button onClick={() => setConfirmDelId(post.db_id)} className="w-full px-3 py-2.5 text-left text-xs font-bold text-rose-400 hover:bg-rose-950/40 border-t border-slate-700/50">Deletar</button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-3">
                  {post.title && <h2 className="text-sm font-bold text-white mb-2">{post.title}</h2>}
                  {editingId === post.db_id ? (
                    <div className="space-y-2">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-700 bg-black/30 p-2 text-sm text-white focus:outline-none" />
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black" onClick={async () => {
                          const t = editText.trim(); if (!t) return;
                          await editPost(post.db_id, t.slice(0, 80), t);
                          setMyPosts((l: any[]) => l.map(x => x.db_id === post.db_id ? { ...x, title: t.slice(0, 80), description: t } : x));
                          setEditingId(null);
                        }}>Salvar</button>
                        <button className="rounded-lg px-3 py-1.5 text-xs text-slate-300" onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed"><TextWithMentions text={post.description} /></div>
                  )}

                  {/* Imagem do post */}
                  {post.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700">
                      {isVideoPost(post) ? (
                        <video src={post.imageUrl.startsWith("/") ? `${API_BASE}${post.imageUrl}` : post.imageUrl} controls preload="metadata" playsInline className="w-full max-h-96 bg-black" />
                      ) : (
                        <img
                          src={post.imageUrl.startsWith("/") ? `${API_BASE}${post.imageUrl}` : post.imageUrl}
                          alt="Post attachment"
                          className="w-full object-cover max-h-96"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Code Snippet */}
                {post.codeSnippet && (
                  <div className="mx-4 mb-3 bg-[#0A0E1A] border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Trecho de código</span>
                    </div>
                    <div className="overflow-x-auto p-3">
                      <pre className="font-mono text-xs text-slate-200 leading-relaxed"><code>{post.codeSnippet}</code></pre>
                    </div>
                  </div>
                )}

                <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-900/30 flex items-center gap-4">
                  <span className="text-xs font-mono text-slate-400">{post.likes || 0} curtidas</span>
                  <button
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors group"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs font-mono font-bold">{post.commentsCount || 0} Comentários</span>
                  </button>
                </div>

                {/* Comentários inline */}
                {expandedPostId === post.id && <InlineComments post={post} />}
              </article>
            ))
          )}
        </div>
      )}

      {/* ── VISÃO GERAL ──────────────────────── */}
      {activeTab === "Visão Geral" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["Pontos", overview?.points ?? targetUser.points ?? 0],
              ["Feedbacks", overview?.feedbacks ?? 0],
              ["Bugs", overview?.bugs ?? 0],
              ["Apps testados", overview?.tested_apps?.length ?? 0],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-[#0A0E1A] p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-xl font-bold text-white">{Number(value).toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-[#0A0E1A] p-4 rounded-xl border border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Experiência no GitHub</h2>
            {loadingOverview ? (
              <p className="text-xs text-slate-500">Carregando...</p>
            ) : !gh ? (
              <p className="text-xs text-slate-500 italic">GitHub não conectado.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-300">
                  {gh.login && <a href={gh.url} target="_blank" rel="noreferrer" className="font-bold text-white hover:underline">@{gh.login}</a>}
                  <span>{gh.years} {gh.years === 1 ? "ano" : "anos"} no GitHub</span>
                  <span>{gh.public_repos} repositórios</span>
                  <span>{gh.stars} estrelas</span>
                  <span>{gh.followers} seguidores</span>
                  {gh.company && <span>{gh.company}</span>}
                  {gh.location && <span>{gh.location}</span>}
                </div>
                {gh.languages.length > 0 && (
                  <div className="space-y-1.5">
                    {gh.languages.map((l: any) => (
                      <div key={l.name} className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-slate-300 font-mono truncate">{l.name}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded"><div className="h-full bg-violet-500 rounded" style={{ width: `${l.percent}%` }} /></div>
                        <span className="w-9 text-right text-slate-500">{l.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {targetUser.bio && (
            <div className="md:col-span-2 bg-[#0A0E1A] p-4 rounded-xl border border-slate-800">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sobre</h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{targetUser.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* ── APPS TESTADOS ──────────────────────── */}
      {activeTab === "Apps Testados" && (
        loadingOverview ? (
          <div className="p-10 text-center text-slate-500 text-sm">Carregando...</div>
        ) : !overview?.tested_apps?.length ? (
          <div className="bg-[#0A0E1A] p-10 rounded-xl border border-slate-800 text-center">
            <p className="text-slate-400 text-sm font-bold">Nenhum app testado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {overview.tested_apps.map((a: any) => (
              <Link key={a.id} href={`/apps/${a.slug}`} className="flex items-center gap-3 bg-[#0A0E1A] p-3 rounded-xl border border-slate-800 hover:border-slate-600">
                <img src={a.icon ? (a.icon.startsWith("http") ? a.icon : `${API_BASE}${a.icon}`) : "/favicon.svg?v=5"} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-800" onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.svg?v=5"; }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ── CONQUISTAS ──────────────────────── */}
      {activeTab === "Conquistas" && (
        loadingOverview ? (
          <div className="p-10 text-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(overview?.achievements || []).map((c: any) => (
              <div key={c.id} className={`p-3 rounded-xl border bg-[#0A0E1A] ${c.unlocked ? "border-violet-500/40" : "border-slate-800 opacity-50"}`}>
                <p className="text-sm font-bold text-white">{c.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                <p className={`text-[10px] mt-1.5 uppercase tracking-wider ${c.unlocked ? "text-violet-400" : "text-slate-600"}`}>{c.unlocked ? "Desbloqueada" : "Bloqueada"}</p>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
