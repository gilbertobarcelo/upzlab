"use client";

import React, { useEffect, useState } from 'react';
import styles from './public-docs.module.css';
import { escapeHtml } from '../../../lib/markdown';
import { authHeaders } from '../../../lib/auth';

interface DocFile {
  id: number;
  file_path: string;
  content: string;
}

interface AppData {
  app_id: number;
  app_name: string;
  status: string;
  doc_type?: string;
  github_url: string;
  is_owner?: boolean;
  files: DocFile[];
}

// Parser Markdown robusto para a documentação gerada pela IA
function formatMarkdown(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      html.push(`<ul>${listBuffer.map(i => `<li>${i}</li>`).join("")}</ul>`);
      listBuffer = [];
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // Code block fence
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        flushList();
        html.push('<pre><code>');
        inCodeBlock = true;
      } else {
        html.push('</code></pre>');
        inCodeBlock = false;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line) + "\n");
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      flushList();
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      flushList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      flushList();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.match(/^[-*] /)) {
      // Lista
      inList = true;
      const item = inlineMd(line.slice(2));
      listBuffer.push(item);
    } else if (line.match(/^\d+\. /)) {
      // Lista numerada
      flushList();
      const item = inlineMd(line.replace(/^\d+\. /, ""));
      html.push(`<ol><li>${item}</li></ol>`);
    } else if (line.trim() === "") {
      flushList();
      html.push('<br/>');
    } else {
      flushList();
      html.push(`<p>${inlineMd(line)}</p>`);
    }
  }

  flushList();
  if (inCodeBlock) html.push('</code></pre>');

  // Junta <ol> consecutivos
  return html.join("\n")
    .replace(/<\/ol>\n<ol>/g, "")
    .replace(/<br\/>\n<br\/>/g, "<br/>");
}

// Formata inline markdown: bold, italic, code, links
function inlineMd(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

export default function PublicDocsLabClient({ appName, isPreview = false }: { appName: string, isPreview?: boolean }) {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [error, setError] = useState("");
  const [activeFileId, setActiveFileId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch(`http://localhost:8001/api/auto-docs/${encodeURIComponent(appName)}/files`, { headers: authHeaders() });
        if (!res.ok) {
          if (res.status === 404 || res.status === 401) throw new Error("Documentação não encontrada.");
          throw new Error("Erro ao carregar os dados.");
        }
        
        const data = await res.json();
        
        // Se a documentação não estiver publicada, podemos bloquear o acesso, ou apenas avisar
        if (!isPreview && data.status !== 'published') {
          throw new Error("Esta documentação ainda não foi publicada pelo desenvolvedor.");
        }

        setAppData(data);
        if (data.files && data.files.length > 0) {
          setActiveFileId(data.files[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchDocs();
  }, [appName]);

  if (error) {
    return (
      <div className={styles.loading}>
        <div style={{textAlign: 'center'}}>
          <svg style={{width: 48, height: 48, color: '#f85149', marginBottom: 16}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h2>Ops! {error}</h2>
        </div>
      </div>
    );
  }

  if (!appData) {
    return <div className={styles.loading}>Carregando a documentação oficial...</div>;
  }

  const activeFile = appData.files.find(f => f.id === activeFileId);

  const handlePublish = async () => {
    try {
      const res = await fetch(`http://localhost:8001/api/auto-docs/${encodeURIComponent(appName)}/publish`, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) {
        alert('Erro ao publicar');
        return;
      }
      window.close();
      // Se a aba nao puder ser fechada (nao foi aberta via script), volta para o console do app
      window.location.href = `/auto-docs/${encodeURIComponent(appName)}`;
    } catch (e) {
      alert('Erro ao publicar');
    }
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.appTitle}>{appData.app_name}</h2>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <span className={styles.appStatus}>
              {isPreview ? 'Pré-visualização' : 'DocsLab Oficial'}
            </span>
            {appData.doc_type === "technical" && (
              <span style={{ display: "inline-block", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 12, backgroundColor: "rgba(248,81,73,0.15)", color: "#f85149", border: "1px solid rgba(248,81,73,0.3)" }}>
                Interna
              </span>
            )}
            {appData.doc_type !== "technical" && (
              <span style={{ display: "inline-block", fontSize: "0.75rem", padding: "2px 8px", borderRadius: 12, backgroundColor: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}>
                Pública
              </span>
            )}
          </div>
          {isPreview && appData.status !== 'published' && (
            <button
              id="preview-publish-btn"
              onClick={handlePublish}
              style={{ display: 'block', width: '100%', marginTop: '12px', padding: '10px', backgroundColor: '#238636', color: '#ffffff', border: '1px solid rgba(240, 246, 252, 0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Salvar e Publicar
            </button>
          )}
        </div>
        
        <div className={styles.fileList}>
          {appData.files.map(file => (
            <button 
              key={file.id} 
              className={`${styles.fileItem} ${activeFileId === file.id ? styles.activeFile : ''}`}
              onClick={() => setActiveFileId(file.id)}
            >
              <svg style={{width: 16, height: 16, display: 'inline-block', marginRight: 8, verticalAlign: 'middle'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {file.file_path.split('/').pop()}
            </button>
          ))}
        </div>

      </aside>

      <main className={styles.mainContent}>
        {activeFile ? (
          <div className={styles.docContainer}>
            <div className={styles.fileName}>
              <span>{activeFile.file_path}</span>
            </div>
            <div 
              className={styles.docContent}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(activeFile.content) }} 
            />
          </div>
        ) : (
          <div style={{color: '#8a9199', textAlign: 'center', marginTop: '100px'}}>
            Selecione um tópico no menu lateral para começar a ler.
          </div>
        )}
      </main>
    </div>
  );
}
