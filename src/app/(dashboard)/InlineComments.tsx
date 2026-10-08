import React, { useState, useEffect, useRef } from "react";
import { DevPost, useComunidade } from "../ComunidadeContext";
import TextWithMentions from "../components/TextWithMentions";

function getToken() {
  if (typeof document === "undefined") return null;
  for (const name of ["egolpe_dev_jwt", "upzlab_dev_jwt", "auth_token"]) {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (m) return decodeURIComponent(m[1]);
  }
  return null;
}

interface Comment {
  id: number;
  feedback_id: number;
  user_id: number;
  parent_comment_id: number | null;
  author_name: string;
  author_role: string;
  body: string;
  is_admin_reply: boolean;
  likes: number;
  created_at: string;
  avatar_url?: string;
}

interface InlineCommentsProps {
  post: DevPost;
}

export default function InlineComments({ post }: InlineCommentsProps) {
  const { devUser } = useComunidade();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  useEffect(() => {
    if (post && post.db_id) {
      fetchComments();
    }
  }, [post.db_id]);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`http://127.0.0.1:8001/api/upzlab/beta-feedback/comunidade/post/${post.db_id}/comments`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setComments(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mentionQuery !== null && mentionQuery.length > 0) {
      const delay = setTimeout(() => {
        fetch(`http://127.0.0.1:8001/api/upzlab/mentions/users?q=${mentionQuery}`)
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
    setNewComment(val);
    
    // Check if typing a mention: looking for "lab/" at the end of text or after a space
    const match = val.match(/(?:^|\s)lab\/([a-z0-9_\.]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;
    const val = newComment;
    const match = val.match(/(?:^|\s)lab\/([a-z0-9_\.]*)$/);
    if (match) {
      const before = val.substring(0, match.index! + (match[0].startsWith(' ') ? 1 : 0));
      const newText = before + `lab/${username} `;
      setNewComment(newText);
      setMentionQuery(null);
      setMentionResults([]);
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !post.db_id) return;
    setSubmitting(true);
    try {
      const token = getToken();
      const authorName = devUser?.name || "Dev Tester";
      const authorRole = devUser?.role || "Developer";
      
      const payload = {
        body: newComment,
        parent_comment_id: replyTo ? replyTo.id : null,
        author_name: authorName,
        author_role: authorRole
      };

      const res = await fetch(`http://127.0.0.1:8001/api/upzlab/beta-feedback/comunidade/post/${post.db_id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewComment("");
        setReplyTo(null);
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Build tree
  const rootComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (parentId: number) => comments.filter(c => c.parent_comment_id === parentId);

  return (
    <div className="bg-transparent p-4">
      {/* Comments List */}
      <div className="space-y-4 mb-4">
        {loading ? (
          <div className="text-center text-slate-500 text-xs font-mono py-2">Carregando comentários...</div>
        ) : rootComments.length === 0 ? (
          <div className="text-center text-slate-500 text-xs font-mono py-2">Nenhum comentário. Seja o primeiro!</div>
        ) : (
          rootComments.map(comment => (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-3">
                <img src={comment.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=1e293b&color=94a3b8`} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-700/50 shrink-0 object-cover mt-0.5" />
                <div className="flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-200">{comment.author_name}</span>
                      <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap"><TextWithMentions text={comment.body} /></p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={() => {
                        setReplyTo(comment);
                        const firstWord = comment.author_name.split(' ')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
                        setNewComment(`lab/${firstWord} `);
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                            // Coloca o cursor no final
                            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
                          }
                        }, 50);
                      }} 
                      className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider"
                    >
                      Responder
                    </button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 ml-11 mt-3">
                  <img src={reply.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author_name)}&background=0f172a&color=94a3b8`} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700/50 shrink-0 object-cover mt-0.5" />
                  <div className="flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-300">{reply.author_name}</span>
                        <span className="text-[10px] text-slate-500">{new Date(reply.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap"><TextWithMentions text={reply.body} /></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 px-3 py-1 bg-slate-800/50 rounded text-xs">
            <span className="text-slate-400">Respondendo a <span className="font-bold text-slate-300">{replyTo.author_name}</span></span>
            <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        
        {/* Mention AutoComplete Menu */}
        {mentionResults.length > 0 && mentionQuery !== null && (
          <div className="absolute bottom-full left-0 mb-1 w-64 bg-[#0A0E1A] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col">
            <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mencionar Desenvolvedor</span>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {mentionResults.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => insertMention(u.username)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${i === mentionIndex ? "bg-slate-800" : "hover:bg-slate-800/50"}`}
                >
                  <img src={u.avatar_url || "https://ui-avatars.com/api/?name="+u.name} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-white truncate">{u.name}</span>
                    <span className="text-xs font-mono text-emerald-400 truncate">{"lab/"}{u.username}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleTextChange}
            placeholder="Escreva um comentário..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none h-10"
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
              
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-lg px-3 flex items-center justify-center transition-colors h-10"
          >
            {submitting ? "..." : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
