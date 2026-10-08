import re
from sqlalchemy.orm import Session
from app.models.dev_tester_models import DevProfile, DevNotification

def extract_mentions(text: str) -> list[str]:
    """
    Extrai todos os usernames mencionados num texto.
    Padrões aceitos: @username ou u/username
    Regras para username: letras, números, _ e .
    """
    if not text:
        return []
        
    # Regex to find com.username
    # Allowed chars: a-z, A-Z, 0-9, _, .
    pattern = r'com\.([a-zA-Z0-9_\.]+)'
    matches = re.findall(pattern, text)
    
    # Retorna usernames únicos em lowercase para busca
    return list(set(m.lower() for m in matches if m))

def process_mentions_and_notify(db: Session, text: str, sender_name: str, context_url: str, context_title: str):
    """
    Processa um texto, encontra as menções e envia notificações para os usuários marcados.
    
    :param text: Texto completo (ex: comentário ou post)
    :param sender_name: Nome do usuário que fez a menção (ex: "Gilberto")
    :param context_url: URL para onde a notificação vai redirecionar (ex: "/comunidade/post/123")
    :param context_title: Título do local da menção (ex: "Report de Bug no App")
    """
    usernames = extract_mentions(text)
    if not usernames:
        return

    # Busca os DevProfiles com esses usernames
    mentioned_users = db.query(DevProfile).filter(
        DevProfile.username.in_(usernames)
    ).all()
    
    for user in mentioned_users:
        # Cria notificação
        notif = DevNotification(
            dev_id=user.user_id,
            title="Você foi mencionado!",
            body=f"{sender_name} mencionou você em: {context_title}",
            icon="at-sign",
            color="indigo"
        )
        db.add(notif)
    
    # Deixa o commit() para ser chamado por quem invocou o serviço
