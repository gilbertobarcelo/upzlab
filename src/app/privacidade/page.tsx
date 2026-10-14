import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Política de Privacidade | UpzLab" };

export default function Page() {
  return (
    <LegalPage title="Política de Privacidade" updated="14 de outubro de 2026">
      <p>Esta política explica como a UpzLab (&quot;nós&quot;) trata os dados de quem usa a plataforma em upzlab.com.</p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li>Dados de cadastro: nome, nome de usuário, e-mail e foto de perfil.</li>
        <li>Dados de uso: apps cadastrados, testes realizados, feedbacks, publicações e pontuação.</li>
        <li>Dados de login social (GitHub, Facebook ou Google), quando você escolhe entrar por eles: identificador e nome público, e-mail e foto, conforme as permissões que você autorizar.</li>
        <li>Dados técnicos: endereço IP, tipo de navegador e registros de acesso, usados para segurança.</li>
      </ul>
      <h2>Como usamos</h2>
      <ul>
        <li>Operar a comunidade, os testes de apps e o ranking.</li>
        <li>Enviar e-mails de verificação e avisos da conta.</li>
        <li>Prevenir fraudes, contas falsas e abusos.</li>
        <li>Divulgar conteúdo da UpzLab em redes sociais, usando apenas conteúdo público da plataforma e contas da própria UpzLab.</li>
      </ul>
      <h2>Compartilhamento</h2>
      <p>Não vendemos seus dados. Compartilhamos apenas com provedores necessários à operação (hospedagem, e-mail, autenticação) e quando exigido por lei. Seu perfil público e suas publicações ficam visíveis a outros usuários.</p>
      <h2>Seus direitos</h2>
      <p>Você pode acessar, corrigir e excluir seus dados. Veja como em <a href="/exclusao-de-dados">Exclusão de dados do usuário</a>.</p>
      <h2>Retenção e segurança</h2>
      <p>Mantemos os dados enquanto sua conta existir. Usamos conexões criptografadas e controle de acesso.</p>
      <h2>Contato</h2>
      <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </LegalPage>
  );
}
