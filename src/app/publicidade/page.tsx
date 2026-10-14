import type { Metadata } from "next";
import LegalPage, { CONTACT_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Publicidade | UpzLab" };

export default function Page() {
  return (
    <LegalPage title="Publicidade" updated="14 de outubro de 2026">
      <p>Os apps promovidos na barra lateral da comunidade são campanhas ativadas por desenvolvedores no Lab Studio, em troca de pontos para testers.</p>
      <p>Para divulgar seu app ou propor uma parceria: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
