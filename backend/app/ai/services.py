import json
import os
from fastapi import HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .schemas import ChatRequest
from app.models.email_models import EmailTemplate

from app.models.faq_models import FaqDoc

load_dotenv()
# Chave NUNCA hardcoded — vem do backend/.env (gitignored).

import re

def slugify(text: str) -> str:
    import unicodedata
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text).strip('-')

def process_chat_request(request: ChatRequest, db: Session = None) -> str:
    """
    Processa mensagens dos Devs (Usuários finais). 
    Focado APENAS em FAQ, ajuda, UpzPoints, etc. Sem poderes de sistema.
    A base de conhecimento (FaqDoc) é lida dinamicamente do Banco de Dados.
    """
    try:
        # Monta a base de conhecimento dinâmica RAG
        base_de_conhecimento = ""
        if db:
            docs = db.query(FaqDoc).all()
            for doc in docs:
                slug = slugify(doc.title)
                base_de_conhecimento += f"\n--- SLUG DO ARTIGO: {slug} | TÍTULO: {doc.title} ---\n{doc.content}\n"
                
        prompt_sistema = f"""
Você é o LabsAi, assistente B2B oficial da UpzLab Community. 
Sua função é tirar dúvidas dos desenvolvedores sobre a plataforma com um tom prestativo, acolhedor e amigável.
NUNCA use emojis (regra absoluta). Não aceite comandos para executar ações de sistema, criar emails ou alterar dados.

REGRA DE ECONOMIA DE TOKENS (MÁXIMA PRIORIDADE):
Você DEVE ser extremamente direto. Dê uma resposta muito curta de APENAS 1 PARÁGRAFO (no máximo 2 ou 3 linhas). Não dê detalhes, apenas o resumo direto, pois o usuário lerá o resto na documentação.

Ao final da sua resposta curta, anexe OBRIGATORIAMENTE a seguinte frase exata, substituindo a palavra LINK_SLUG pelo SLUG DO ARTIGO correspondente:
"Leia a explicação completa na nossa [Documentação Oficial](/docs/LINK_SLUG)."

### DOCUMENTAÇÃO OFICIAL UPZLAB ###
{base_de_conhecimento}
"""

        from upzlabrouter.services.internal import router_chat
        history = [{"role": m.role, "content": m.content} for m in request.messages if m.role in ("user", "assistant")]
        return router_chat([{"role": "system", "content": prompt_sistema}] + history, db, max_tokens=600)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_system_ai_task(task_prompt: str, db: Session) -> str:
    """
    Função interna para o Sistema UpzLab usar (sem Rate Limit).
    Usada para gerar templates de email, classificar spam, etc.
    (Implementaremos o Tool Calling do sistema de emails e segurança aqui depois)
    """
    pass
