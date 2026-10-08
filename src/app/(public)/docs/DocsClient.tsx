"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './docs.module.css';
import { slugify } from './utils';
import { escapeHtml } from '../../../lib/markdown';

interface FaqDoc {
  id: number;
  title: string;
  content: string;
  category: string;
}

type GroupedDocs = Record<string, FaqDoc[]>;

interface DocsClientProps {
  activeSlug?: string;
}

export default function DocsClient({ activeSlug }: DocsClientProps) {
  const [docs, setDocs] = useState<GroupedDocs | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch("http://localhost:8001/api/docs/faq");
        if (!res.ok) {
          throw new Error("Erro ao buscar a documentação");
        }
        const data = await res.json();
        setDocs(data);
      } catch (err: any) {
        setError(err.message || "Erro desconhecido");
      }
    }
    
    fetchDocs();
  }, []);

  // Filtra o documento ativo se houver um slug
  let activeDoc: FaqDoc | null = null;
  if (docs && activeSlug) {
    for (const category of Object.values(docs)) {
      const found = category.find(doc => slugify(doc.title) === activeSlug);
      if (found) {
        activeDoc = found;
        break;
      }
    }
  }

  return (
    <div className={styles.layout}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <Link href="/docs" style={{textDecoration: 'none'}}>
            <h2 className={styles.sidebarTitle}>UpzLab Docs</h2>
        </Link>
        
        {!docs && <div style={{color: '#8b949e'}}>Carregando menu...</div>}
        
        {docs && Object.entries(docs).map(([category, articles]) => (
          <div key={`nav-${category}`} className={styles.sidebarCategory}>
            <div className={styles.sidebarCategoryTitle}>{category}</div>
            {articles.map(article => {
              const slug = slugify(article.title);
              const isActive = slug === activeSlug;
              return (
                <Link 
                  key={`link-${article.id}`} 
                  href={`/docs/${slug}`} 
                  className={styles.sidebarLink}
                  style={isActive ? { backgroundColor: '#21262d', color: '#ffffff' } : {}}
                >
                  {article.title}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        
        {error && <div style={{color: 'red', textAlign: 'center'}}>{error}</div>}

        {!docs && !error && (
          <div className={styles.loading}>Buscando documentação oficial...</div>
        )}

        {/* MODO ARTIGO ÚNICO */}
        {docs && activeSlug && activeDoc && (
            <article className={styles.docCard}>
              <h1 className={styles.title}>{activeDoc.title}</h1>
              <div 
                className={styles.docContent} 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(activeDoc.content) }} 
              />
            </article>
        )}

        {/* MODO TODOS OS ARTIGOS (HOME DO DOCS) */}
        {docs && !activeSlug && (
            <>
                <header className={styles.header}>
                    <h1 className={styles.title}>Base de Conhecimento</h1>
                    <p className={styles.subtitle}>Tudo o que você precisa saber sobre a comunidade e nossos recursos.</p>
                </header>
                {Object.entries(docs).map(([category, articles]) => (
                <section key={category} className={styles.categorySection}>
                    <h2 className={styles.categoryTitle}>{category}</h2>
                    
                    {articles.map((article) => (
                    <article key={article.id} className={styles.docCard}>
                        <h3 className={styles.docTitle}>{article.title}</h3>
                        <div 
                        className={styles.docContent} 
                        dangerouslySetInnerHTML={{ __html: formatMarkdown(article.content) }} 
                        />
                    </article>
                    ))}
                </section>
                ))}
            </>
        )}

        {docs && activeSlug && !activeDoc && (
            <div className={styles.loading}>Artigo não encontrado.</div>
        )}
      </main>
    </div>
  );
}

function formatMarkdown(text: string): string {
  if (!text) return "";
  // Escapa HTML do usuário antes das substituições (anti-XSS).
  let formatted = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
  return formatted;
}
