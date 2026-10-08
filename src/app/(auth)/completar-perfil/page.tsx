"use client";

import React, { useState, useEffect } from "react";
import { useComunidade } from "../../ComunidadeContext";
import { auth } from "../../../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

export default function CompletarPerfilPage() {
  const { isLoggedIn, login } = useComunidade();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<"phone" | "otp" | "authenticating" | "success">("phone");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (authStep === "otp") {
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [authStep]);

  const getRecaptchaVerifier = () => {
    // @ts-ignore
    if (window.recaptchaVerifier) {
      try { // @ts-ignore
        window.recaptchaVerifier.clear();
      } catch (e) {}
      // @ts-ignore
      window.recaptchaVerifier = null;
    }

    const wrap = document.getElementById('recaptcha-container-wrap');
    if (wrap) {
      wrap.innerHTML = '<div id="recaptcha-node"></div>';
    }

    // @ts-ignore
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-node', { 'size': 'invisible' });
    // @ts-ignore
    return window.recaptchaVerifier;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return;
    setAuthStep("authenticating");
    setErrorMsg("");
    
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key") {
        setConfirmationResult({ confirm: async () => ({ user: { getIdToken: async () => "mock-token" } }) } as any);
        setAuthStep("otp");
        return;
      }

      const verifier = getRecaptchaVerifier();
      const formattedPhone = `+55${cleanPhone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(confirmation);
      setAuthStep("otp");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao enviar SMS");
      setAuthStep("phone");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6 || !confirmationResult) return;
    setAuthStep("authenticating");
    setErrorMsg("");
    
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      const cleanPhone = phone.replace(/\D/g, "");

      let match = document.cookie.match(/(?:^|; )upzlab_dev_jwt=([^;]*)/);
      let sessionToken = match ? match[1] : null;

      const endpoint = "http://localhost:8001/api/dev/auth/verify";
      const bodyPayload = { phone: cleanPhone, token: idToken, name: name };

      const verifyRes = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify(bodyPayload)
      });
      
      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Erro na vinculação do telefone.");
      }
      
      setAuthStep("success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Código inválido ou expirado");
      setAuthStep("otp");
    }
  };

  if (authStep === "success") {
    return (
      <div className="max-w-md mx-auto w-full py-12 flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-white text-center mb-4">Telefone Verificado!</h1>
        <p className="text-slate-400 text-sm text-center leading-relaxed">
          Sua conta está totalmente configurada. Você será redirecionado em instantes...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full py-6 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-2">Segurança da Conta</h1>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
          Para mantermos a comunidade segura e evitar contas falsas, precisamos validar seu número de telefone. Você só precisará fazer isso uma vez!
        </p>
      </div>

      <div className="bg-[#131D33]/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl w-full">
        <div id="recaptcha-container-wrap" style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}></div>
        
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-center">
            <p className="text-red-400 text-xs font-mono font-bold">{errorMsg}</p>
          </div>
        )}

        {authStep === "phone" || (authStep === "authenticating" && phone && !otp) ? (
          <form onSubmit={handleSendOTP} className="w-full space-y-6">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-widest">
                Seu Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como devemos te chamar?"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 transition-all text-sm text-white focus:outline-none"
                disabled={authStep === "authenticating"}
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1 uppercase tracking-widest">
                Celular
              </label>
              <div className="flex items-center w-full bg-[#0A0E1A] border border-slate-700 focus-within:border-emerald-500 rounded-xl px-4 py-3 transition-all font-mono">
                <span className="text-slate-500 font-bold text-sm shrink-0 border-r border-slate-700 pr-3 mr-3">BR +55</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full bg-transparent text-sm text-left text-white focus:outline-none"
                  disabled={authStep === "authenticating"}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authStep === "authenticating" || phone.length < 8}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold transition-all shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {authStep === "authenticating" ? "Enviando SMS..." : "Receber Código SMS"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="w-full space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg">Código enviado!</h3>
              <p className="text-slate-400 text-xs mt-2">
                Digite o código de 6 dígitos que enviamos para<br/>
                <strong className="text-emerald-400 tracking-wider">+55 {phone}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                className="w-full bg-[#0A0E1A] border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-4 transition-all text-center text-3xl font-mono font-black text-white tracking-[0.5em] focus:outline-none"
                disabled={authStep === "authenticating"}
              />
            </div>

            <button
              type="submit"
              disabled={authStep === "authenticating" || otp.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold transition-all shadow-md disabled:opacity-50"
            >
              {authStep === "authenticating" ? "Verificando..." : "Verificar Código"}
            </button>
            
            <button
              type="button"
              onClick={() => { setAuthStep("phone"); setOtp(""); }}
              className="w-full text-xs text-slate-500 hover:text-white transition-colors"
            >
              Voltar e editar número
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
