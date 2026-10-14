import React from 'react';
import Link from 'next/link';
import LinkPreview from './LinkPreview';

export default function TextWithMentions({ text }: { text?: string }) {
  if (!text) return null;
  
  // Regex to extract urls
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];

  // URLs primeiro, para que "#" e "@" dentro de links não virem menção/hashtag
  const parts = text.split(/(https?:\/\/[^\s]+|(?<![\w/])lab\/[a-zA-Z0-9_.]+|(?<![\w@])@[a-zA-Z0-9_.]+|(?<![\w&/#])#[\p{L}\p{N}_]{2,50})/gu);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith('#')) {
            return (
              <Link
                key={i}
                href={`/comunidade?tag=${encodeURIComponent(part.substring(1).toLowerCase())}`}
                className="text-violet-400 hover:text-violet-300 font-medium"
              >
                {part}
              </Link>
            );
          }
          if (part.startsWith('lab/') || part.startsWith('@')) {
            const raw = part.startsWith('@') ? part.substring(1) : part.substring(4);
            const username = raw.replace(/\.+$/, '');
            const trailing = raw.slice(username.length);
            if (!username) return <span key={i}>{part}</span>;
            return (
              <React.Fragment key={i}>
              <Link
                href={`/lab/${username}`}
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {part.startsWith('@') ? `@${username}` : `lab/${username}`}
              </Link>
              {trailing}
              </React.Fragment>
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
