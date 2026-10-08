import React from 'react';
import Link from 'next/link';
import LinkPreview from './LinkPreview';

export default function TextWithMentions({ text }: { text?: string }) {
  if (!text) return null;
  
  // Regex to extract urls
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];

  // Regex to split by lab/username and urls
  const parts = text.split(/(lab\/[a-zA-Z0-9_\.]+|https?:\/\/[^\s]+)/g);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith('lab/')) {
            const username = part.substring(4);
            return (
              <Link 
                key={i} 
                href={`/lab/${username}`} 
                className="text-emerald-400 hover:text-emerald-300 font-mono drop-shadow-[0_0_5px_rgba(16,185,129,0.3)] transition-all"
              >
                {part}
              </Link>
            );
          }
          if (part.match(urlRegex)) {
            let trackedUrl = part;
            try {
              const u = new URL(part);
              if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'upzlab_community');
              if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'post_link');
              trackedUrl = u.toString();
            } catch(e) {}

            return (
              <a key={i} href={trackedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {part}
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>

      {urls.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {urls.map((url, idx) => (
            <LinkPreview key={idx} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
