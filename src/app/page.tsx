"use client";

import Image from "next/image";
import Link from "next/link";
import UpzLabHeader from "@/components/UpzLabHeader";

function Logo({ h = "h-9" }: { h?: string }) {
  return <Image src="/upzlab-wordmark-v6.svg" alt="UpzLab" width={124} height={48} className={`${h} w-auto`} priority />;
}

const Ico = {
  Check: () => <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  Arrow: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>,
  Down:  () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>,
  Bug:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Coin:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  App:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  Doc:   () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Bolt:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  User:  () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  Star:  () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
};

const CAPABILITIES = [
  { n: "01", I: Ico.App, title: "Valide antes de lançar", text: "Apresente seu aplicativo a uma comunidade técnica e organize ciclos de teste com objetivos claros." },
  { n: "02", I: Ico.Bug, title: "Transforme feedback em ação", text: "Centralize reports, contexto de reprodução e evidências para priorizar correções com confiança." },
  { n: "03", I: Ico.Chart, title: "Construa reputação com trabalho real", text: "Registre contribuições aprovadas em um perfil técnico que evolui junto com sua experiência." },
];

const PRODUCTS = [
  { I: Ico.Bug, title: "Testes e feedback técnico", text: "Encontre problemas mais cedo com reports estruturados por quem entende de produto e desenvolvimento.", tag: "QUALITY" },
  { I: Ico.Chart, title: "Studio Labs", text: "Publique campanhas, acompanhe participação e gerencie o ciclo de testes do seu aplicativo.", tag: "DISTRIBUTION" },
  { I: Ico.Doc, title: "DocsLab", text: "Gere documentação a partir de repositórios e torne o contexto do projeto mais acessível.", tag: "DOCUMENTATION" },
  { I: Ico.Bolt, title: "UpzLabRouter", text: "Acesse modelos de linguagem por uma API unificada, com catálogo e uso vinculados à plataforma.", tag: "AI INFRASTRUCTURE" },
];

const REWARDS = [
  { points: "+100", action: "Criar uma conta na comunidade" },
  { points: "+50", action: "Participar como tester de um app" },
  { points: "+100–1k", action: "Ter um bug ou anomalia aprovado" },
  { points: "+150", action: "Publicar um app na vitrine" },
];

const LEVELS = [
  { level: "01", name: "Scanner", range: "0–499 pts", text: "O início da jornada." },
  { level: "02", name: "White Hat", range: "500–1.499 pts", text: "Consistência reconhecida." },
  { level: "03", name: "Bug Hunter", range: "1.500–2.999 pts", text: "Experiência em evidência." },
  { level: "04", name: "Cyber Ninja", range: "3.000+ pts", text: "Contribuição de alto impacto." },
];

function CodePreview() {
  const lines = [
    <><span className="text-white">export async function</span> <span className="text-white/75">reviewRelease</span>(</>,
    <>  <span className="text-white/65">app</span>: <span className="text-white/45">Application</span>,</>,
    <>  <span className="text-white/65">testers</span>: <span className="text-white/45">Developer[]</span>,</>,
    <>): <span className="text-white/45">Promise&lt;Report[]&gt;</span> {"{"}</>,
    <>  <span className="text-white">return</span> <span className="text-white/75">Promise.all</span>(</>,
    <>    <span className="text-white/65">testers</span>.<span className="text-white/75">map</span>((<span className="text-white/65">dev</span>) =&gt;</>,
    <>      <span className="text-white/75">collectFeedback</span>(<span className="text-white/65">app</span>, <span className="text-white/65">dev</span>)</>,
    <>    ),</>,
    <>  );</>,
    <>{"}"}</>,
  ];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#151719] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/10" />
        </div>
        <span className="font-mono text-[11px] text-white/55">src/community/review.ts</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-white/35">TypeScript</span>
      </div>
      <div className="px-3 py-5 sm:px-5 sm:py-6">
        <div className="overflow-x-auto">
          <pre className="min-w-max font-mono text-[11px] leading-7 sm:text-xs">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span className="mr-5 inline-block w-4 select-none text-right text-white/25">{index + 1}</span>
                <code className="text-white/55">{line}</code>
              </div>
            ))}
          </pre>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-3 font-mono text-[10px] text-white/40">
        <span>review · comunidade</span>
        <span>feedback → melhoria</span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#121416] text-[#e2e5e8] antialiased">

      {/* NAV */}
      <UpzLabHeader />

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
              <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-mono font-semibold text-white/55 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-[#67d8e8]" />
                COMUNIDADE DE DESENVOLVEDORES
              </div>

              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight">
                Seu app merece ser<br />
                <span className="text-white">testado de verdade.</span>
              </h1>

              <p className="text-[#aeb4bc] text-base sm:text-lg leading-relaxed max-w-lg">
                A UpzLab é uma comunidade de devs para devs. Teste produtos reais, compartilhe conhecimento e ajude projetos a evoluir antes do lançamento.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white hover:bg-white/90 text-[#101416] font-bold text-sm tracking-wide transition-all shadow-xl shadow-black/30 hover:-translate-y-px">
                  Entrar na comunidade <Ico.Arrow />
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-white/20 hover:border-white/40 text-white/75 hover:text-white font-semibold text-sm transition-all">
                  Já tenho conta
                </Link>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                {["Grátis para sempre", "Sem cartão de crédito", "Crie em menos de 1 min"].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-white/30">
                    <span className="text-white/60"><Ico.Check /></span>
                    {b}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-w-0">
              <CodePreview />
            </div>


          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-25">
          <Ico.Down />
        </div>
      </section>

      {/* POSITIONING */}
      <section className="border-y border-white/[0.08] bg-[#151719] px-5 py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.85fr_1.15fr] md:items-end">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Uma comunidade de devs para devs</p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Não somos uma startup. <span className="text-white/45">Somos uma comunidade que constrói junto.</span>
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-8 text-white/60 md:justify-self-end">
            A UpzLab é feita por desenvolvedores, para desenvolvedores: um espaço para compartilhar conhecimento, testar projetos reais e ajudar uns aos outros a criar software melhor.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 grid gap-5 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Um ciclo de qualidade contínua</p>
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">Do primeiro teste ao próximo release.</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-white/50 md:justify-self-end">
              Ferramentas conectadas para tirar o feedback do improviso e aproximar equipes de quem usa e testa seus produtos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {CAPABILITIES.map(({ n, I, title, text }) => (
              <article key={n} className="group relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#17191b] p-7 transition-colors hover:border-white/20 md:p-8">
                <div className="mb-12 flex items-center justify-between">
                  <span className="font-mono text-xs tracking-widest text-white/35">{n} / 03</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70"><I /></span>
                </div>
                <h3 className="mb-3 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="text-sm leading-7 text-white/50">{text}</p>
                <div className="absolute bottom-0 left-7 right-7 h-px bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity group-hover:opacity-100 md:left-8 md:right-8" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="border-y border-white/[0.08] bg-[#151719] px-5 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Uma comunidade, diferentes perspectivas</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">Feita para quem desenvolve e para quem testa.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <article id="testers" className="scroll-mt-24 rounded-xl border border-white/[0.09] bg-[#17191b] p-7 md:p-9">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/45">Para desenvolvedores</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Faça seu olhar técnico contar.</h3>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70"><Ico.User /></span>
              </div>
              <p className="mb-8 text-sm leading-7 text-white/55">Teste produtos em desenvolvimento, envie feedback útil e crie um histórico público baseado nas suas contribuições.</p>
              <ul className="mb-9 space-y-3 text-sm text-white/70">
                {["Acesse campanhas de teste da comunidade", "Registre bugs e feedback com contexto", "Evolua seu perfil e acumule UpzPoints"].map((item) => (
                  <li key={item} className="flex items-start gap-3"><span className="mt-0.5 text-white/55"><Ico.Check /></span>{item}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-white/70">Explorar como tester <Ico.Arrow /></Link>
            </article>

            <article id="criadores" className="scroll-mt-24 rounded-xl border border-white/[0.09] bg-[#17191b] p-7 md:p-9">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/45">Para criadores de produto</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Lance com mais contexto.</h3>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70"><Ico.App /></span>
              </div>
              <p className="mb-8 text-sm leading-7 text-white/55">Recrute pessoas para testar seu app, organize feedbacks em um fluxo único e acompanhe a atividade da campanha.</p>
              <ul className="mb-9 space-y-3 text-sm text-white/70">
                {["Apresente seu app e defina uma campanha", "Receba reports organizados para análise", "Acompanhe testers e métricas no Studio Labs"].map((item) => (
                  <li key={item} className="flex items-start gap-3"><span className="mt-0.5 text-white/55"><Ico.Check /></span>{item}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-white/70">Conhecer o Studio Labs <Ico.Arrow /></Link>
            </article>
          </div>
        </div>
      </section>

      {/* PRODUCT ECOSYSTEM */}
      <section className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Ecossistema UpzLab</p>
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">A infraestrutura para evoluir produtos digitais.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-white/50">Um conjunto integrado de ferramentas para qualidade, documentação e produtividade.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {PRODUCTS.map(({ I, title, text, tag }) => (
              <article key={title} className="relative min-h-64 overflow-hidden rounded-xl border border-white/[0.09] bg-[#17191b] p-7 md:p-8">
                <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-white/[0.04]" />
                <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full border border-white/[0.04]" />
                <div className="relative flex h-full flex-col">
                  <div className="mb-9 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70"><I /></span>
                    <span className="font-mono text-[10px] tracking-[0.18em] text-white/35">{tag}</span>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                  <p className="max-w-md text-sm leading-7 text-white/50">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTRIBUTION ECONOMY */}
      <section id="points" className="scroll-mt-20 border-y border-white/[0.08] bg-[#151719] px-5 py-24 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Economia de contribuições</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">Reconhecimento conectado à participação.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/55">UpzPoints acompanham ações elegíveis dentro da comunidade. Consulte o extrato e use seus pontos nos recursos disponíveis na plataforma.</p>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70"><Ico.Coin /></span>
              <p className="text-sm text-white/65">As recompensas são aplicadas após a validação da contribuição, conforme as regras da plataforma.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#17191b]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <span className="text-sm font-semibold">Exemplos de recompensas</span>
              <span className="font-mono text-[10px] tracking-widest text-white/35">UPZPOINTS</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {REWARDS.map(({ points, action }) => (
                <div key={action} className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-sm text-white/60">{action}</span>
                  <span className="shrink-0 rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-xs font-semibold text-white/75">{points}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.07] px-5 py-4 text-xs leading-6 text-white/40">
              Os valores apresentados são exemplos das regras atuais e podem variar conforme o tipo de ação e sua aprovação.
            </div>
          </div>
        </div>
      </section>

      {/* REPUTATION */}
      <section className="px-5 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Reputação técnica</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">Uma trajetória que fica visível.</h2>
            <p className="mt-5 text-sm leading-7 text-white/55">Seu nível evolui com os pontos acumulados e dá contexto à sua participação dentro da comunidade.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEVELS.map(({ level, name, range, text }) => (
              <article key={name} className="rounded-lg border border-white/[0.09] bg-[#17191b] p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-xs text-white/35">LEVEL {level}</span>
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-1 font-mono text-xs text-white/55">{range}</p>
                <p className="mt-4 text-sm text-white/45">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 md:pb-32">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/[0.09] bg-[#17191b] px-6 py-16 text-center md:px-12 md:py-20">
          <div className="relative mx-auto max-w-3xl">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-white/45">Seu próximo release começa aqui</p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">Construa com confiança. Evolua em comunidade.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">Crie seu perfil, encontre oportunidades para contribuir ou prepare seu aplicativo para os próximos usuários.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-[#101416] transition hover:bg-white/90">
                Criar conta <Ico.Arrow />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/10 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/35 hover:bg-white/[0.05]">
                Já tenho uma conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.08] px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo h="h-7" />
            <span className="text-xs text-white/35">© {new Date().getFullYear()} UpzLab. Tecnologia para produtos melhores.</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/45">
            <Link href="/docs" className="transition hover:text-white">Documentação</Link>
            <Link href="/login" className="transition hover:text-white">Entrar</Link>
            <Link href="/cadastro" className="transition hover:text-white">Criar conta</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
