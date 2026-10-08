"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setErrorMsg(
          data.message || "Ocorreu um erro ao enviar sua mensagem. Tente novamente."
        );
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setErrorMsg("Erro de conexão com o servidor. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Linha Divisória Visual de Alto Impacto */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00FF87]/40 via-slate-600 to-transparent"></div>

      <section id="contato" className="w-full bg-[#131D33] py-28 md:py-36 border-y-2 border-slate-700/60 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#0A0E1A]/60 blur-[180px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800 border-2 border-slate-700 text-[#00FF87] text-xs font-mono font-bold uppercase tracking-widest mb-6 shadow-md">
              CANAL DE ATENDIMENTO
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Fale Conosco
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Envie sua mensagem para a equipe do É Golpe. Estamos à disposição para dúvidas, sugestões e parcerias.
            </p>
          </div>

          <div className="bg-[#1E293B] border-2 border-slate-700/70 p-8 sm:p-12 rounded-3xl shadow-2xl backdrop-blur-xl">
            
            {submitted ? (
              <div className="p-8 rounded-2xl bg-[#0A0E1A] border-2 border-[#00FF87]/50 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-[#00FF87]/20 border-2 border-[#00FF87]/60 text-[#00FF87] flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-white">
                  Mensagem Enviada com Sucesso!
                </h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                  Agradecemos o seu contato. Nossa equipe analisará sua mensagem e responderá o mais breve possível.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-block mt-4 px-6 py-3 bg-[#00FF87] text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg"
                >
                  Enviar Nova Mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/50 text-red-300 text-sm flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Seu Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full bg-[#0A0E1A] border-2 border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Seu E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#0A0E1A] border-2 border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] transition-all text-sm shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Assunto
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Qual é o assunto da sua mensagem?"
                    className="w-full bg-[#0A0E1A] border-2 border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] transition-all text-sm shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Sua Mensagem
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva detalhadamente sua mensagem aqui..."
                    className="w-full bg-[#0A0E1A] border-2 border-slate-700/80 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF87] transition-all text-sm resize-none shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#00FF87] text-black font-black text-base rounded-xl hover:shadow-[0_0_30px_rgba(0,255,135,0.4)] hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl"
                >
                  {loading ? (
                    <span>Enviando...</span>
                  ) : (
                    <span>Enviar Mensagem</span>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </section>
    </>
  );
}
