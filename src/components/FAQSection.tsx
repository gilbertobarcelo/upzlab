"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "O É Golpe é realmente 100% gratuito?",
    answer: "Sim! O É Golpe é uma iniciativa de utilidade pública. Não cobramos mensalidades, assinaturas ou taxas ocultas pelo uso de nenhum recurso de proteção."
  },
  {
    question: "O aplicativo acessa minhas conversas ou envia minha lista de contatos?",
    answer: "Não. A privacidade é absoluta. A análise de risco é realizada localmente no próprio dispositivo (on-device) e sua agenda de contatos jamais é enviada, copiada ou vendida a terceiros."
  },
  {
    question: "Como o É Golpe descobre que a ligação é falsa em menos de 50ms?",
    answer: "Nossos algoritmos analisam os parâmetros de sinalização da rede telefônica no exato milissegundo em que a chamada é recebida, identificando falsificações de números (caller ID spoofing) antes do celular tocar."
  },
  {
    question: "Funciona em qualquer smartphone Android?",
    answer: "Sim! Desenvolvido de forma nativa em Kotlin para Android (versão 8.0+), o aplicativo é extremamente leve e consome zero bateria adicional em segundo plano."
  },
  {
    question: "Como posso tirar dúvidas ou entrar em contato?",
    answer: "Você pode enviar uma mensagem diretamente através do nosso formulário de contato ao final da página."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* Linha Divisória Visual de Alto Impacto */}
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00FF87]/40 via-slate-600 to-transparent"></div>

      <section id="faq" className="w-full bg-[#131D33] py-28 md:py-36 border-y-2 border-slate-700/60 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-slate-800/30 blur-[180px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800 border-2 border-slate-700 text-[#00FF87] text-xs font-mono font-bold uppercase tracking-widest mb-6 shadow-md">
              PERGUNTAS FREQUENTES
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Dúvidas Frequentes</h2>
            <p className="text-slate-300 text-lg">Respostas claras sobre o funcionamento e a privacidade do aplicativo.</p>
          </div>

          <div className="space-y-4">
            {faqData.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-[#1E293B] border-2 border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl transition-all"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full text-left p-6 flex justify-between items-center gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-lg font-bold text-white leading-snug">
                      {item.question}
                    </span>
                    <div className={`w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-[#00FF87] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-slate-300 text-base leading-relaxed border-t border-slate-800/80 mt-2">
                      <p className="pt-4">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}
