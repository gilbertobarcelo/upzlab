import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacidade da Saúde do Consumidor | UpzLab" };

export default function Page() {
  return (
    <LegalPage title="Privacidade da Saúde do Consumidor" updated="14 de outubro de 2026">
      <p>A UpzLab não coleta, não solicita e não processa dados de saúde dos usuários.</p>
      <p>Apps de terceiros testados na plataforma são responsabilidade de seus desenvolvedores. Não envie dados de saúde ou informações sensíveis em feedbacks, publicações ou perfil.</p>
      <p>Dúvidas: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
