"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useComunidade } from "../../ComunidadeContext";
import MentionTextarea from "../../components/MentionTextarea";

const TIPOS = [
  {
    value: "bug",
    label: "Bug",
    desc: "Comportamento inesperado ou falha no sistema",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "rose",
    points: "+100 a +1000 pts",
  },
  {
    value: "anomalia",
    label: "Anomalia",
    desc: "Padrão técnico suspeito ou inconsistência de dados",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: "amber",
    points: "+100 a +500 pts",
  },
  {
    value: "code_fix",
    label: "Sugestão de Fix",
    desc: "Melhoria de código, performance ou segurança",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    color: "blue",
    points: "+50 pts",
  },
  {
    value: "fraude",
    label: "Padrão de Fraude",
    desc: "Comportamento fraudulento ou suspeito detectado",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "purple",
    points: "+100 a +500 pts",
  },
];

const COLOR_MAP: Record<string, string> = {
  rose:   "border-rose-500/40 bg-rose-500/10 text-rose-400",
  amber:  "border-amber-500/40 bg-amber-500/10 text-amber-400",
  blue:   "border-blue-500/40 bg-blue-500/10 text-blue-400",
  purple: "border-purple-500/40 bg-purple-500/10 text-purple-400",
};

const COLOR_ACTIVE: Record<string, string> = {
  rose:   "border-rose-500 ring-2 ring-rose-500/20",
  amber:  "border-amber-500 ring-2 ring-amber-500/20",
  blue:   "border-blue-500 ring-2 ring-blue-500/20",
  purple: "border-purple-500 ring-2 ring-purple-500/20",
};

export default function PostarPage() {
  const router = useRouter();
  const { addPost, devUser, recentApps } = useComunidade();

  const [tipo, setTipo] = useState<string>("bug");
  const [appId, setAppId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [codigo, setCodigo] = useState("");
  
  // QA Fields
  const [deviceOs, setDeviceOs] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [uxRating, setUxRating] = useState<number>(5);

  const [imagem, setImagem] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const tipoSelecionado = TIPOS.find(t => t.value === tipo)!;

  const handleSubmit = async () => {
    if (!appId) {
      alert("Por favor, selecione um app para reportar.");
      return;
    }
    if (!titulo.trim() || !descricao.trim()) return;
    setEnviando(true);
    try {
      await addPost({
        category: tipo as any,
        title: titulo.trim(),
        description: descricao.trim(),
        codeSnippet: codigo.trim() || undefined,
        deviceOs: deviceOs.trim() || undefined,
        stepsToReproduce: stepsToReproduce.trim() || undefined,
        uxRating: uxRating,
        hasImage: !!imagem,
        authorName: devUser?.name || "Dev",
        productId: appId,
      }, imagem);
      setSucesso(true);
      setTimeout(() => router.push("/"), 2000);
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white font-black text-xl">Reportado com sucesso!</h2>
        <p className="text-slate-400 text-sm">Seu report foi enviado. O admin irá avaliar e você ganha UpzPoints quando aprovado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl px-5 py-5">
        <h1 className="text-lg font-black text-white">Reportar Bug / Anomalia</h1>
        <p className="text-slate-400 text-xs mt-1">
          Relate um problema técnico, anomalia ou padrão de fraude em um app. Se aprovado pelo admin, você ganha UpzPoints automaticamente.
        </p>
      </div>

      {/* Seletor de tipo */}
      <div className="grid grid-cols-2 gap-3">
        {TIPOS.map(t => (
          <button
            key={t.value}
            onClick={() => setTipo(t.value)}
            className={`relative p-4 rounded-2xl border text-left transition-all bg-[#131D33] ${
              tipo === t.value
                ? COLOR_ACTIVE[t.color]
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-3 ${COLOR_MAP[t.color]}`}>
              {t.icon}
            </div>
            <p className="text-sm font-bold text-white">{t.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
            <span className={`absolute top-3 right-3 text-[9px] font-mono font-bold ${COLOR_MAP[t.color]} px-2 py-0.5 rounded-full border`}>
              {t.points}
            </span>
          </button>
        ))}
      </div>

      {/* Formulário */}
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-5 space-y-4">

        {/* Seleção do App */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Selecione o App *
          </label>
          <select
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
          >
            <option value="" disabled>-- Selecione um App --</option>
            {recentApps?.map(app => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
        </div>

        {/* Título */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Título *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder={`Ex: ${tipo === "bug" ? "App trava ao abrir câmera" : tipo === "anomalia" ? "Race condition no banco SQLite" : tipo === "code_fix" ? "Otimização de carregamento WebP" : "Padrão de login suspeito detectado"}`}
            maxLength={120}
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Descrição do Problema *
          </label>
          <MentionTextarea
            rows={3}
            value={descricao}
            onValueChange={setDescricao}
            placeholder="Descreva o problema de forma clara (use } para mencionar alguém...)"
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-colors"
          />
        </div>

        {/* --- DADOS ESTRUTURADOS DE QA --- */}
        {(tipo === 'bug' || tipo === 'anomalia') && (
          <div className="p-4 bg-[#0A0E1A]/50 border border-indigo-500/20 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Dados Estruturados de Teste
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Dispositivo e OS (Opcional, mas recomendado)
              </label>
              <input
                type="text"
                value={deviceOs}
                onChange={e => setDeviceOs(e.target.value)}
                placeholder="Ex: Android 14 / Samsung Galaxy S23"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Passos para Reproduzir (Steps to Reproduce)
              </label>
              <textarea
                rows={3}
                value={stepsToReproduce}
                onChange={e => setStepsToReproduce(e.target.value)}
                placeholder="1. Abra a tela X&#10;2. Clique no botão Y&#10;3. O app fecha inesperadamente"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none resize-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Avaliação de UX/UI (1 a 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setUxRating(num)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                      uxRating === num 
                        ? 'bg-indigo-600 text-white border-indigo-500' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    } border`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Código (opcional) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Trecho de código
            <span className="text-slate-600 normal-case font-normal">(opcional)</span>
          </label>
          <textarea
            rows={5}
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            placeholder="// Cole aqui o trecho de código relevante..."
            spellCheck={false}
            className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-emerald-300 placeholder-slate-600 focus:outline-none resize-none font-mono transition-colors"
          />
        </div>

        {/* Imagem */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            Screenshot
            <span className="text-slate-600 normal-case font-normal">(opcional)</span>
          </label>
          {imagem ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/50">
              <img src={URL.createObjectURL(imagem)} alt="Preview" className="w-full max-h-48 object-contain" />
              <button
                onClick={() => setImagem(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl cursor-pointer transition-colors group">
              <svg className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                Clique para anexar uma imagem (PNG, JPG, WebP)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={e => setImagem(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>
      </div>

      {/* Aviso de pontos */}
      <div className="flex items-start gap-3 bg-indigo-900/20 border border-indigo-500/20 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-400 leading-relaxed">
          Você ganha <span className="text-white font-bold">{tipoSelecionado.points}</span> quando o admin aprovar este report.
          Quanto mais crítico o bug, mais pontos. Seja preciso na descrição para maximizar sua recompensa.
        </p>
      </div>

      {/* Botão enviar */}
      <button
        disabled={!titulo.trim() || !descricao.trim() || enviando}
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {enviando ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Enviar Report
          </>
        )}
      </button>

    </div>
  );
}
