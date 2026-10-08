import React, { useEffect, useState } from 'react';

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  url: string;
}

export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <div className="w-full mt-2 p-3 border border-slate-700/50 rounded-xl bg-slate-800/30 animate-pulse flex gap-3">
        <div className="w-20 h-20 bg-slate-700/50 rounded-lg shrink-0"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Se não houver imagem, nem descrição, e o título for igual à URL (ou vazio), não mostra o card para não parecer duplicado.
  const isTitleJustUrl = data?.title.includes(data.url.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  if (error || !data || (!data.image && !data.description && (!data.title || isTitleJustUrl))) return null;

  let trackedUrl = data.url;
  try {
    const u = new URL(data.url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'upzlab_community');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'link_preview');
    trackedUrl = u.toString();
  } catch(e) {}

  return (
    <a href={trackedUrl} target="_blank" rel="noopener noreferrer" className="block w-full mt-2 border border-slate-700 rounded-xl overflow-hidden bg-slate-800/30 transition-colors">
      {data.image && (
        <div className="w-full aspect-[1.91/1] overflow-hidden border-b border-slate-700 bg-slate-900/50">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{data.title}</h4>
        {data.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{data.description}</p>}
        <div className="text-[10px] text-emerald-500/70 mt-2 flex items-center gap-1 font-mono">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {new URL(data.url).hostname}
        </div>
      </div>
    </a>
  );
}
