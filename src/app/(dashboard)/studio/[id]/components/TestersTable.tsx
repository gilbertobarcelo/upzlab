import React from "react";

export function TestersTable({ testers = [] }: { testers?: any[] }) {
  const displayTesters = testers.map((t, idx) => ({
    id: t.id || idx,
    name: t.name || "Testador Anônimo",
    role: t.role || "Membro",
    status: "Ativo",
    points: t.points || 0,
    bugsFound: t.bugsFound || 0
  }));

  return (
    <div className="bg-[#131D33]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Testadores Recentes</h2>
        <button className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">
          Ver todos →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800">
              <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Testador</th>
              <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Perfil</th>
              <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-right">Pts Acumulados</th>
              <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider text-right">Bugs Encontrados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayTesters.length > 0 ? (
              displayTesters.map((tester: any) => (
                <tr key={tester.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                        {tester.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{tester.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300">{tester.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold font-mono uppercase ${
                      tester.status === "Ativo" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}>
                      {tester.status === "Ativo" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {tester.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-400 text-right">
                    {tester.points.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300 text-right">
                    {tester.bugsFound}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-mono text-sm">
                  Nenhum testador recrutado para este aplicativo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
