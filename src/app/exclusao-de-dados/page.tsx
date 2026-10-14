import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Exclusão de dados do usuário | UpzLab" };

export default function Page() {
  return (
    <LegalPage title="Exclusão de dados do usuário" updated="14 de outubro de 2026">
      <p>Você pode pedir a exclusão da sua conta e dos dados associados a ela na UpzLab, incluindo dados recebidos por login com Facebook, GitHub ou Google.</p>
      <h2>Como excluir</h2>
      <ul>
        <li>Envie um e-mail para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> com o assunto &quot;Exclusão de dados&quot;, a partir do e-mail cadastrado na conta, informando seu nome de usuário.</li>
        <li>Se entrou com o Facebook, você também pode remover o app UpzLab em Configurações do Facebook → Segurança e login → Apps e sites.</li>
      </ul>
      <h2>O que acontece</h2>
      <ul>
        <li>Em até 30 dias, removemos seu perfil, e-mail, foto e dados de login social.</li>
        <li>Publicações e feedbacks podem ser anonimizados quando necessários para a integridade dos testes de outros usuários.</li>
        <li>Registros exigidos por lei ou segurança podem ser mantidos pelo prazo legal.</li>
      </ul>
      <p>Você receberá uma confirmação por e-mail quando a exclusão for concluída.</p>
    </LegalPage>
  );
}
