"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './viewer.module.css';
import { authHeaders } from '../../../../lib/auth';

interface AutoDocFile {
  id: number;
  file_path: string;
  content: string;
}

interface AppDocs {
  app_id: number;
  app_name: string;
  status: string;
  doc_type?: string;
  github_url: string;
  error_message?: string | null;
  is_owner?: boolean;
  files: AutoDocFile[];
}

export default function ViewerClient({ appName }: { appName: string }) {
  const router = useRouter();
  const [appData, setAppData] = useState<AppDocs | null>(null);
  const [error, setError] = useState("");
  const [confirmFileId, setConfirmFileId] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const decodedAppName = decodeURIComponent(appName);

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (confirmFileId === null) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-delete-popover]')) setConfirmFileId(null);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setConfirmFileId(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [confirmFileId]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [appData?.files]);

  // Polling
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let cancelled = false;

    const fetchData = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`http://localhost:8001/api/auto-docs/${encodeURIComponent(decodedAppName)}/files`, { headers: authHeaders() });
        if (res.status === 401) throw new Error("Faça login para acessar esta documentação.");
        if (res.status === 404) throw new Error("Documentação não encontrada ou você não tem permissão para acessá-la.");
        if (!res.ok) throw new Error("Erro no servidor");
        const data: AppDocs = await res.json();
        if (cancelled) return;
        setAppData(data);
        if (data.status === 'pending' || data.status === 'processing') {
          timeout = setTimeout(fetchData, 3000);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    };

    fetchData();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [decodedAppName]);

  const handleDeleteFile = async (fileId: number) => {
    setDeletingFile(true);
    try {
      const res = await fetch(`http://localhost:8001/api/auto-docs/files/${fileId}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) setAppData(prev => prev ? { ...prev, files: prev.files.filter(f => f.id !== fileId) } : null);
    } finally { setDeletingFile(false); setConfirmFileId(null); }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`http://localhost:8001/api/auto-docs/${encodeURIComponent(decodedAppName)}/publish`, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) throw new Error("Erro ao publicar.");
      window.location.href = `/docslab/${encodeURIComponent(decodedAppName)}`;
    } catch (err: any) { alert(err.message); }
  };

  const handleRegenerate = async () => {
    if (!appData) return;
    setRegenerating(true);
    setShowRegenModal(false);
    try {
      const res = await fetch(`http://localhost:8001/api/auto-docs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          app_name: decodedAppName,
          github_url: appData.github_url,
          doc_type: appData.doc_type || 'educational',
        }),
      });
      if (!res.ok) throw new Error("Erro ao iniciar regeneração");
      setAppData(prev => prev ? { ...prev, status: 'processing', files: [] } : null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  // ── Estados de carregamento / processamento / erro ─────────────────────────

  if (error) return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h2>Erro</h2>
        <p>{error}</p>
        <Link href="/auto-docs" className={styles.backButton}>Voltar</Link>
      </div>
    </div>
  );

  if (!appData) return <div className={styles.loading}>Carregando painel...</div>;

  if (appData.status === 'pending' || appData.status === 'processing') return (
    <div className={styles.container}>
      <div className={styles.processingCard}>
        <div className={styles.spinner} />
        <h2 className={styles.processingTitle}>A IA está analisando seu código...</h2>
        <p className={styles.processingSubtitle}>Clonando <strong>{appData.github_url}</strong> e gerando documentação.</p>
        <div className={styles.terminal}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalWindowControls}>
              <span className={styles.dot} style={{ backgroundColor: '#ff5f56' }} />
              <span className={styles.dot} style={{ backgroundColor: '#ffbd2e' }} />
              <span className={styles.dot} style={{ backgroundColor: '#27c93f' }} />
              <span className={styles.terminalTitle}>upzlab-ai-worker ~ bash</span>
            </div>
            <Link href="/auto-docs" className={styles.cancelProcessingBtn}>Abortar (Ctrl+C)</Link>
          </div>
          <div className={styles.terminalBody} ref={terminalRef}>
            <div className={styles.logLine}><span className={styles.logTime}>[00:00:01]</span> <span className={styles.logInfo}>INFO</span> Conectando ao Github...</div>
            <div className={styles.logLine}><span className={styles.logTime}>[00:00:02]</span> <span className={styles.logInfo}>INFO</span> Repositório clonado com sucesso.</div>
            <div className={styles.logLine}><span className={styles.logTime}>[00:00:03]</span> <span className={styles.logInfo}>INFO</span> Iniciando varredura de arquivos...</div>
            {appData.files.map((f, i) => (
              <div key={f.id} className={styles.logLine}>
                <span className={styles.logTime}>[{String(i + 4).padStart(2, '0')}:00:00]</span>
                <span className={styles.logSuccess}>DONE</span> Gerado: <span className={styles.logPath}>{f.file_path}</span>
              </div>
            ))}
            <div className={styles.logLineBlinking}>
              <span className={styles.logTime}>[{String(appData.files.length + 4).padStart(2, '0')}:00:00]</span>
              <span className={styles.logWarning}>WAIT</span> Processando próximo arquivo<span className={styles.cursor}>_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (appData.status === 'error') return (
    <div className={styles.container}>
      <div className="max-w-xl mx-auto mt-16 bg-slate-900/80 border border-slate-700/70 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white">Não foi possível gerar a documentação</h2>
        <p className="text-sm text-slate-400 mt-2 break-words">{appData.error_message || 'Ocorreu um erro durante a geração.'}</p>
        <div className="flex gap-2 mt-6 flex-wrap">
          <button
            disabled={regenerating}
            onClick={handleRegenerate}
            className="text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {regenerating ? "Iniciando..." : "Tentar novamente"}
          </button>
          <Link href="/auto-docs/meus-docs" className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Meus Docs
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Visualização principal ──────────────────────────────────────────────────

  return (
    <div className={styles.wrapper}>

      {/* ── BANNER ── */}
      <div className={`${styles.previewBanner} ${appData.status === 'published' ? styles.publishedBanner : ''}`}>
        <div className={styles.bannerInfo}>
          {appData.status === 'published'
            ? <><svg className="w-4 h-4 shrink-0" style={{ color: '#3fb950' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><h3 className={styles.bannerTitle} style={{ color: '#3fb950' }}>Ativa</h3><p className={styles.bannerText}>Publicada e visível.</p></div></>
            : <><svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#d29922' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><h3 className={styles.bannerTitle}>Rascunho</h3><p className={styles.bannerText}>Gerada pela IA. Revise e publique.</p></div></>
          }
        </div>
        <div className={styles.bannerActions}>
          {appData.is_owner && (
            <button disabled={regenerating} onClick={handleRegenerate} className={styles.regenButton} title="Apaga tudo e gera novamente">
              {regenerating
                ? <><div className={styles.miniSpinner} /><span>Gerando...</span></>
                : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span>Regerar</span></>
              }
            </button>
          )}
          {appData.status === 'published'
            ? <Link href={`/docslab/${encodeURIComponent(decodedAppName)}`} target="_blank" className={styles.publishButton} style={{ backgroundColor: '#238636' }}>Ver Doc</Link>
            : <>
                <Link href={`/docslab/${encodeURIComponent(decodedAppName)}/preview`} target="_blank" className={styles.previewBtn}>Preview</Link>
                <button onClick={handlePublish} className={styles.publishButton}>Publicar</button>
              </>
          }
        </div>
      </div>

      {/* ── LISTA DE PÁGINAS ── */}
      <div className={styles.fileListSection}>
        <h2 className={styles.sectionTitle}>Páginas Geradas pela IA</h2>
        {appData.files.length === 0
          ? <p style={{ color: '#8a9199' }}>Nenhuma página gerada ainda.</p>
          : (
            <div className={styles.fileGrid}>
              {appData.files.map(file => (
                <div key={file.id} className={styles.fileRow}>
                  <div className={styles.fileRowLeft}>
                    <svg className={styles.fileIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <span className={styles.fileName}>{file.file_path}</span>
                  </div>
                  {appData.is_owner && (
                    <div className={styles.fileRowActions}>
                      <div className="relative" data-delete-popover>
                        <button
                          onClick={() => setConfirmFileId(confirmFileId === file.id ? null : file.id)}
                          className={styles.deleteFileBtn}
                        >
                          Excluir
                        </button>
                        {confirmFileId === file.id && (
                          <div className="absolute right-0 top-full mt-3 z-20 w-72 bg-slate-900/95 backdrop-blur border border-slate-700/70 rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in-95">
                            <div className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-slate-900 border-l border-t border-slate-700/70" />
                            <p className="text-sm font-semibold text-white mb-1">Excluir página</p>
                            <p className="text-sm text-slate-400 break-words">A página <span className="font-semibold text-slate-200">{file.file_path}</span> será removida permanentemente.</p>
                            <div className="flex justify-end gap-2 mt-4">
                              <button onClick={() => setConfirmFileId(null)} className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">Cancelar</button>
                              <button disabled={deletingFile} onClick={() => handleDeleteFile(file.id)} className="text-sm font-semibold text-white bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors">
                                {deletingFile ? 'Excluindo...' : 'Sim, excluir'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
