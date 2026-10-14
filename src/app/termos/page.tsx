import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Termos de Uso | UpzLab" };

export default function Page() {
  return (
    <LegalPage title="Termos de Uso" updated="14 de outubro de 2026">
      <p>Ao usar a UpzLab você concorda com estes termos.</p>
      <h2>A plataforma</h2>
      <p>A UpzLab é uma comunidade onde desenvolvedores apresentam apps, organizam testes e trocam feedback.</p>
      <h2>Sua conta</h2>
      <ul>
        <li>Você deve fornecer dados verdadeiros e manter sua senha em segurança.</li>
        <li>É proibido criar contas falsas ou múltiplas para obter pontos ou vantagens.</li>
      </ul>
      <h2>Conteúdo e conduta</h2>
      <ul>
        <li>Você é responsável pelo que publica e deve ter direitos sobre isso.</li>
        <li>Não publique conteúdo ilegal, ofensivo, malicioso ou que viole direitos de terceiros.</li>
        <li>Feedbacks de teste devem ser honestos e feitos de boa-fé.</li>
      </ul>
      <h2>Pontos e recompensas</h2>
      <p>Pontos e recompensas seguem as regras vigentes da plataforma e podem ser ajustados ou cancelados em caso de fraude.</p>
      <h2>Suspensão</h2>
      <p>Podemos suspender ou encerrar contas que violem estes termos.</p>
      <h2>Alterações e contato</h2>
      <p>Podemos atualizar estes termos; o uso continuado indica aceitação. Dúvidas: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
