import sys
import os

# Adiciona o diretório atual ao PYTHONPATH para importar os módulos do app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from app.models.faq_models import FaqDoc

def seed_faq():
    db = SessionLocal()
    try:
        # Limpa a tabela antes de popular (garante que sempre teremos a versão mais atualizada)
        db.query(FaqDoc).delete()
        db.commit()

        docs = [
            FaqDoc(
                title="O que é a UpzLab?",
                category="Institucional",
                content="""
A **UpzLab** é uma plataforma e comunidade voltada para desenvolvedores e testadores de aplicativos (foco em B2B e B2C). 
O nosso objetivo principal é conectar criadores de aplicativos independentes com testadores qualificados (outros devs), ajudando todos a alcançarem a excelência antes de um lançamento oficial nas grandes lojas (como Google Play Store e Apple App Store).
"""
            ),
            FaqDoc(
                title="Como funciona a UpzLab?",
                category="Institucional",
                content="""
A plataforma opera baseada em uma economia colaborativa. Desenvolvedores publicam seus aplicativos na seção de **Beta Products** para que outros membros da comunidade se voluntariem como testadores.
A dinâmica principal envolve testar os apps de colegas, fornecer feedbacks construtivos (relatórios de bugs) e, em troca, ganhar a nossa moeda virtual, os **UpzPoints**. Esses pontos podem ser usados para atrair testadores para o seu próprio app ou doados para outros membros.
"""
            ),
            FaqDoc(
                title="Por que usar a UpzLab?",
                category="Institucional",
                content="""
Usar a UpzLab traz inúmeros benefícios:
1. Ajuda você a cumprir com facilidade a nova política do Google Play (exigência de 20 testadores por 14 dias contínuos).
2. Garante que seu app seja testado por desenvolvedores experientes que sabem como encontrar bugs difíceis.
3. Economiza custos de QA (Garantia de Qualidade) terceirizado.
4. Gera uma rede de networking forte com outros desenvolvedores do mercado.
"""
            ),
            FaqDoc(
                title="Direitos Autorais e Regras de Nomes de Aplicativos",
                category="Regras",
                content="""
A UpzLab respeita integralmente a propriedade intelectual. **NÃO É PERMITIDO** usar ou registrar aplicativos que contenham o mesmo nome ou identidade visual de aplicativos já consolidados no mercado (marcas registradas) ou de aplicativos de outros usuários já existentes na comunidade.
Aplicativos que violarem as políticas de direitos autorais ou tentarem clonar ideias alheias sem autorização serão sumariamente removidos e o desenvolvedor poderá ter a conta suspensa.
"""
            ),
            FaqDoc(
                title="Implementações Futuras e Integrações",
                category="Futuro",
                content="""
A UpzLab está sempre em expansão. Uma das grandes funcionalidades em nosso radar para o futuro próximo é a integração oficial com o **Firebase App Distribution**. 
Com essa novidade, a distribuição dos pacotes (APK, AAB, IPA) para os testadores será feita de maneira muito mais automatizada, ágil e fechada, eliminando a dependência excessiva de links externos.
"""
            ),
            FaqDoc(
                title="O que são UpzPoints e como ganhar?",
                category="Economia / UpzPoints",
                content="""
**UpzPoints** é a moeda virtual oficial da UpzLab Community.

Você pode ganhar UpzPoints das seguintes maneiras:
1. **Reportando Bugs (Bug Bounty):** Ao encontrar e relatar bugs em aplicativos na fase Beta.
2. **Engajamento na Comunidade:** Ajudando outros desenvolvedores, respondendo dúvidas no feed ou participando de testes ativos.
3. **Sendo um Tester Oficial:** Cadastrando-se como tester nos aplicativos publicados na plataforma.
"""
            ),
            FaqDoc(
                title="O que é o Boost (Impulsionar App)?",
                category="Aplicativos",
                content="""
O **Boost** é uma ferramenta de marketing interno da UpzLab. Se você publicou um aplicativo e precisa de testadores rapidamente, você pode gastar seus **UpzPoints** para impulsionar (Boost) o seu app.
Ao ativar o Boost na página do seu aplicativo, ele ganhará destaque na aba de **Explorar Apps** e no feed, atraindo muito mais olhares e testadores em menos tempo.
Você pode desativar o Boost a qualquer momento se já tiver alcançado sua meta de testadores.
"""
            ),
            FaqDoc(
                title="Seguidores e Acompanhamento de Apps (Follow)",
                category="Aplicativos",
                content="""
Mesmo que você não seja um tester oficial no momento, você pode **Seguir (Follow)** um aplicativo que achou interessante.
Basta entrar na página do app e clicar em Seguir. Você passará a receber notificações sobre as atualizações, lançamentos de novas versões e novidades que o criador daquele app postar no Feed da Comunidade.
"""
            ),
            FaqDoc(
                title="O Feed da Comunidade e Menções (@)",
                category="Social",
                content="""
O **Feed da Comunidade** é o coração social da UpzLab. Lá, os desenvolvedores compartilham atualizações, feedbacks públicos e dicas.
- Você pode **Curtir (Like)** e **Comentar** nas postagens.
- Você pode usar **Menções (@)**. Ao digitar `@username` em um post ou comentário, o desenvolvedor mencionado receberá um alerta direto na aba de Notificações, facilitando a comunicação entre a equipe de testes e o criador.
"""
            ),
            FaqDoc(
                title="Como funciona o Ranking de Devs (Leaderboard)?",
                category="Gamificação",
                content="""
A UpzLab possui um **Ranking** oficial na comunidade. Esse Ranking destaca os desenvolvedores e testadores mais ativos e colaborativos da plataforma.
Ele é baseado na quantidade de UpzPoints ganhos, feedbacks enviados aprovados e engajamento no feed. Estar no topo do ranking aumenta sua reputação na comunidade e atrai mais confiança para os seus próprios aplicativos.
"""
            ),
            FaqDoc(
                title="Extrato e Carteira de Pontos",
                category="Economia / UpzPoints",
                content="""
Você pode acompanhar todas as movimentações da sua moeda no menu **Extrato de Pontos (Statement)**. 
Lá fica registrado um histórico completo e transparente de cada UpzPoint que você ganhou testando apps, os pontos que gastou fazendo Boost, e as transferências realizadas para outros membros da comunidade.
"""
            ),
            FaqDoc(
                title="Notificações do Sistema",
                category="Social",
                content="""
No topo do painel, você tem o menu de **Notificações**. Ele avisa em tempo real sobre eventos críticos:
- Quando alguém menciona você (@username) no Feed.
- Quando seu app recebe um novo Feedback de Bug.
- Quando alguém transfere UpzPoints para sua carteira.
- Avisos do administrador.
"""
            ),
            FaqDoc(
                title="Como publicar um aplicativo Beta na UpzLab?",
                category="Aplicativos",
                content="""
Para publicar seu aplicativo para receber testes:
1. Acesse o menu **Meus Apps** no painel da UpzLab.
2. Clique em **Adicionar Novo App**.
3. Preencha as informações: Nome, Tagline, Descrição, Plataforma e Categoria.
4. **Importante:** Forneça o `Link de Download` e o `Link do Grupo do Google/WhatsApp`.
5. O app ficará listado no painel da Comunidade.
"""
            ),
            FaqDoc(
                title="Como me tornar um Tester de um aplicativo?",
                category="Testers",
                content="""
1. Vá até a aba **Explorar Apps**.
2. Clique no aplicativo que deseja testar.
3. Na página do app, clique no botão **Participar como Tester**.
4. O sistema enviará automaticamente um e-mail de instruções para você com os links oficiais.
"""
            ),
            FaqDoc(
                title="Como transferir UpzPoints para outro desenvolvedor?",
                category="Economia / UpzPoints",
                content="""
1. Acesse sua **Carteira**.
2. Clique em **Transferir Pontos**.
3. Selecione o nome do desenvolvedor na lista.
4. Digite a quantidade de pontos e confirme. Os pontos cairão na hora na carteira do colega!
"""
            ),
            FaqDoc(
                title="Como enviar um relatório de Bug (Feedback)?",
                category="Feedback",
                content="""
1. Vá no menu **Feedback e Bugs**.
2. Selecione qual aplicativo você estava testando.
3. Anexe prints ou vídeos.
4. Descreva o passo a passo para reproduzir o erro.
5. O dono do app receberá uma notificação e poderá te recompensar com UpzPoints.
"""
            )
        ]

        for doc in docs:
            db.add(doc)
        
        db.commit()
        print(f"Tabela faq_docs populada com sucesso ({len(docs)} artigos adicionados)!")

    except Exception as e:
        db.rollback()
        print(f"Erro ao popular o banco de dados: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_faq()
