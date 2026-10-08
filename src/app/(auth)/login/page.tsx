"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useComunidade } from "../../ComunidadeContext";

export default function ComunidadeLoginPage() {
  const router = useRouter();
  const { login } = useComunidade();
      const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Checar se voltou do github com erro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      if (err.includes("github_token_missing")) setErrorMsg("Falha de comunicação com o GitHub.");
      else if (err === "github_email_required") setErrorMsg("O seu e-mail do GitHub é privado ou não existe.");
      else setErrorMsg("Erro ao autenticar com GitHub.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const endpoint = "/api/dev/auth/login";
      const payload = { email, password };
      
      const res = await fetch(`http://localhost:8001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Erro ao processar");
      }
      
      const data = await res.json();
      login(data.access_token);
      
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href = "http://localhost:8001/api/dev/auth/github/login?action=login";
  };

  return (
    <div className="max-w-md mx-auto w-full py-6 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <img src="/logo_transparent.png" alt="É Golpe Logo" className="h-14 mx-auto mb-6 drop-shadow-xl" />
        <h1 className="text-2xl font-black text-white">
          Acesso Dev Tester
        </h1>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-sm mx-auto">
          Faça login para acessar o UpzLab e ganhar recompensas avaliando o App É Golpe.
        </p>
      </div>

      <div className="bg-[#131D33]/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl w-full flex flex-col items-center relative transition-all">
        {errorMsg && (
          <div className="mb-4 w-full p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-center">
            <p className="text-red-400 text-xs font-mono font-bold">{errorMsg}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">

          
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-widest">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@gmail.com" className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-widest">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold tracking-wider transition-all shadow-md">
            {loading ? "Aguarde..." : "Entrar"}
          </button>
        </form>

        <div className="w-full flex items-center justify-center my-6 gap-2">
          <div className="h-px bg-slate-700 w-full flex-1"></div>
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">OU</span>
          <div className="h-px bg-slate-700 w-full flex-1"></div>
        </div>

        <button type="button" onClick={handleGitHubLogin} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600 transition-all flex items-center justify-center gap-3">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          Entrar com GitHub
        </button>
        
        <p className="text-slate-400 text-xs mt-6">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-emerald-400 font-bold hover:underline">
            Cadastre-se
          </Link>
        </p>

      </div>
    </div>
  );
}
