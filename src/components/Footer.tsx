"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/comunidade")) {
    return null;
  }
  return (
    <footer className="w-full bg-[#060911] text-slate-300 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
      
      {/* Ambient Glow sutil no rodapé */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#131D33]/30 blur-[180px] pointer-events-none rounded-full"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Grid de 4 Colunas no Rodapé */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-16 border-b border-slate-800/80">
          
          {/* Coluna 1: Marca & Missão (2 colunas no lg) */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block">
              <img src="/logo.webp" alt="É Golpe" width="120" height="36" loading="lazy" decoding="async" className="h-9 w-auto object-contain" />
            </Link>

            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              Tecnologia 100% brasileira desenvolvida para identificar, bloquear e neutralizar chamadas golpistas e números clonados antes de tocarem no celular.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-[#131D33] border border-slate-700/60 text-[#00FF87] text-xs font-mono font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
                <span>SISTEMA ATIVO</span>
              </div>
              <span className="text-xs text-slate-300 font-mono">v1.2 Nativo Android</span>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="space-y-4">
            <p className="text-white font-bold text-sm uppercase tracking-wider font-mono">Navegação</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/sobre" className="hover:text-[#00FF87] transition-colors flex items-center gap-1.5">
                  <span>Sobre Nós</span>
                </Link>
              </li>
              <li>
                <Link href="/problema" className="hover:text-[#00FF87] transition-colors">
                  O Problema
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-[#00FF87] transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/tecnologia" className="hover:text-[#00FF87] transition-colors">
                  Tecnologia
                </Link>
              </li>
              <li>
                <Link href="/diferenciais" className="hover:text-[#00FF87] transition-colors">
                  Diferenciais
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Suporte & FAQ */}
          <div className="space-y-4">
            <p className="text-white font-bold text-sm uppercase tracking-wider font-mono">Atendimento</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/faq" className="hover:text-[#00FF87] transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-[#00FF87] transition-colors">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/comunidade" className="hover:text-[#00FF87] transition-colors text-[#00FF87] font-semibold">
                  Comunidade UPZ Lab
                </Link>
              </li>
              <li>
                <Link href="/beta" className="hover:text-[#00FF87] transition-colors text-slate-300 font-semibold">
                  Entrar no Beta Fechado
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Legal & Transparência */}
          <div className="space-y-4">
            <p className="text-white font-bold text-sm uppercase tracking-wider font-mono">Privacidade</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacidade" className="hover:text-[#00FF87] transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-[#00FF87] transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-300 leading-snug">
                Conformidade total com a Lei Geral de Proteção de Dados (LGPD).
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Inferior: Copyright & Créditos */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-300">
          <p>© {new Date().getFullYear()} É Golpe Shield Project. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span>Desenvolvido no Brasil</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <span>Sem Rastreadores de Terceiros</span>
          </div>
        </div>

      </div>

    </footer>
  );
}
