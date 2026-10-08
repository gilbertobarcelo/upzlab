"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useComunidade } from "../../../ComunidadeContext";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

const AppIcon = ({ iconUrl, appName }: { iconUrl: string, appName: string }) => {
  const [error, setError] = useState(false);
  const isValidUrl = iconUrl && (iconUrl.startsWith("/") || iconUrl.startsWith("http"));
  const src = iconUrl.startsWith("/") ? `http://localhost:8001${iconUrl}` : iconUrl;

  if (!isValidUrl || error) {
    return <span className="opacity-80 uppercase font-black text-2xl">{appName.charAt(0)}</span>;
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

export default function AppDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devUser } = useComunidade();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  useEffect(() => {
    let url = `${API_BASE}/api/upzlab/campaigns/app/${params.id}`;
    if (devUser?.id) {
      url += `?dev_id=${devUser.id}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setApp(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, devUser]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${params.id}`, {
        method: "DELETE",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        router.push("/apps");
      } else {
        setDeleteError("Erro ao deletar: " + data.message);
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Erro ao deletar o app. Verifique sua conexão.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Carregando detalhes do app...</div>;
  }

  if (!app) {
    return <div className="text-slate-400 p-8 text-center">App não encontrado.</div>;
  }

  const handleApply = async () => {
    if (!devUser?.id) {
      setModalMessage("Você precisa estar logado para se candidatar.");
      return;
    }
    setIsApplying(true);
    try {
      const data = new FormData();
      data.append("dev_id", devUser.id.toString());
      
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${params.id}/follow`, {
        method: "POST",
        body: data
      });
      const json = await res.json();
      if (json.success) {
        setApp({...app, is_tester: true});
        setModalMessage("Você agora é um testador deste aplicativo!");
      } else {
        setModalMessage(json.message);
      }
    } catch (err) {
      setModalMessage("Erro de conexão ao se cadastrar.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleUnapply = async () => {
    if (!devUser?.id) {
      setModalMessage("Você precisa estar logado para deixar de ser testador.");
      return;
    }
    
    setIsApplying(true);
    try {
      const data = new FormData();
      data.append("dev_id", devUser.id.toString());
      
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${params.id}/unfollow`, {
        method: "POST",
        body: data
      });
      const json = await res.json();
      if (json.success) {
        setApp({...app, is_tester: false});
        setModalMessage("Você deixou de ser testador.");
        setShowUnfollowModal(false);
      } else {
        setModalMessage(json.message);
      }
    } catch (err) {
      setModalMessage("Erro de conexão.");
    } finally {
      setIsApplying(false);
    }
  };

  const isOwner = devUser ? (String(devUser.id) === String(app.owner_id) || String(devUser.id) === String(app.owner_user_id)) : false;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Ações */}
      <div className="flex items-center justify-end mb-4">
        {isOwner && (
          <div className="flex flex-wrap gap-3">
            <Link href={`/studio/${params.id}`}>
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                App Studio
              </button>
            </Link>
            <Link href={`/apps/${params.id}/editar`}>
              <button className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-lg text-white font-bold text-xs uppercase transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Editar
              </button>
            </Link>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-900/20 hover:bg-red-600 border border-red-900/50 hover:border-red-500 rounded-lg text-red-400 hover:text-white font-bold text-xs uppercase transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Capa e Info Principal */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Imagem de Capa */}
        <div className="h-48 md:h-64 bg-[#0A0E1A] w-full relative">
          {app.cover && (app.cover.startsWith("/") || app.cover.startsWith("http")) ? (
            <img 
              src={app.cover.startsWith("/") ? `http://localhost:8001${app.cover}` : app.cover} 
              alt="Capa do App" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900/30 to-slate-900 flex items-center justify-center text-slate-700 font-black uppercase text-xl">
              SEM CAPA
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#131D33] to-transparent"></div>
        </div>
        
        {/* Perfil e Detalhes */}
        <div className="px-6 md:px-10 pb-10 relative">
          <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-12 md:-mt-16 mb-8 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-[#0A0E1A] border-4 border-[#131D33] flex items-center justify-center text-indigo-400 shrink-0 overflow-hidden shadow-xl">
              <AppIcon iconUrl={app.icon} appName={app.name} />
            </div>
            <div className="flex-grow flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-indigo-900/30 text-indigo-400 border border-indigo-500/20 text-xs font-bold mb-2">
                  {app.category}
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white flex items-center gap-3">
                  {app.name}
                  {app.is_tester && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-lg text-xs font-bold shadow-sm">
                      Testador Ativo
                    </span>
                  )}
                </h1>
                <p className="text-slate-400 font-mono text-sm mt-1">Por {app.developer}</p>
              </div>
              
              {!isOwner && (
                <>
                  {!app.is_tester ? (
                    <button 
                      onClick={handleApply}
                      disabled={isApplying}
                      className="px-5 py-3 md:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-black text-xs md:text-sm rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-indigo-900/30 whitespace-nowrap"
                    >
                      {isApplying ? "Processando..." : "Ser um UpzTester"}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <Link href={`/apps/${params.id}/reportar`} className="w-full sm:w-auto">
                        <button className="w-full px-5 py-3 md:py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-xs md:text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 whitespace-nowrap flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          Reportar Anomalia
                        </button>
                      </Link>
                      <button 
                        onClick={() => setShowUnfollowModal(true)}
                        disabled={isApplying}
                        className="w-full sm:w-auto px-5 py-3 md:py-2.5 bg-slate-800/80 hover:bg-rose-900/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 font-black text-xs md:text-sm rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-black/20 whitespace-nowrap"
                      >
                        {isApplying ? "Processando..." : "Sair"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide border-b border-slate-800 pb-2 mb-3">
                  Sobre o Projeto
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {app.description}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              
              {/* Informações para Testadores */}
              {(app.download_url || app.google_group) && app.is_tester && (
                <div className="bg-indigo-900/20 rounded-xl p-5 border border-indigo-500/30">
                  <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-3">Acesso ao App</div>
                  <div className="flex flex-col gap-2">
                    {app.download_url && (
                      <a href={app.download_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Baixar App / TestFlight
                      </a>
                    )}
                    {app.google_group && (
                      <a href={app.google_group} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg text-xs font-bold transition-colors">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                        Entrar no Google Group
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-[#0A0E1A] rounded-xl p-5 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Recompensa Base</div>
                <div className="text-emerald-400 font-black font-mono text-xl">{app.reward} PTS</div>
              </div>
              
              {(app.tiktok_url || app.facebook_url || app.instagram_url) && (
                <div className="bg-[#0A0E1A] rounded-xl p-5 border border-slate-800 space-y-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Redes Sociais</div>
                  <div className="flex flex-wrap gap-2">
                    {app.tiktok_url && (
                      <a href={app.tiktok_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold transition-all">
                        TikTok
                      </a>
                    )}
                    {app.facebook_url && (
                      <a href={app.facebook_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition-all">
                        Facebook
                      </a>
                    )}
                    {app.instagram_url && (
                      <a href={app.instagram_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-pink-600 text-white text-xs font-bold transition-all">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-[#0A0E1A] rounded-xl p-5 border border-slate-800 space-y-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Versão</div>
                  <div className="text-slate-300 font-mono text-sm">{app.version || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Status</div>
                  <div className="text-indigo-400 font-bold text-sm">Em Teste</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-2">Excluir Aplicativo?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja deletar este app? Esta ação é irreversível e todos os dados serão perdidos.
            </p>
            
            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-bold">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir App"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unfollow Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-white mb-2">Sair do UpzTester?</h2>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja sair da equipe de testes? Você deixará de receber pontos de recompensa por reportar bugs neste aplicativo.
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <button 
                onClick={() => setShowUnfollowModal(false)}
                disabled={isApplying}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUnapply}
                disabled={isApplying}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isApplying ? "Saindo..." : "Sim, Sair do UpzTester"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131D33] border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white">Aviso</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {modalMessage}
            </p>
            <button 
              onClick={() => setModalMessage("")}
              className="w-full py-3 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wide transition-all"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
