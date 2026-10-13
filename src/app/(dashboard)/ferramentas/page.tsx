"use client";

import React, { useMemo, useState } from "react";

const input = "w-full rounded-xl bg-[#0A0E1A] border border-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white";
const btn = "px-4 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-slate-200 transition";

function useCopy() {
  const [copied, setCopied] = useState(false);
  return [copied, async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { alert("Não foi possível copiar."); }
  }] as const;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function BugReport() {
  const [f, setF] = useState({ title: "", device: "", os: "", version: "", steps: "", expected: "", actual: "", severity: "Média" });
  const [copied, copy] = useCopy();
  const set = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  const md = `# ${f.title || "Título do bug"}\n\n**Severidade:** ${f.severity}\n**Dispositivo:** ${f.device || "-"}\n**Sistema:** ${f.os || "-"}\n**Versão do app:** ${f.version || "-"}\n\n## Passos para reproduzir\n${f.steps || "1. ..."}\n\n## Resultado esperado\n${f.expected || "-"}\n\n## Resultado atual\n${f.actual || "-"}\n`;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <input value={f.title} onChange={set("title")} placeholder="Título do bug" className={input} />
        <div className="grid grid-cols-2 gap-3">
          <input value={f.device} onChange={set("device")} placeholder="Dispositivo (Pixel 7)" className={input} />
          <input value={f.os} onChange={set("os")} placeholder="Android 14" className={input} />
          <input value={f.version} onChange={set("version")} placeholder="Versão do app" className={input} />
          <select value={f.severity} onChange={set("severity")} className={input}>{["Baixa", "Média", "Alta", "Crítica"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        <textarea rows={4} value={f.steps} onChange={set("steps")} placeholder="Passos para reproduzir (1. ... 2. ...)" className={input} />
        <textarea rows={2} value={f.expected} onChange={set("expected")} placeholder="Resultado esperado" className={input} />
        <textarea rows={2} value={f.actual} onChange={set("actual")} placeholder="Resultado atual" className={input} />
      </div>
      <div className="space-y-3">
        <pre className="bg-[#0A0E1A] border border-slate-800 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap break-words min-h-[260px]">{md}</pre>
        <div className="flex gap-2"><button onClick={() => copy(md)} className={btn}>{copied ? "Copiado!" : "Copiar"}</button><button onClick={() => download("bug-report.md", md, "text/markdown")} className={btn}>Baixar .md</button></div>
      </div>
    </div>
  );
}

function TestCases() {
  const [screens, setScreens] = useState("Login\nCadastro\nPerfil");
  const [rows, setRows] = useState<string[][]>([]);
  const generate = () => {
    const list = screens.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 30);
    const out: string[][] = [];
    list.forEach((s, i) => {
      const n = (k: number) => `TC-${String(i * 6 + k).padStart(3, "0")}`;
      out.push([n(1), s, "Abrir a tela normalmente", "A tela carrega sem erros", "Funcional"]);
      out.push([n(2), s, "Preencher/usar com dados válidos", "Ação concluída com sucesso", "Funcional"]);
      out.push([n(3), s, "Enviar com campos vazios ou inválidos", "Mensagens de validação claras", "Validação"]);
      out.push([n(4), s, "Girar o aparelho / mudar tamanho de fonte", "Layout permanece utilizável", "UI"]);
      out.push([n(5), s, "Executar sem conexão com a internet", "Erro tratado, sem crash", "Resiliência"]);
      out.push([n(6), s, "Pressionar voltar e retomar o app", "Estado preservado, sem crash", "Ciclo de vida"]);
    });
    setRows(out);
  };
  const csv = () => ["ID,Tela,Passo,Resultado esperado,Tipo", ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
  return (
    <div className="space-y-3">
      <textarea rows={5} value={screens} onChange={(e) => setScreens(e.target.value)} placeholder="Uma tela por linha" className={input} />
      <div className="flex gap-2"><button onClick={generate} className={btn}>Gerar casos</button>{rows.length > 0 && <button onClick={() => download("casos-de-teste.csv", "\ufeff" + csv(), "text/csv;charset=utf-8")} className={btn}>Baixar CSV</button>}</div>
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-slate-800 rounded-xl"><table className="w-full text-xs text-slate-200">
          <thead className="bg-slate-800/60 text-slate-400"><tr>{["ID", "Tela", "Passo", "Esperado", "Tipo"].map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-slate-800">{r.map((c, i) => <td key={i} className="p-2">{c}</td>)}</tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
}

const PERMS: Record<string, string> = {
  "android.permission.READ_SMS": "Lê SMS", "android.permission.SEND_SMS": "Envia SMS", "android.permission.RECORD_AUDIO": "Grava áudio",
  "android.permission.CAMERA": "Usa câmera", "android.permission.ACCESS_FINE_LOCATION": "Localização precisa", "android.permission.READ_CONTACTS": "Lê contatos",
  "android.permission.READ_CALL_LOG": "Lê histórico de chamadas", "android.permission.SYSTEM_ALERT_WINDOW": "Sobrepõe outras telas",
  "android.permission.BIND_ACCESSIBILITY_SERVICE": "Serviço de acessibilidade", "android.permission.REQUEST_INSTALL_PACKAGES": "Instala pacotes",
  "android.permission.READ_EXTERNAL_STORAGE": "Lê armazenamento", "android.permission.WRITE_EXTERNAL_STORAGE": "Escreve no armazenamento",
};

function LogAnalyzer() {
  const [log, setLog] = useState("");
  const r = useMemo(() => {
    const lines = log.split("\n");
    const count = (re: RegExp) => lines.filter((l) => re.test(l)).length;
    const perms = Object.keys(PERMS).filter((p) => log.includes(p));
    const urls = Array.from(new Set(log.match(/https?:\/\/[^\s"')]+/g) || [])).slice(0, 20);
    return {
      total: lines.filter(Boolean).length,
      errors: count(/\bE\/|\bERROR\b|\bFATAL\b/), warns: count(/\bW\/|\bWARN\b/),
      crashes: count(/FATAL EXCEPTION|AndroidRuntime|ANR in/), exceptions: Array.from(new Set(log.match(/\b[A-Za-z.]+(?:Exception|Error)\b/g) || [])).slice(0, 15),
      perms, urls,
    };
  }, [log]);
  return (
    <div className="space-y-3">
      <textarea rows={8} value={log} onChange={(e) => setLog(e.target.value)} placeholder="Cole aqui o logcat ou console log (a análise roda no seu navegador, nada é enviado)." className={`${input} font-mono text-xs`} />
      {log.trim() && (
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="bg-[#0A0E1A] border border-slate-800 rounded-xl p-4 space-y-1 text-slate-200">
            <p>Linhas: <b>{r.total}</b></p><p>Erros: <b className="text-rose-300">{r.errors}</b></p><p>Avisos: <b className="text-amber-300">{r.warns}</b></p><p>Crashes/ANR: <b className="text-rose-300">{r.crashes}</b></p>
            {r.exceptions.length > 0 && <div className="pt-2"><p className="text-slate-400 text-xs mb-1">Exceções encontradas</p>{r.exceptions.map((x) => <p key={x} className="font-mono text-xs">{x}</p>)}</div>}
          </div>
          <div className="bg-[#0A0E1A] border border-slate-800 rounded-xl p-4 space-y-2 text-slate-200">
            <p className="text-slate-400 text-xs">Permissões sensíveis citadas</p>
            {r.perms.length === 0 ? <p className="text-xs text-slate-500">Nenhuma detectada.</p> : r.perms.map((p) => <p key={p} className="text-xs"><span className="font-mono">{p.replace("android.permission.", "")}</span> — {PERMS[p]}</p>)}
            <p className="text-slate-400 text-xs pt-2">Endereços acessados</p>
            {r.urls.length === 0 ? <p className="text-xs text-slate-500">Nenhum.</p> : r.urls.map((u) => <p key={u} className="font-mono text-xs break-all">{u}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}

const TOOLS = [
  { key: "bug", title: "Template de Report de Bug", desc: "Monte um relatório padronizado e copie em Markdown.", C: BugReport },
  { key: "cases", title: "Gerador de Casos de Teste", desc: "Informe as telas do app e baixe uma planilha de testes.", C: TestCases },
  { key: "logs", title: "Logs & Monitoramento", desc: "Analise logcat: erros, crashes, permissões e URLs.", C: LogAnalyzer },
];

export default function FerramentasPage() {
  const [active, setActive] = useState("bug");
  const tool = TOOLS.find((t) => t.key === active)!;
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-6">
        <h1 className="text-2xl font-black text-white">Ferramentas Lab</h1>
        <p className="text-sm font-mono text-slate-400 mt-1">Utilitários para testers e devs. Tudo roda no seu navegador, seus dados não saem da máquina.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {TOOLS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)} className={`text-left rounded-2xl p-4 border transition ${active === t.key ? "border-white bg-white/5" : "border-slate-800 bg-[#131D33]/60 hover:border-slate-600"}`}>
            <h3 className="text-white font-bold text-sm mb-1">{t.title}</h3><p className="text-xs text-slate-400">{t.desc}</p>
          </button>
        ))}
      </div>
      <div className="bg-[#131D33]/60 border border-slate-800 rounded-2xl p-5"><tool.C /></div>
    </div>
  );
}
