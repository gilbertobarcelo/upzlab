"use client";
import React, { useEffect, useState } from "react";
import { FeedbackList } from "../components/FeedbackList";

export default function FeedbacksPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;
  
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8001/api/upzlab/campaigns/app/${id}/dashboard`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setFeedbacks(json.data.recent_feedbacks || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-slate-400 font-mono p-6">Carregando feedbacks...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
      <div className="bg-[#131D33]/60 p-6 rounded-2xl border border-slate-800/80 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Central de Feedbacks & Bugs</h2>
          <p className="text-xs text-slate-400 font-mono">Analise, valide e resolva os problemas apontados pela comunidade.</p>
        </div>
      </div>
      
      <div className="h-[600px]">
        <FeedbackList feedbacks={feedbacks} />
      </div>
    </div>
  );
}
