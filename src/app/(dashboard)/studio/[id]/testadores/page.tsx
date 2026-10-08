"use client";
import React, { useEffect, useState } from "react";
import { TestersTable } from "../components/TestersTable";

export default function TestadoresPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  
  const [testers, setTesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8001/api/upzlab/campaigns/app/${id}/dashboard`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setTesters(json.data.recent_testers || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-slate-400 font-mono p-6">Carregando lista de testadores...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="bg-[#131D33]/60 p-6 rounded-2xl border border-slate-800/80 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Membros e Testadores Ativos</h2>
          <p className="text-xs text-slate-400 font-mono">Gerencie quem tem acesso ao seu aplicativo.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs uppercase transition-colors">
          Convidar
        </button>
      </div>
      
      <TestersTable testers={testers} />
    </div>
  );
}
