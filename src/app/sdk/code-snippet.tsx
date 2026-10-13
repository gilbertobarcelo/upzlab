"use client";

import { useState } from "react";

export default function CodeSnippet({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Não foi possível copiar o exemplo do SDK.", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0c0e10]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3.5 py-2.5">
        <span className="font-mono text-[10px] text-slate-500">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-slate-300 transition hover:border-white/25 hover:text-white"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
