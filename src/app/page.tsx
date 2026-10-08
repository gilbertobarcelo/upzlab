"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

function Logo({ h = "h-6" }: { h?: string }) {
  return (
    <svg className={h} viewBox="0 0 130 28" fill="none">
      <polygon points="12,2 22,2 27,10 22,18 12,18 7,10" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinejoin="round"/>
      <text x="12.5" y="13.5" fontFamily="monospace" fontSize="9" fontWeight="900" fill="#6366f1">U</text>
      <text x="34" y="15" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="white" letterSpacing="0.3">upz</text>
      <text x="57" y="15" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#6366f1" letterSpacing="0.3">lab</text>
    </svg>
  );
}

const Ico = {
  Check: () => <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  Arrow: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>,
  Down:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  Menu:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16"/></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12"/></svg>,
  Bug:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Coin:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  App:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Doc:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Bolt:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  User:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  Star:  () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
};

const NAV = [
  { label: "Para Testers",   href: "#testers"  },
  { label: "Para Criadores", href: "#criadores" },
  { label: "Funcionalidades",href: "#features"  },
  { label: "UpzPoints",      href: "#points"    },
];

const FEATURES = [
  { I: Ico.Bug,   t: "Reporte bugs que importam",     d: "Formulário com tipo, código e evidências. Admin avalia — aprovado, pontos na hora." },
  { I: Ico.Coin,  t: "UpzPoints com valor real",       d: "Promova seu app, acesse IA, transfira para outros devs. Sem expiração." },
  { I: Ico.App,   t: "Studio Labs",                    d: "Cadastre, recrute testers, defina recompensa e acompanhe métricas reais." },
  { I: Ico.Doc,   t: "DocsLab — doc gerada por IA",   d: "Aponte um repositório GitHub e gere documentação pública ou técnica em minutos." },
  { I: Ico.Bolt,  t: "UpzLabRouter",                   d: "Um endpoint para múltiplos modelos de IA — Cohere, Apodex e mais." },
  { I: Ico.Chart, t: "Ranking e reputação pública",    d: "De Scanner a Cyber Ninja. Badges e histórico visíveis — portfólio técnico vivo." },
];

const REWARDS = [
  { pts: "+100",      l: "Criar conta na comunidade"   },
  { pts: "+10",       l: "Publicar no feed"             },
  { pts: "+50",       l: "Entrar como tester de um app" },
  { pts: "+500",      l: "Baixar o App Founder"         },
  { pts: "+100–1k",   l: "Bug ou anomalia aprovado"     },
  { pts: "+150",      l: "Publicar seu app na vitrine"  },
];

const LEVELS = [
  { n: "01", name: "Scanner",     pts: "0 – 499 pts",       d: "Ponto de entrada. Explore e comece a testar." },
  { n: "02", name: "White Hat",   pts: "500 – 1.499 pts",   d: "Primeiro reconhecimento. Acesso a apps exclusivos." },
  { n: "03", name: "Bug Hunter",  pts: "1.500 – 2.999 pts", d: "Referência na comunidade." },
  { n: "04", name: "Cyber Ninja", pts: "3.000+ pts",        d: "Elite. Primeiros a testar novos apps.", elite: true },
];

const PAINS = [
  { p: "Lancei meu app e ninguém testou direito antes de ir para produção.",    f: "Recrute devs que testam de verdade — reports estruturados com código e evidência." },
  { p: "Não consigo feedback técnico antes do lançamento na Play Store.",        f: "Receba bugs com steps para reproduzir antes de qualquer usuário real ver o problema." },
  { p: "Tenho habilidade técnica mas não tenho como provar isso publicamente.",  f: "Cada bug aprovado vai para seu perfil público. Construa reputação com contribuições reais." },
  { p: "Contribuo com código e testes mas não recebo nada em troca.",            f: "UpzPoints a cada contribuição aprovada. Promova app, acesse IA ou transfira." },
];

const TESTIMONIALS = [
  { t: "Em 2 dias tinha 8 devs no meu app e 3 bugs críticos que eu não sabia que existiam.", name: "Criador de App", role: "Indie Founder" },
  { t: "Aqui consigo mostrar minha habilidade técnica e ganhar reconhecimento por isso.",     name: "Dev Tester",    role: "Android Developer" },
  { t: "Apontei o repositório e em minutos tinha documentação decente para os testers.",      name: "Dev Founder",   role: "Full Stack Developer" },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob]           = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">

      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${scrolled ? "bg-[#111111]/95 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
          <Link href="/"><Logo /></Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(l => (
              <a key={l.href} href={l.href} className="px-3.5 py-1.5 text-[13px] text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="px-4 py-1.5 text-[13px] font-semibold text-white/50 hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold text-[13px] transition-all shadow-lg shadow-black/60">
              Criar conta grátis
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5" onClick={() => setMob(v => !v)}>
            {mob ? <Ico.Close /> : <Ico.Menu />}
          </button>
        </div>

        {mob && (
          <div className="md:hidden bg-[#1a1a1a] border-b border-white/5 px-5 py-4 space-y-1">
            {NAV.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMob(false)} className="block px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg">{l.label}</a>
            ))}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <Link href="/login" onClick={() => setMob(false)} className="block text-center py-2.5 rounded-lg border border-white/10 text-white/60 font-semibold text-sm">Entrar</Link>
              <Link href="/cadastro" onClick={() => setMob(false)} className="block text-center py-2.5 rounded-lg bg-[#6366f1] text-white font-bold text-sm">Criar conta grátis</Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center px-5 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[500px] bg-white/[0.02] rounded-full blur-[160px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-white/[0.015] rounded-full blur-[100px] -translate-x-1/4" />
          <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-mono font-semibold text-white/40 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
                Plataforma de Dev Testers
              </div>

              <h1 className="text-5xl md:text-6xl font-black leading-[1.06] tracking-tight">
                Seu app mereca ser<br />
                <span className="text-[#a1a1aa]">testado de verdade.</span>
              </h1>

              <p className="text-white/40 text-lg leading-relaxed max-w-lg">
                A UpzLab conecta criadores de apps com devs qualificados que testam, reportam bugs e constroem reputação técnica — antes do lançamento.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold text-sm tracking-wide transition-all shadow-xl shadow-black/60 hover:-translate-y-px">
                  Entrar na comunidade <Ico.Arrow />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-white/10 hover:border-white/20 text-white/50 hover:text-white font-semibold text-sm transition-all">
                  Já tenho conta
                </Link>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                {["Grátis para sempre", "Sem cartão de crédito", "Crie em menos de 1 min"].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-white/30">
                    <span className="text-[#a1a1aa]"><Ico.Check /></span>
                    {b}
                  </div>
                ))}
              </div>
            </div>

            {/* Mock UI */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-white/[0.02] rounded-2xl blur-3xl scale-95" />
              <div className="relative bg-[#18181b] border border-white/8 rounded-xl overflow-hidden shadow-2xl shadow-black/70">

                {/* chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#111111]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/8" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/8" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/8" />
                  </div>
                  <div className="flex-1 mx-2 h-5 bg-white/4 rounded flex items-center px-3">
                    <span className="text-white/20 text-[10px] font-mono">upzlab.dev/feed</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* post 1 */}
                  <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center">
                        <span className="text-white/50 font-black text-[10px] font-mono">AK</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-xs font-semibold">Alex Kimura</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/20 text-[9px] font-mono">hoje</span>
                          <span className="text-white/30 text-[9px] font-mono border border-white/8 px-1.5 py-0.5 rounded">bug</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-[#a1a1aa] border border-white/10 px-2 py-1 rounded">+300 pts</span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="h-1.5 bg-white/6 rounded-full w-4/5" />
                      <div className="h-1.5 bg-white/4 rounded-full w-3/5" />
                    </div>
                    <div className="h-12 bg-white/2 rounded border border-white/4 flex items-center justify-center">
                      <span className="text-white/15 text-[10px] font-mono">{'// race condition detectada'}</span>
                    </div>
                  </div>

                  {/* post 2 */}
                  <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center">
                        <span className="text-white/50 font-black text-[10px] font-mono">RS</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/70 text-xs font-semibold">Rafael Santos</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/20 text-[9px] font-mono">2h atrás</span>
                          <span className="text-white/30 text-[9px] font-mono border border-white/8 px-1.5 py-0.5 rounded">anomalia</span>
                        </div>
                      </div>
                      <span className="text-white/30 text-[9px] font-mono border border-white/8 px-2 py-1 rounded">Em análise</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-white/6 rounded-full w-full" />
                      <div className="h-1.5 bg-white/4 rounded-full w-2/3" />
                    </div>
                  </div>

                  {/* ranking */}
                  <div className="bg-[#111111] border border-white/5 rounded-lg p-4">
                    <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3">Ranking da Semana</p>
                    {[
                      { i:"AK", n:"Alex Kimura",    p:"4.820", top:true  },
                      { i:"RS", n:"Rafael Santos",  p:"2.110", top:false },
                      { i:"LM", n:"Lara Moura",     p:"980",   top:false },
                    ].map((r,idx) => (
                      <div key={idx} className="flex items-center gap-2.5 mb-2 last:mb-0">
                        <span className="text-[9px] font-mono text-white/20 w-4 text-center">{idx+1}</span>
                        <div className="w-6 h-6 rounded bg-white/4 border border-white/6 flex items-center justify-center">
                          <span className="text-[9px] font-black font-mono text-white/40">{r.i}</span>
                        </div>
                        <span className="text-white/50 text-xs flex-1 truncate">{r.n}</span>
                        <span className={`text-[10px] font-mono font-bold ${r.top ? "text-[#a1a1aa]" : "text-white/25"}`}>{r.p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* badge pts */}
              <div className="absolute -bottom-4 -left-5 bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#a1a1aa] shrink-0">
                  <Ico.Coin />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">+300 pts</p>
                  <p className="text-white/25 text-[10px] font-mono">Bug aprovado pelo admin</p>
                </div>
              </div>

              {/* badge tester */}
              <div className="absolute -top-4 -right-4 bg-[#18181b] border border-white/10 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-white/40 shrink-0">
                  <Ico.User />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Novo tester</p>
                  <p className="text-white/25 text-[10px] font-mono">App Founder · +50 pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <Ico.Down />
        </div>
      </section>

      {/* DOR */}
      <section className="py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-white/25 uppercase tracking-widest mb-3">Parece familiar?</p>
            <h2 className="text-3xl md:text-4xl font-black">A dor de todo dev independente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {PAINS.map((p, i) => (
              <div key={i} className="bg-[#111111] p-8 space-y-4">
                <p className="text-white/40 text-sm leading-relaxed italic border-l-2 border-white/8 pl-4">&ldquo;{p.p}&rdquo;</p>
                <div className="flex items-start gap-2.5 pl-4">
                  <span className="text-[#a1a1aa] mt-0.5 shrink-0"><Ico.Check /></span>
                  <p className="text-white/50 text-sm leading-relaxed">{p.f}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-white/25 uppercase tracking-widest mb-3">O que você vai encontrar</p>
            <h2 className="text-3xl md:text-4xl font-black">Tudo que um dev precisa num só lugar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-[#111111] p-8 space-y-4 hover:bg-[#1a1a1a] transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-white/40 group-hover:text-[#a1a1aa] group-hover:border-white/15 transition-all">
                  <f.I />
                </div>
                <h3 className="text-sm font-bold text-white">{f.t}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-white/25 uppercase tracking-widest mb-3">Dois lados da mesma moeda</p>
            <h2 className="text-3xl md:text-4xl font-black">Para quem é a UpzLab?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">

            <div id="testers" className="bg-[#111111] p-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-white/40">
                  <Ico.User />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Dev Tester</h3>
                  <p className="text-white/25 text-xs font-mono mt-0.5">Para quem quer contribuir e ser reconhecido</p>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">Você tem skill técnico e olho crítico. Quer ir além do código, ganhar reconhecimento e ser recompensado por contribuições reais.</p>
              <ul className="space-y-3">
                {["Acesse apps em beta antes de todo mundo","Reporte bugs com qualidade técnica e ganhe pontos","Suba no ranking e construa um portfólio público","Transfira pontos ou use para acessar modelos de IA"].map((item,j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-white/50">
                    <span className="text-[#a1a1aa] mt-0.5 shrink-0"><Ico.Check /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center py-3 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 font-bold text-sm transition-all">
                Quero ser um tester
              </Link>
            </div>

            <div id="criadores" className="bg-[#111111] p-10 space-y-6 border-t md:border-t-0 md:border-l border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-white/40">
                  <Ico.App />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Criador de App</h3>
                  <p className="text-white/25 text-xs font-mono mt-0.5">Para quem quer lançar com qualidade</p>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">Você desenvolveu um app e quer chegar na Play Store sem surpresas. Sem depender de amigos para testar ou de críticas na loja.</p>
              <ul className="space-y-3">
                {["Cadastre seu app e defina recompensa em UpzPoints","Recrute devs qualificados da comunidade","Receba reports com código, steps e evidências","Acompanhe métricas no Studio Labs em tempo real"].map((item,j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-white/50">
                    <span className="text-[#a1a1aa] mt-0.5 shrink-0"><Ico.Check /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className="block text-center py-3 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-bold text-sm transition-all">
                Quero publicar meu app
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* UPZPOINTS */}
      <section id="points" className="py-24 px-5 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-white/25 uppercase tracking-widest mb-3">Economia da comunidade</p>
            <h2 className="text-3xl md:text-4xl font-black">Ganhe UpzPoints por cada contribuição</h2>
            <p className="text-white/35 mt-4 max-w-xl mx-auto text-base">Pontos que valem de verdade. Sem expiração, sem truques.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 mb-6">
            {REWARDS.map((r, i) => (
              <div key={i} className="bg-[#111111] flex items-center gap-4 px-6 py-4">
                <div className="w-1 h-6 rounded-full bg-white/15 shrink-0" />
                <p className="text-white/50 text-sm flex-1">{r.l}</p>
                <span className="font-black font-mono text-[#a1a1aa] text-sm shrink-0">{r.pts}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#a1a1aa] shrink-0">
              <Ico.Coin />
            </div>
            <p className="text-white/50 text-sm">
              <strong className="text-white">Bônus de boas-vindas:</strong> +100 UpzPoints ao criar sua conta — sem nenhum pré-requisito.
            </p>
          </div>
        </div>
      </section>

      {/* PATENTES */}
      <section className="py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-mono text-white/25 uppercase tracking-widest mb-3">Sistema de reputação</p>
            <h2 className="text-3xl md:text-4xl font-black">Construa sua reputação técnica</h2>
            <p className="text-white/35 mt-4 max-w-xl mx-auto">Seu perfil público mostra patentes, badges e histórico — um portfólio técnico vivo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {LEVELS.map((l, i) => (
              <div key={i} className={`bg-[#111111] p-7 space-y-3 relative ${l.elite ? "border-l border-white/10" : ""}`}>
                {l.elite && <div className="absolute top-0 right-0 bg-[#27272a] text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-bl-lg">Elite</div>}
                <p className="text-[10px] font-mono text-white/20">{l.n}</p>
                <p className={`text-base font-black ${l.elite ? "text-[#a1a1aa]" : "text-white"}`}>{l.name}</p>
                <p className="text-[11px] font-mono text-white/25">{l.pts}</p>
                <p className="text-white/35 text-xs leading-relaxed">{l.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black">O que a comunidade diz</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#111111] p-8 space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_,s) => <span key={s} className="text-white/20"><Ico.Star /></span>)}
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed">&ldquo;{t.t}&rdquo;</p>
                </div>
                <div>
                  <p className="text-white/70 font-semibold text-sm">{t.name}</p>
                  <p className="text-white/25 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-5 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-white/[0.02] rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-mono font-semibold text-white/40 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
            +100 pts esperando por você
          </div>
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Pronto para construir sua reputação como dev?
          </h2>
          <p className="text-white/35 text-lg leading-relaxed">
            Junte-se à comunidade. Teste apps reais, reporte bugs que importam e colha os pontos.
          </p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-[#6366f1] hover:bg-[#818cf8] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-2xl shadow-black/60 hover:-translate-y-px">
            Criar conta grátis — começa agora <Ico.Arrow />
          </Link>
          <p className="text-white/20 text-xs font-mono">Grátis · Sem cartão · Menos de 1 minuto</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo h="h-5" />
            <span className="text-white/25 text-sm">© {new Date().getFullYear()} UpzLab</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/25">
            {["Privacidade","Termos","Publicidade"].map((l,i) => (
              <Link key={i} href={`/${l.toLowerCase()}`} className="hover:text-white/60 transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
