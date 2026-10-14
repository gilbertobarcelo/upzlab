import React, { useState, useEffect, useRef } from 'react';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange: (val: string) => void;
  onSubmitAction?: () => void;
}

export default function MentionTextarea({ value, onValueChange, onSubmitAction, className, ...props }: MentionTextareaProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mentionQuery !== null && mentionQuery.length > 0) {
      const delay = setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/upzlab/mentions/users?q=${encodeURIComponent(mentionQuery)}`)
          .then(r => r.json())
          .then(d => {
            if (d.success) setMentionResults(d.data);
          }).catch(console.error);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setMentionResults([]);
    }
  }, [mentionQuery]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onValueChange(val);
    
    // Procura por "lab/" no cursor
    const match = val.match(/(?:^|\s)(?:@|lab\/)([a-zA-Z0-9_\.]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    const val = value as string;
    const match = val.match(/(?:^|\s)(?:@|lab\/)([a-zA-Z0-9_\.]*)$/);
    if (match) {
      const before = val.substring(0, match.index! + (/^\s/.test(match[0]) ? 1 : 0));
      const newText = before + `@${username} `;
      onValueChange(newText);
      setMentionQuery(null);
      setMentionResults([]);
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      {/* Menu Suspenso */}
      {mentionResults.length > 0 && mentionQuery !== null && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#0A0E1A] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-[9999] flex flex-col">
          <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mencionar Desenvolvedor</span>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {mentionResults.map((u, i) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u.username)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${i === mentionIndex ? "bg-slate-800" : "hover:bg-slate-800/50"}`}
              >
                <img src={u.avatar_url || "/favicon.svg?v=5"} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">{u.name}</span>
                  <span className="text-xs font-mono text-emerald-400 truncate">@{u.username}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        {...props}
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        className={`w-full ${className || ''}`}
        onKeyDown={e => {
          if (mentionResults.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMentionIndex(prev => Math.min(prev + 1, mentionResults.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setMentionIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insertMention(mentionResults[mentionIndex].username);
            } else if (e.key === "Escape") {
              setMentionQuery(null);
              setMentionResults([]);
            }
            return;
          }
          
          if (e.key === "Enter" && !e.shiftKey && onSubmitAction) {
            e.preventDefault();
            onSubmitAction();
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
      />
    </div>
  );
}
