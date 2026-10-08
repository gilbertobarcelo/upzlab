"use client";

import React from "react";
import Link from "next/link";

export default function TutorialPage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-slate-400 hover:text-emerald-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Tutorial: Firebase App Distribution</h1>
          <p className="text-sm font-mono text-emerald-400">Como instalar a versão Alpha/Beta (.AAB) Oficial</p>
        </div>
      </div>

      <div className="bg-[#131D33] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Fundo Decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-6 relative z-10">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <svg className="w-6 h-6 text-amber-500 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-white font-bold text-sm mb-1">Por que isso é necessário?</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Nós distribuímos o App no formato oficial da Google (<strong>.aab - Android App Bundle</strong>) para garantir que você teste exatamente a mesma versão que os usuários finais terão. Para que a Google Play aceite instalar uma versão interna de testes que ainda não está liberada pro público, você precisa ativar o <strong>Modo Desenvolvedor da Google Play</strong> no seu celular uma única vez.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-black text-white mb-6">Passo a Passo (Você só faz isso 1 vez!)</h2>

            {/* Passo 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                1
              </div>
              <div className="pt-1">
                <h4 className="text-white font-bold text-sm">Abra a Google Play Store</h4>
                <p className="text-slate-400 text-xs mt-1">No seu celular Android, abra o aplicativo normal da Google Play Store. Toque na sua foto de perfil no canto superior direito e vá em <strong>Configurações</strong>.</p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                2
              </div>
              <div className="pt-1">
                <h4 className="text-white font-bold text-sm">Vá até o menu "Sobre"</h4>
                <p className="text-slate-400 text-xs mt-1">Expanda a seção chamada <strong>Sobre</strong> (ou About, se estiver em inglês).</p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                3
              </div>
              <div className="pt-1">
                <h4 className="text-white font-bold text-sm">Toque 7 VEZES seguidas na Versão</h4>
                <p className="text-slate-400 text-xs mt-1">Encontre o item <strong>Versão da Play Store</strong> e toque rapidamente <strong>7 vezes seguidas</strong> sobre ele. Vai aparecer uma mensagem na tela dizendo: <span className="text-emerald-400 italic">"Você agora é um desenvolvedor!"</span>.</p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                4
              </div>
              <div className="pt-1">
                <h4 className="text-white font-bold text-sm">Ative o Compartilhamento Interno</h4>
                <p className="text-slate-400 text-xs mt-1">Ainda nas Configurações da Google Play, volte e expanda a seção <strong>Geral</strong>. Vá em <strong>Opções do desenvolvedor</strong> e ative a chavinha <strong>Compartilhamento interno de apps</strong> (Internal App Sharing). Confirme no aviso que aparecer.</p>
              </div>
            </div>

            {/* Passo 5 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="pt-1">
                <h4 className="text-emerald-400 font-bold text-sm">Tudo Pronto!</h4>
                <p className="text-slate-400 text-xs mt-1">Agora é só voltar lá no seu e-mail de convite do Firebase, clicar em "Download" e ele vai abrir a Google Play e instalar a nossa versão de testes na hora!</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
