"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useComunidade } from "../../../../ComunidadeContext";
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

export default function EditarAppPage() {
  const params = useParams();
  const router = useRouter();
  const { devUser } = useComunidade();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  const [formData, setFormData] = useState({
    nomeApp: "",
    descricaoApp: "",
    versao: "",
    categoria: "Utilitários",
    grupoGoogle: "",
    linkDownload: "",
    tiktokUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    iconeFile: null as File | null,
    capaFile: null as File | null,
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/upzlab/campaigns/app/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const app = data.data;
          // Segurança: se não for o dono, chuta de volta
          if (devUser && String(devUser.id) !== String(app.owner_id)) {
            setModalMessage("Acesso Negado. Você não é o dono deste aplicativo.");
            setTimeout(() => router.push("/apps"), 2000);
            return;
          }

          setFormData(prev => ({
            ...prev,
            nomeApp: app.name || "",
            descricaoApp: app.description || "",
            versao: app.version || "",
            categoria: app.category || "Utilitários",
            grupoGoogle: app.google_group || "",
            linkDownload: app.download_url || "",
            tiktokUrl: app.tiktok_url || "",
            facebookUrl: app.facebook_url || "",
            instagramUrl: app.instagram_url || "",
          }));
        } else {
          router.push("/apps");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, devUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append("nomeApp", formData.nomeApp);
      data.append("descricaoApp", formData.descricaoApp);
      data.append("versao", formData.versao);
      data.append("categoria", formData.categoria);
      data.append("grupoGoogle", formData.grupoGoogle);
      data.append("linkDownload", formData.linkDownload);
      data.append("tiktokUrl", formData.tiktokUrl);
      data.append("facebookUrl", formData.facebookUrl);
      data.append("instagramUrl", formData.instagramUrl);
      
      if (formData.iconeFile) {
        data.append("iconeFile", formData.iconeFile);
      }
      if (formData.capaFile) {
        data.append("capaFile", formData.capaFile);
      }

      const token = getToken();
      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/app/${params.id}`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      });

      const json = await res.json();
      
      if (json.success) {
        router.push(`/apps/${json.new_slug}`);
      } else {
        setModalMessage(json.message);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setModalMessage("Erro de conexão com o servidor!");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-400 p-8 text-center animate-pulse">Carregando formulário...</div>;

  if (!devUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 text-center py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Acesso Restrito</h2>
        <p className="text-slate-400 max-w-md mx-auto">Você precisa estar logado para editar aplicativos.</p>
        <Link href="/login" className="inline-block mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-indigo-600/30">
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <Link href={`/apps/${params.id}`} className="text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wide">
          ← Cancelar
        </Link>
      </div>

      <div className="bg-[#131D33]/90 border border-indigo-500/30 rounded-2xl p-6 shadow-lg shadow-indigo-900/10">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Editar Aplicativo</h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Atualize os dados e arquivos do seu aplicativo. Ao salvar, a página de detalhes será atualizada na hora.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#0A0E1A] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-indigo-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Detalhes do App
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Nome do App</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                value={formData.nomeApp}
                onChange={e => setFormData({...formData, nomeApp: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Categoria</label>
              <select 
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer text-sm"
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value})}
              >
                <option value="Produtividade & Trabalho">Produtividade & Trabalho</option>
                <option value="Utilitários & Ferramentas">Utilitários & Ferramentas</option>
                <option value="Finanças">Finanças</option>
                <option value="Comunicação & Redes Sociais">Comunicação & Redes Sociais</option>
                <option value="Entretenimento">Entretenimento</option>
                <option value="Jogos (Games)">Jogos (Games)</option>
                <option value="Saúde & Fitness">Saúde & Fitness</option>
                <option value="Educação">Educação</option>
                <option value="Fotografia & Vídeo">Fotografia & Vídeo</option>
                <option value="Estilo de Vida (Lifestyle)">Estilo de Vida (Lifestyle)</option>
                <option value="Compras (E-commerce)">Compras (E-commerce)</option>
                <option value="Comida & Bebida">Comida & Bebida</option>
                <option value="Viagens & Navegação">Viagens & Navegação</option>
                <option value="Negócios (Business)">Negócios (Business)</option>
                <option value="Notícias & Revistas">Notícias & Revistas</option>
                <option value="Personalização">Personalização</option>
                <option value="Ferramentas para Desenvolvedores">Ferramentas para Desenvolvedores</option>
                <option value="Segurança & Antivírus">Segurança & Antivírus</option>
                <option value="Casa Inteligente (IoT)">Casa Inteligente (IoT)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Versão Atual</label>
              <input 
                type="text"
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={formData.versao}
                onChange={e => setFormData({...formData, versao: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Descrição do Projeto</label>
              <textarea 
                rows={4}
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={formData.descricaoApp}
                onChange={e => setFormData({...formData, descricaoApp: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#0A0E1A] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-indigo-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Mídia & Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link de Download (Opcional)</label>
              <input 
                type="url"
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={formData.linkDownload}
                onChange={e => setFormData({...formData, linkDownload: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link Grupo de Teste (Opcional)</label>
              <input 
                type="url"
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={formData.grupoGoogle}
                onChange={e => setFormData({...formData, grupoGoogle: e.target.value})}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">TikTok (Opcional)</label>
                <input 
                  type="url"
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  placeholder="https://tiktok.com/@..."
                  value={formData.tiktokUrl}
                  onChange={e => setFormData({...formData, tiktokUrl: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Facebook (Opcional)</label>
                <input 
                  type="url"
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  placeholder="https://facebook.com/..."
                  value={formData.facebookUrl}
                  onChange={e => setFormData({...formData, facebookUrl: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Instagram (Opcional)</label>
                <input 
                  type="url"
                  className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                  placeholder="https://instagram.com/..."
                  value={formData.instagramUrl}
                  onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Novo Ícone (PNG/JPG)</label>
              <input 
                type="file" 
                accept="image/*"
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wide file:bg-slate-800 file:text-white hover:file:bg-slate-700 transition-all"
                onChange={e => setFormData({...formData, iconeFile: e.target.files?.[0] || null})}
              />
              <p className="text-[10px] text-slate-500 mt-1">Deixe em branco para manter o atual.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Nova Capa (PNG/JPG)</label>
              <input 
                type="file" 
                accept="image/*"
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wide file:bg-slate-800 file:text-white hover:file:bg-slate-700 transition-all"
                onChange={e => setFormData({...formData, capaFile: e.target.files?.[0] || null})}
              />
              <p className="text-[10px] text-slate-500 mt-1">Deixe em branco para manter a atual.</p>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
        >
          {isSubmitting ? "Salvando Alterações..." : "Salvar Alterações"}
        </button>
      </form>

      {/* Modal de Erro */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131D33] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white">Atenção</h3>
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
