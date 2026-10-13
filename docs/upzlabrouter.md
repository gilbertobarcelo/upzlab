# UpzLabRouter

O UpzLabRouter expõe uma API de chat compatível com o formato de chat completions da OpenAI. A URL base local é `http://127.0.0.1:8001/api/upzlabrouter`.

## Configuração do backend

Defina a chave da Novita em `backend/novita.env`:

```env
NOVITA_API_KEY=...
```

Esse arquivo é local e está excluído do Git. As demais credenciais de provedores continuam no `backend/.env`.

As tabelas do roteador são criadas pelo `backend/main.py` junto com as demais tabelas. As cotas diárias são contabilizadas por provedor e resetadas em UTC.

O catálogo e o playground do dashboard consultam `https://api.novita.ai/openai/v1/models` no backend. A chave da Novita é mantida no servidor e nunca enviada ao navegador. Nesta etapa, somente modelos com preço de entrada e saída igual a zero são exibidos e executados; modelos pagos são rejeitados antes da chamada e não são cobrados em UpzPoints.

O endpoint de chat LLM da Novita é integrado primeiro. Geração de áudio, imagem e vídeo usa APIs separadas e não está habilitada nesta etapa.

## Gerenciar chaves

As rotas de administração usam o JWT da sessão UpzLab:

- `POST /keys` com `{"name":"Meu app"}` cria uma chave `Lab_...`; o segredo integral é exibido somente nessa resposta.
- `GET /keys` lista prefixos e metadados, nunca o segredo.
- `DELETE /keys/{key_id}` revoga uma chave pertencente à conta autenticada.
- Chaves antigas com prefixo `upzlk_` continuam válidas; chaves novas usam `Lab_`.

Envie o JWT da comunidade como `Authorization: Bearer <JWT>`. Guarde a chave criada em um gestor de segredos; não a inclua no código do navegador ou em repositório público.

## Catálogo e chat

Todas as requisições de uso do roteador exigem `Authorization: Bearer <UPZLAB_KEY>`.

- `GET /v1/models` lista modelos, preço, janela de contexto e cota disponível.
- `POST /v1/chat/completions` executa uma conversa.

Exemplo:

```json
{
  "model": "auto",
  "messages": [
    {"role": "user", "content": "Explique este erro Python."}
  ],
  "temperature": 0.2,
  "stream": false
}
```

`model` pode ser `auto`, `upzlab/code` ou `upzlab/research`. As mensagens aceitam `system`, `user` e `assistant`, com `content` textual. Parâmetros não suportados são rejeitados em vez de ignorados. A resposta inclui `choices`, `usage`, o provedor utilizado e `upzpoints_charged`. O catálogo atual contém modelos gratuitos. Streaming ainda não está implementado; `stream: true` retorna HTTP 400 explicitamente.

O roteador tenta os provedores configurados em sequência no modo `auto` e registra sucessos e falhas em `router_usage_log`. Erros de autenticação, saldo insuficiente, modelo desconhecido e falhas dos provedores são retornados com códigos HTTP distintos.

## Exemplo Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8001/api/upzlabrouter",
    api_key="Lab_sua_chave",
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Olá!"}],
)
print(response.choices[0].message.content)
```
