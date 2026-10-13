import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API, autenticação e eventos do SDK",
  description:
    "Referência da API UpzLab para check-in Android, autenticação JWT, status diário e dados enviados pelo SDK.",
  alternates: { canonical: "/sdk/api" },
};

const requestExample = `POST /api/upzlab/sdk/checkin
Authorization: Bearer <jwt-upzlab>
Content-Type: application/json

{
  "app_id": "com.suaempresa.app",
  "platform": "android",
  "session_id": "id-da-sessao",
  "timezone": "America/Sao_Paulo",
  "app_version": "1.2.0"
}`;

export default function SDKApiPage() {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        Referência técnica
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        API do SDK e autenticação
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
        As rotas de check-in são protegidas. O SDK transmite o JWT do desenvolvedor
        autenticado; o servidor deriva o perfil a partir da sessão e não aceita um
        identificador de perfil fornecido pelo app. O <code>app_id</code> é o Package ID
        cadastrado no Lab Studio, e o check-in exige que o desenvolvedor seja o dono ou
        esteja inscrito no app.
      </p>

      <section className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#151719]">
        <div className="grid grid-cols-[90px_1fr] border-b border-white/[0.07] px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          <span>Método</span><span>Endpoint</span>
        </div>
        {[
          ["POST", "/api/upzlab/sdk/checkin", "Registra ou atualiza a última abertura no dia local."],
          ["GET", "/api/upzlab/sdk/checkin/status", "Retorna status, pontos, streak e histórico diário."],
          ["GET", "/api/upzlab/sdk/checkin/compliance", "Retorna resumo de compliance do check-in."],
          ["GET", "/api/upzlab/sdk/apps", "Lista os apps próprios ou em que o desenvolvedor está inscrito."],
        ].map(([method, endpoint, description]) => (
          <div key={endpoint} className="grid gap-1 border-b border-white/[0.06] px-4 py-4 last:border-0 sm:grid-cols-[90px_1fr]">
            <span className={`font-mono text-[10px] font-semibold ${method === "POST" ? "text-slate-200" : "text-slate-400"}`}>
              {method}
            </span>
            <div>
              <code className="font-mono text-xs text-slate-200">{endpoint}</code>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-[#151719] p-5">
        <h2 className="text-sm font-semibold">Exemplo de check-in Android</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#0c0e10] p-4 text-xs leading-6 text-slate-300">
          <code>{requestExample}</code>
        </pre>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">Autenticação</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Envie <code className="font-mono text-slate-300">Authorization: Bearer &lt;token&gt;</code>.
            Token ausente ou inválido retorna erro HTTP. Não inclua secrets administrativos
            ou tokens estáticos em builds de cliente.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#151719] p-5">
          <h2 className="text-sm font-semibold">Atividade e recompensa</h2>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            A atividade é registrada por desenvolvedor, app e dia local. A recompensa
            permanece única por perfil e dia; outras aberturas do mesmo app atualizam a
            última atividade, sem criar sessões independentes.
          </p>
        </div>
      </section>
    </article>
  );
}
