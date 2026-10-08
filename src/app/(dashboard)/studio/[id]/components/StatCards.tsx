import React from "react";

export function StatCards({ data }: { data?: any }) {
  const boost = data?.boost;
  const boostActive = boost?.active;

  const stats = [
    {
      label: "Total de Testadores",
      value: data?.testers_count ?? 0,
      trend: "Real-time",
      positive: true,
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      label: "Bugs Reportados",
      value: data?.bugs_count ?? 0,
      trend: "Pendente",
      positive: true,
      icon: (
        <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: "Feedbacks Validados",
      value: data?.feedback_count ?? 0,
      trend: "Processados",
      positive: true,
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: "Taxa de Engajamento",
      value: data?.engagement_rate ?? "0%",
      trend: "Geral",
      positive: true,
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-[#131D33]/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {stat.icon}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
              {stat.icon}
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
          </div>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              {stat.trend}
            </div>
          </div>
        </div>
      ))}

      {/* Card de Boost — aparece quando boost está ativo */}
      {boostActive && (
        <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-amber-900/20 to-[#131D33] border border-amber-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Boost Ativo</span>
                <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                  {boost.level === 1 ? "Feed" : boost.level === 2 ? "Pinado" : "Elite"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {boost.days_left} dia{boost.days_left !== 1 ? "s" : ""} restante{boost.days_left !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-2xl font-black text-amber-400">{boost.impressions ?? 0}</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Impressões</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{boost.days_left}</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Dias restantes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
