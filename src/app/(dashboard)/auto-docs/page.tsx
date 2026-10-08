"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useComunidade } from '@/app/ComunidadeContext';
import { authHeaders } from '@/lib/auth';
import styles from './autodocs.module.css';

const API = "http://localhost:8001";
const ESTIMATED_SECS = 180; // ~3 min

type DocType = "educational" | "technical";

interface MyApp {
  id: string;
  slug: string;
  name: string;
}

interface QuotaInfo {
  used: number;
  max: number | null;
  is_staff: boolean;
  blocked: boolean;
  days_left: number;
}

export default function AutoDocsSetupPage() {
  const router = useRouter();
  const { devUser } = useComunidade();

  const [myApps, setMyApps] = useState<MyApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState("");
  const [docType, setDocType] = useState<DocType>("educational");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cota
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  // Timer de feedback pós-submissão
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(ESTIMATED_SECS);
  const [submittedAppName, setSubmittedAppName] = useState("");

  // Carrega os apps do dev
  useEffect(() => {
    if (!devUser?.id) return;
    fetch(`${API}/api/upzlab/campaigns/my-apps/${devUser.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setMyApps(d.data); })
      .catch(console.error);
  }, [devUser?.id]);

  // Carrega cota ao mudar app ou tipo de doc
  useEffect(() => {
    if (!selectedAppId) { setQuota(null); return; }
    setLoadingQuota(true);
    fetch(`${API}/api/auto-docs/quota?doc_type=${docType}&beta_product_id=${selectedAppId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setQuota(d))
      .catch(() => setQuota(null))
      .finally(() => setLoadingQuota(false));
  }, [selectedAppId, docType]);

  // Countdown após submissão
  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [submitted, countdown]);

  const selectedApp = myApps.find(a => a.id === selectedAppId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !githubUrl) {
      setError("Selecione um app e informe a URL do GitHub.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auto-docs/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          app_name: selectedApp.name,
          github_url: githubUrl,
          doc_type: docType,
          beta_product_id: parseInt(selectedAppId),
        }),
      });
      const json = await res.json();
      if (res.status === 401) throw new Error("Faça login para gerar documentação.");
      if (res.status === 409) throw new Error("Já existe uma documentação com esse nome.");
      if (res.status === 429) {
        const d = json.detail;
        throw new Error(typeof d === "object"
          ? `${d.message} Liberação em ${d.days_left} dia(s).`
          : String(d));
      }
      if (!res.ok) throw new Error(json.detail || "Erro ao iniciar geração.");

      setSubmittedAppName(selectedApp.name);
      setSubmitted(true);
      setCountdown(json.estimated_seconds || ESTIMATED_SECS);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Tela pós-submissão ──────────────────────────────────────────────────────
  if (submitted) {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    const progress = Math.max(0, Math.min(100, ((ESTIMATED_SECS - countdown) / ESTIMATED_SECS) * 100));

    return (
      <div className={styles.container}>
        <div className={styles.formCard} style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg style={{ width: 28, height: 28, color: "#10b981" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Documentação em geração!
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: 28, lineHeight: 1.6 }}>
            A IA está analisando o repositório de <strong style={{ color: "#e2e8f0" }}>{submittedAppName}</strong>.<br/>
            Você pode fechar esta tela — será notificado no sino quando concluir.
          </p>

          {/* Barra de progresso estimada */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 6, backgroundColor: "#1e293b", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#10b981", borderRadius: 9999, transition: "width 1s linear" }} />
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: 32 }}>
            {countdown > 0
              ? `Tempo estimado restante: ${mins}:${String(secs).padStart(2, "0")}`
              : "Isso está demorando mais que o esperado — a IA ainda está trabalhando."}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push(`/auto-docs/${encodeURIComponent(submittedAppName)}`)}
              style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "#022c22", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}
            >
              Acompanhar geração
            </button>
            <button
              onClick={() => router.push("/auto-docs/meus-docs")}
              style={{ padding: "10px 20px", backgroundColor: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
            >
              Meus Docs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ──────────────────────────────────────────────────────────────
  const isBlocked = quota?.blocked && !quota?.is_staff;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>DocsLab AI</h1>
        <p className={styles.subtitle}>
          Selecione um dos seus apps cadastrados e informe o repositório GitHub para gerar a documentação automaticamente com IA.
        </p>
      </header>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Seletor de app */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Seu Aplicativo</label>
            {myApps.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Você não tem apps cadastrados.{" "}
                <a href="/apps/novo" style={{ color: "#10b981" }}>Cadastrar agora →</a>
              </p>
            ) : (
              <select
                className={styles.input}
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">— Selecione um app —</option>
                {myApps.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Info de cota */}
          {selectedAppId && (
            <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#0f172a", border: "1px solid #1e293b", fontSize: "0.82rem" }}>
              {loadingQuota ? (
                <span style={{ color: "#64748b" }}>Verificando cota...</span>
              ) : quota?.is_staff ? (
                <span style={{ color: "#10b981" }}>✓ Conta staff — sem limites de geração.</span>
              ) : quota ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: quota.blocked ? "#f87171" : "#94a3b8" }}>
                    Tentativas utilizadas: <strong style={{ color: "#e2e8f0" }}>{quota.used}/{quota.max}</strong>
                    {quota.blocked && quota.days_left > 0 && (
                      <span style={{ color: "#f87171" }}> · Bloqueado por mais {quota.days_left} dia(s)</span>
                    )}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[...Array(quota.max || 3)].map((_, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: i < (quota.used || 0) ? "#f87171" : "#1e293b", border: "1px solid #334155" }} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* URL do repositório */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>URL do Repositório (GitHub)</label>
            <input
              type="url"
              className={styles.input}
              placeholder="Ex: https://github.com/usuario/repositorio"
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              disabled={loading || isBlocked}
              required
            />
          </div>

          {/* Tipo de doc */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Objetivo da documentação</label>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${docType === 'educational' ? styles.activeRadio : ''}`}>
                <input type="radio" name="docType" value="educational" checked={docType === 'educational'} onChange={() => setDocType('educational')} disabled={loading || isBlocked} />
                <div className={styles.radioContent}>
                  <strong>Manual Público (Educacional)</strong>
                  <span>Explica como usar o sistema. Sem jargões de código. Para usuários e testers.</span>
                </div>
              </label>
              <label className={`${styles.radioCard} ${docType === 'technical' ? styles.activeRadio : ''}`}>
                <input type="radio" name="docType" value="technical" checked={docType === 'technical'} onChange={() => setDocType('technical')} disabled={loading || isBlocked} />
                <div className={styles.radioContent}>
                  <strong>Doc Interna (Técnica)</strong>
                  <span>API, classes, funções, dependências. Privada para sua equipe.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Aviso de tempo */}
          <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", fontSize: "0.82rem", color: "#94a3b8", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <svg style={{ width: 16, height: 16, color: "#10b981", marginTop: 1, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>A geração leva ~2 a 3 minutos. Você pode fechar a tela após iniciar — será notificado no sino e por e-mail quando concluir.</span>
          </div>

          <div className={styles.submitRow}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || isBlocked || !selectedAppId || !githubUrl}
            >
              {loading ? "Iniciando..." : isBlocked ? `Bloqueado (${quota?.days_left} dias)` : "Gerar Documentação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
