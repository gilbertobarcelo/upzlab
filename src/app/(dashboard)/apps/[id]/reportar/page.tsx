"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useComunidade } from "../../../../ComunidadeContext";

export default function ComunidadePostarPage() {
  const router = useRouter();
  const params = useParams();
  const { addPost, appVersion, devUser } = useComunidade();

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState(appVersion || "");
  const [authorName, setAuthorName] = useState(devUser?.name || "Dev Tester");
  const [category, setCategory] = useState<"anomalia" | "code_fix" | "fraude" | "bug">("anomalia");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState(false);
  const [appName, setAppName] = useState("");

  const unwrappedParams = params ? (React.use(params as any) as any) : { id: "" };
  
  useEffect(() => {
    // Busca o nome do app para exibição dinâmica
    const fetchApp = async () => {
      try {
        const res = await fetch(`http://localhost:8001/api/upzlab/campaigns/app/${unwrappedParams.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setAppName(json.data.name);
          }
        }
      } catch (err) {}
    };
    if (unwrappedParams.id) fetchApp();
  }, [unwrappedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPost({
      category,
      title: version ? `[${version}] ${title}` : title,
      description,
      codeSnippet: code || undefined,
      authorName: authorName,
      hasImage: false,
      implementation_id: unwrappedParams.id,
    });
    setSuccess(true);
    setTimeout(() => {
      router.push(`/apps/${unwrappedParams.id}`);
    }, 1000);
  };

  return (
    <div className="bg-[#131D33]/90 border-2 border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
      
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          SUBMISSÃO DE ANOMALIA / BUG
        </div>
        <h1 className="text-xl font-black text-white">Enviar Anomalia para Avaliação {appName ? `do ${appName}` : 'do App'}</h1>
        <p className="text-slate-400 text-xs mt-1">Ao enviar relatos com sugestões de correção ou logs detalhados, o fundador avalia no painel admin e concede até +300 pontos e medalhas de destaque.</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl font-mono text-xs flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Anomalia enviada com sucesso ao É Golpe! Redirecionando para o feed...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Título Resumido da Anomalia / Bug *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                className="w-24 bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-3 py-3 text-sm text-white focus:outline-none transition-all font-mono"
              />
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Exceção de Pointer em requisição paralela"
                className="flex-1 bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Categoria *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-mono"
            >
              <option value="anomalia">Anomalia de Código</option>
              <option value="code_fix">Sugestão de Fix</option>
              <option value="bug">Bug & Exceção</option>
              <option value="fraude">Padrão de Golpe/Fraude</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
            Seu Nome (Autor) *
          </label>
          <input
            type="text"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
            Descrição Detalhada & Comportamento Esperado *
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o cenário onde a falha ocorre, os passos para reproduzir e a utilidade da correção..."
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
            Trecho de Código ou Solução Proposta (Opcional)
          </label>
          <textarea
            rows={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Cole aqui o snippet em Kotlin, Go, Python ou TypeScript..."
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs text-emerald-400 font-mono focus:outline-none transition-all"
          />
        </div>

        {/* Upload Zone */}
        <div>
          <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
            Anexar Log de Erro ou Screenshot (Opcional)
          </label>
          <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 text-center cursor-pointer bg-[#0A0E1A]/50 transition-all">
            <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-mono text-slate-400 block">Arraste imagens PNG/WebP ou arquivos de log (.txt, .log)</span>
            <span className="text-[10px] text-slate-600 font-mono mt-1 block">Tamanho máximo: 10MB</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span>Enviar Relato para Avaliação</span>
        </button>
      </form>
    </div>
  );
}
