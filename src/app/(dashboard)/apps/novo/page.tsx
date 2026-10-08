"use client";

import React, { useState } from "react";
import { useComunidade } from "../../../ComunidadeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authHeaders } from "../../../../lib/auth";

const API_BASE = "http://localhost:8001";

export default function CriarCampanhaPage() {
  const { devUser, formatPoints } = useComunidade();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [formData, setFormData] = useState({
    nomeApp: "",
    packageId: "",
    descricaoApp: "",
    versao: "",
    categoria: "Produtividade & Trabalho",
    iconeFile: null as File | null,
    capaFile: null as File | null,
    grupoGoogle: "",
    linkDownload: "",
    tiktokUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    recompensaBase: 500,
    vagas: 20,
    exigeTelefone: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const data = new FormData();
      data.append("nomeApp", formData.nomeApp);
      data.append("packageId", formData.packageId);
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
      if (devUser?.id) {
        data.append("dev_id", devUser.id.toString());
      }

      const res = await fetch(`${API_BASE}/api/upzlab/campaigns/create-app`, {
        method: "POST",
        body: data, // Sem Content-Type, o browser coloca o multipart boundary sozinho
        headers: authHeaders(), // O backend exige JWT para publicar (dono vem do token)
      });

      const json = await res.json();
      
      if (json.success) {
        // Redireciona para o Feed
        router.push("/");
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

  if (!devUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 text-center py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Acesso Restrito</h2>
        <p className="text-slate-400 max-w-md mx-auto">Sua sessão expirou ou você não está logado. Por motivos de segurança, cadastre-se ou faça login para publicar aplicativos na comunidade.</p>
        <Link href="/login" className="inline-block mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-indigo-600/30">
          Fazer Login / Cadastrar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-[#131D33]/90 border border-indigo-500/30 rounded-2xl p-6 shadow-lg shadow-indigo-900/10">
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Cadastrar Novo App</h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Registre seu aplicativo na vitrine do UpzLab. Depois de cadastrado, você poderá criar missões de teste para ele.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Painel Principal */}
        <div className="bg-[#0A0E1A] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-mono text-indigo-400 font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Detalhes do Seu App
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Nome do App</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                placeholder="Ex: Meu Novo App Indie"
                value={formData.nomeApp}
                onChange={e => setFormData({...formData, nomeApp: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Package ID (Play Store)</label>
              <input 
                type="text" 
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono text-sm"
                placeholder="com.suaempresa.app"
                value={formData.packageId}
                onChange={e => setFormData({...formData, packageId: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Descrição do App</label>
            <textarea 
              required
              rows={2}
              className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 resize-none text-sm"
              placeholder="Descreva brevemente o que seu aplicativo faz para atrair testadores..."
              value={formData.descricaoApp}
              onChange={e => setFormData({...formData, descricaoApp: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Versão</label>
              <input 
                type="text" 
                required
                maxLength={30}
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                placeholder="Ex: 1.0.0-beta"
                value={formData.versao}
                onChange={e => setFormData({...formData, versao: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Categoria</label>
              <select 
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer text-sm"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Upload de Ícone</label>
              <div className="flex items-center gap-3 bg-[#131D33] border border-slate-700 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 transition-all cursor-pointer"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({...formData, iconeFile: e.target.files[0]});
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Imagem de Capa</label>
              <div className="flex items-center gap-3 bg-[#131D33] border border-slate-700 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:bg-emerald-600/20 file:text-emerald-400 hover:file:bg-emerald-600/30 transition-all cursor-pointer"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({...formData, capaFile: e.target.files[0]});
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link do Grupo (Google Groups)</label>
              <input 
                type="url" 
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="https://groups.google.com/g/..."
                value={formData.grupoGoogle}
                onChange={e => setFormData({...formData, grupoGoogle: e.target.value})}
              />
              <p className="text-[10px] text-slate-500">Obrigatório para testes fechados da Play Store.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link para Baixar</label>
              <input 
                type="url" 
                required
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="Link da Play Store ou URL do APK"
                value={formData.linkDownload}
                onChange={e => setFormData({...formData, linkDownload: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">TikTok (Opcional)</label>
              <input 
                type="url" 
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="https://tiktok.com/@..."
                value={formData.tiktokUrl}
                onChange={e => setFormData({...formData, tiktokUrl: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Facebook (Opcional)</label>
              <input 
                type="url" 
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="https://facebook.com/..."
                value={formData.facebookUrl}
                onChange={e => setFormData({...formData, facebookUrl: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Instagram (Opcional)</label>
              <input 
                type="url" 
                className="w-full bg-[#131D33] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 text-sm"
                placeholder="https://instagram.com/..."
                value={formData.instagramUrl}
                onChange={e => setFormData({...formData, instagramUrl: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-3 justify-end pt-4">
          <Link 
            href="/"
            className="flex-1 md:flex-none text-center px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all"
          >
            Cancelar
          </Link>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wide transition-all shadow-lg shadow-indigo-600/30 border border-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Salvando...</span>
              </>
            ) : (
              "Adicionar à Vitrine"
            )}
          </button>
        </div>
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
