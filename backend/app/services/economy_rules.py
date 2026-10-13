"""
UpzLab - Economy Rules (Single Source of Truth)
Define todos os valores de UpzPoints do sistema em um único lugar
para evitar "hardcoding" espalhado pelas rotas e modelos.
"""

class UpzPointsReward:
    # 1. Ações Fundamentais (App Founder)
    APP_FOUNDER_DOWNLOAD = 500
    MONTHLY_RETENTION = 150

    # 2. Indicação e Afiliados
    REFERRAL_BONUS = 50

    # 3. Cadastro e Onboarding
    ACCOUNT_CREATED = 100        # Bônus ao criar conta na comunidade
    TESTER_JOIN_APP = 500        # Bônus ao se cadastrar como tester de um app
    APP_PUBLISHED = 150          # Bônus ao publicar um app na vitrine

    # 4. Qualidade de Teste (Feedbacks e Bugs)
    DAILY_APP_OPEN = 50          # Check-in diário validado pelo SDK
    POST_CREATED = 10            # Publicar no feed da comunidade
    FEEDBACK_UX_APPROVED = 50
    BUG_MINOR_APPROVED = 100
    BUG_MAJOR_APPROVED = 500
    BUG_CRITICAL_APPROVED = 1000

    # 5. Integrações
    GITHUB_SYNC_BASE = 100

    # 6. Eventos Especiais
    PROFILE_100_PERCENT = 100

class UpzPointsCost:
    # Custos que o dono de app paga para publicar
    LAUNCH_BETA_CAMPAIGN_BASE = 1000
    REQUIRE_ELITE_TESTERS = 500 # Adicional por segmentação

    # Boost de app no feed da comunidade (duração: 7 dias)
    BOOST_FEED   = 500    # Nível 1 — prioridade no rodízio
    BOOST_PINNED = 1000   # Nível 2 — posição fixa (3º card)
    BOOST_ELITE  = 1500   # Nível 3 — primeiro do feed + banner (requer White Hat+)
    BOOST_DURATION_DAYS = 7
