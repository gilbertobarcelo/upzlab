"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authHeaders } from "../../../../../lib/auth";

export default function ConfiguracoesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [appData, setAppData] = useState({
    name: "",
    description: "",
    version: "",
    package_id: "",
    category: "",
    google_group: "",
    download_url: "",
    tiktok_url: "",
    facebook_url: "",
    instagram_url: ""
  });

  useEffect(() => {
    fetch(`http://localhost:8001/api/upzlab/campaigns/app/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          const d = json.data;
          setAppData({
            name: d.name || "",
            description: d.description || "",
            version: d.version || "",
            package_id: d.package_id || "",
            category: d.category || "",
            google_group: d.google_group || "",
            download_url: d.download_url || "",
            tiktok_url: d.tiktok_url || "",
            facebook_url: d.facebook_url || "",
            instagram_url: d.instagram_url || ""
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    
    try {
      const form = new FormData();
      form.append("nomeApp", appData.name);
      form.append("descricaoApp", appData.description);
      form.append("versao", appData.version);
      form.append("categoria", appData.category);
      if (appData.package_id) form.append("packageId", appData.package_id);
      form.append("grupoGoogle", appData.google_group);
      form.append("linkDownload", appData.download_url);
      form.append("tiktokUrl", appData.tiktok_url);
      form.append("facebookUrl", appData.facebook_url);
      form.append("instagramUrl", appData.instagram_url);
      
      const res = await fetch(`http://localhost:8001/api/upzlab/campaigns/app/${id}`, {
        method: "PUT",
        headers: authHeaders(), // O backend exige JWT (dono/staff) para editar
        body: form
      });
      const json = await res.json();
      
      if (json.success) {
        setSuccessMsg("Configurações salvas com sucesso!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert("Erro: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400 font-mono p-6">Carregando configurações...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="bg-[#131D33]/60 p-8 rounded-2xl border border-slate-800/80 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Configurações do Aplicativo
        </h2>
        
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold rounded-lg font-mono">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Nome do App</label>
              <input 
                type="text" required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                value={appData.name} onChange={e => setAppData({...appData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Versão Atual</label>
              <input 
                type="text" required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-mono"
                value={appData.version} onChange={e => setAppData({...appData, version: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Package ID</label>
              <input
                type="text" placeholder="com.empresa.app"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-mono"
                value={appData.package_id} onChange={e => setAppData({...appData, package_id: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Descrição do App</label>
            <textarea 
              required rows={2}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm resize-none"
              value={appData.description} onChange={e => setAppData({...appData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link (Google Groups)</label>
              <input 
                type="url" required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                value={appData.google_group} onChange={e => setAppData({...appData, google_group: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Link para Baixar</label>
              <input 
                type="url" required
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                value={appData.download_url} onChange={e => setAppData({...appData, download_url: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex justify-end">
            <button 
              type="submit" disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="p-5 bg-rose-500/5 rounded-xl border border-rose-500/20">
            <h3 className="text-sm font-bold text-rose-400 mb-2">Zona de Perigo</h3>
            <p className="text-xs text-slate-500 font-mono mb-4">Pausar testes esconde o aplicativo da comunidade temporariamente. Excluir irá apagá-lo definitivamente.</p>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-amber-500/30 hover:bg-amber-500/10 text-amber-500 font-bold rounded-lg text-xs uppercase transition-colors">
                Pausar Testes
              </button>
              <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs uppercase transition-colors">
                Excluir Aplicativo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
