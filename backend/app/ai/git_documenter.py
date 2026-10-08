import os
import shutil
import tempfile
import subprocess
import requests
from sqlalchemy.orm import Session
from app.models.auto_docs_models import AutoDocApp, AutoDocFile
from database.database import SessionLocal
import json

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Modelos gratuitos em ordem de preferência.
# Enviados no parâmetro "models" do OpenRouter: se o primeiro falhar (429, indisponível,
# timeout do provedor), o próprio OpenRouter tenta o próximo na mesma requisição.
MODELS = [
    "cohere/north-mini-code:free",       # rápido, bom para código
    "nvidia/nemotron-3.5-lightning:free", # fallback confiável
    "apodex/apodex-1.1-mini:free",        # fallback original
]
# Usar a chave definida no services ou injetar via ENV (NUNCA hardcoded)
from dotenv import load_dotenv
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()

# Extensões que queremos ler e documentar (ignorar imagens, dependências, etc)
ALLOWED_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.java', '.c', '.cpp', '.rb', '.php', '.md'}
IGNORED_DIRS = {'node_modules', '.git', 'venv', '.venv', '__pycache__', 'dist', 'build', '.next'}

# Itens que nunca entram na doc publica (testes, infra, deploy, scripts internos)
PUBLIC_IGNORED_DIR_PARTS = {'tests', 'test', '__tests__', 'middleware', 'migrations', 'scripts', 'core', 'config'}
PUBLIC_IGNORED_NAME_HINTS = ('test_', 'conftest', 'deploy', 'checklist', '__init__', 'setup', 'update_', 'seed', 'migrate')

# Limites para não travar o processo
MAX_PUBLIC_FILES = 10   # doc pública: máximo de arquivos analisados
MAX_TECH_FILES   = 15   # doc técnica: máximo de arquivos analisados
LLM_TIMEOUT      = 45  # segundos por chamada à IA

PUBLIC_SECTION_MARKER = "===SECAO==="


def is_relevant_for_public(rel_path: str) -> bool:
    """Filtra arquivos que nao interessam ao testador/usuario final."""
    parts = [p.lower() for p in rel_path.replace('\\', '/').split('/')]
    if any(p in PUBLIC_IGNORED_DIR_PARTS for p in parts[:-1]):
        return False
    name = parts[-1]
    if any(h in name for h in PUBLIC_IGNORED_NAME_HINTS):
        return False
    return True


def call_llm(prompt: str, timeout: int = LLM_TIMEOUT, retries: int = 3) -> str:
    """Chama o OpenRouter com fallback nativo entre MODELS.

    O roteamento entre modelos é feito pelo OpenRouter (parâmetro "models").
    Aqui só refazemos a requisição com backoff quando TODOS os modelos
    retornam rate limit (429) ou ocorre erro de rede/5xx.
    """
    import time
    if not OPENROUTER_API_KEY:
        raise Exception("OPENROUTER_API_KEY não configurada")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "models": MODELS,
        "messages": [{"role": "user", "content": prompt}],
    }

    last_err = None
    for attempt in range(retries):
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=timeout)

            if response.status_code == 429 or response.status_code >= 500:
                wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                last_err = Exception(f"OpenRouter {response.status_code}: {response.text[:200]}")
                print(f"[AutoDocs] {response.status_code} em todos os modelos, aguardando {wait}s...")
                time.sleep(wait)
                continue

            if response.status_code != 200:
                # 400/401/402/403: erro de configuração, não adianta repetir
                raise Exception(f"OpenRouter {response.status_code}: {response.text[:300]}")

            body = response.json()
            if "error" in body:
                raise Exception(f"OpenRouter erro: {str(body['error'])[:300]}")

            print(f"[AutoDocs] Resposta gerada por {body.get('model', '?')}")
            return body["choices"][0]["message"]["content"]

        except requests.exceptions.RequestException as e:
            last_err = e
            wait = 2 ** (attempt + 1)
            print(f"[AutoDocs] Erro de rede ({e}), aguardando {wait}s...")
            time.sleep(wait)

    raise last_err or Exception("Todos os modelos falharam")


def extract_features_for_public(code_content: str) -> str:
    """Fase 1 da doc publica: extrai apenas funcionalidades visiveis ao usuario, sem citar arquivo."""
    prompt = f"""
Leia o codigo abaixo e liste, em portugues, APENAS as funcionalidades que um usuario final ou testador do aplicativo consegue ver ou usar (telas, acoes, fluxos, regras visiveis).

Regras:
- Nao cite nomes de arquivos, pastas, funcoes, classes ou variaveis.
- Nao descreva como foi implementado (banco, seguranca, validacoes internas, queries, chaves).
- Responda em no maximo 8 topicos curtos.
- Se o codigo nao tiver nada relevante para quem usa o app, responda exatamente: IRRELEVANTE

CODIGO:
```
{code_content[:12000]}
```
"""
    return call_llm(prompt).strip()


def build_public_doc(app_name: str, feature_notes: list) -> list:
    """Fase 2 da doc publica: organiza as funcionalidades em secoes com titulos. Retorna [(titulo, conteudo)]."""
    notes = "\n\n".join(f"- {n}" for n in feature_notes)[:20000]
    prompt = f"""
Voce e um Educador de Produto da UpzLab.

Contexto: a UpzLab e uma plataforma e comunidade que conecta criadores de aplicativos independentes (B2B e B2C) com testadores qualificados (outros devs), para que os apps alcancem excelencia antes do lancamento na Google Play Store e na Apple App Store.

Objetivo desta documentacao publica: esclarecer e ajudar o testador ou o usuario a entender O QUE o aplicativo "{app_name}" faz e COMO usa-lo, para que ele consiga testar bem.

Abaixo estao anotacoes das funcionalidades encontradas no app. Organize tudo em uma documentacao por FUNCIONALIDADE (nao por arquivo).

Regras obrigatorias:
1. NUNCA cite nomes de arquivos, pastas, caminhos, funcoes, classes ou tecnologias internas.
2. Cada secao deve ter um titulo claro do ponto de vista de quem usa (ex: "Visao Geral do App", "Como criar sua conta e fazer login", "Navegando pelas categorias").
3. Agrupe funcionalidades parecidas em uma unica secao.
4. Linguagem clara, amigavel e objetiva, com passos de uso quando fizer sentido.
5. Nao inclua codigo. A unica excecao e um exemplo de uso de API publica do app, se for realmente necessario, sem expor logica interna.
6. Nao use emojis.
7. A PRIMEIRA secao deve ser "Visao Geral do App" e a ULTIMA secao deve ser "Pontos Sugeridos para Teste", com os fluxos principais que o testador deve validar.
8. Gere entre 4 e 10 secoes.

Formato de saida OBRIGATORIO: cada secao comeca com uma linha contendo apenas {PUBLIC_SECTION_MARKER}, seguida de uma linha com o titulo (sem #), seguida do conteudo em Markdown.

ANOTACOES:
{notes}
"""
    raw = call_llm(prompt, timeout=180)
    sections = []
    for block in raw.split(PUBLIC_SECTION_MARKER):
        block = block.strip()
        if not block:
            continue
        lines = block.split("\n", 1)
        title = lines[0].strip().lstrip('#').strip()[:200]
        content = lines[1].strip() if len(lines) > 1 else ""
        if title and content:
            sections.append((title, f"# {title}\n\n{content}"))
    if not sections:
        sections.append(("Visao Geral do App", raw))
    return sections

# Pontuação para escolher os arquivos mais importantes na doc técnica
TECH_PRIORITY_HINTS = {
    'main': 10, 'app': 6, 'server': 8, 'index': 5,
    'auth': 9, 'middleware': 8, 'security': 8, 'route': 8, 'api': 7, 'controller': 7,
    'service': 7, 'repository': 7, 'model': 7, 'schema': 6, 'database': 7, 'db': 5,
    'config': 6, 'settings': 6, 'validate': 5, 'metrics': 5, 'dashboard': 5, 'admin': 5,
    'create_': 4, 'migration': 2,
}
TECH_LOW_PRIORITY = ('test', 'spec', 'conftest', '__init__', '.md', 'mock', 'fixture')


def tech_priority(rel_path: str, size: int) -> int:
    """Quanto maior, mais importante para a doc técnica."""
    p = rel_path.lower().replace('\\', '/')
    score = sum(v for k, v in TECH_PRIORITY_HINTS.items() if k in p)
    if any(h in p for h in TECH_LOW_PRIORITY):
        score -= 15
    if size < 200:
        score -= 5  # arquivos quase vazios
    score -= p.count('/')  # arquivos mais próximos da raiz tendem a ser centrais
    return score


def build_repo_context(repo_dir: str, files: list) -> str:
    """Resumo do repositório (árvore + dependências) enviado junto com cada arquivo,
    para a IA entender o papel do arquivo no sistema."""
    tree = "\n".join(sorted(rel for rel, _ in files))[:3000]
    deps = []
    for name in ('requirements.txt', 'package.json', 'pyproject.toml', 'go.mod', 'pom.xml'):
        path = os.path.join(repo_dir, name)
        if os.path.isfile(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    deps.append(f"--- {name} ---\n{f.read()[:1500]}")
            except Exception:
                pass
    return f"ARQUIVOS DO PROJETO:\n{tree}\n\nDEPENDENCIAS:\n" + ("\n".join(deps) or "(nao encontradas)")


def document_file_with_llm(file_path: str, code_content: str, doc_type: str = "educational", repo_context: str = "") -> str:
    """Envia o conteúdo do arquivo para a IA e retorna a documentação técnica ou educacional."""
    
    if doc_type == "educational":
        prompt = f"""
Você é um Especialista de Produto e Educador de Tecnologia (Product Educator). 
Sua missão é ler o arquivo abaixo e traduzir o seu conteúdo em uma Documentação Educacional de Uso do Sistema.

O usuário NÃO quer uma documentação técnica focada em infraestrutura, banco de dados ou como fazer deploy. 
O objetivo do "DocsLab" é criar um Manual do Usuário e Guia de Negócios legível para qualquer pessoa entender como usar o App.

Diretrizes:
1. FOCO NO USO: Explique qual funcionalidade de negócio esse arquivo representa no sistema. 
2. EDUCATIVO: Descreva o que o usuário final pode fazer através desta funcionalidade.
3. SEM JARGÃO TÉCNICO PESADO: Esconda detalhes de conexão com banco de dados, configuração de servidores ou arquitetura de código. Transforme isso em "O sistema permite que você gerencie X e Y".
4. ESTRUTURA VISUAL: Use títulos atraentes, listas de passos ou benefícios, e uma linguagem super amigável de manual de instruções.

### ARQUIVO: {file_path}
```
{code_content[:15000]}
```
"""
    else:
        # Technical — documentação de nível produção, descritiva (sem opinar)
        prompt = f"""
Você é um Technical Writer sênior escrevendo a documentação interna de produção de um sistema, para desenvolvedores que vão manter e operar o código.

Use o CONTEXTO DO PROJETO para entender o papel deste arquivo no sistema (quem chama, do que depende).

Regras:
1. Descreva somente o que o código faz de fato. Não invente comportamento que não está no código.
2. NUNCA crie seções de 'Solução de Problemas', 'Troubleshooting', 'Erros', 'Bugs' ou 'Pontos Fracos'. O objetivo desta documentação é 100% descritivo e neutro (especificação técnica pura).
3. Não sugira melhorias, refatorações nem faça críticas ou avaliações de segurança.
4. Variáveis de ambiente: informe o nome, onde são lidas e o que acontece no código se estiverem ausentes. Nunca mostre valores.
5. Escreva em português, linguagem técnica e objetiva. Não use emojis.

Estrutura OBRIGATÓRIA em Markdown:

# {file_path}

## Visão Geral
Propósito do módulo, onde ele se encaixa no fluxo do sistema e quais regras de negócio implementa.

## Dependências
- Internas (outros módulos do projeto) e externas (bibliotecas, APIs, banco, variáveis de ambiente), e para que cada uma é usada.

## Referência da API
Para CADA classe, função, método, rota ou constante pública:
### `nome(assinatura com type hints)`
- **Descrição:** o que faz e por que existe no fluxo.
- **Parâmetros:** nome, tipo exato (ex: `List[str]`, `Optional[Dict[str, Any]]`), obrigatório ou padrão, significado.
- **Retorno:** tipo exato e o conteúdo/estrutura esperados.
- **Exceções (Raises):** exceções lançadas ou propagadas e em que situação.
- **Efeitos colaterais:** leitura/escrita em disco, banco, rede, cache, variáveis globais, logs.
- **Exemplo de retorno:** bloco de código com um exemplo realista (dict/JSON/objeto) baseado no código.
- **Casos de borda:** entradas vazias, nulas, inválidas e como o código reage.

## Exemplos de Uso
Snippets mostrando como importar e chamar o módulo; se for script, o comando de CLI e os códigos de saída; se for rota HTTP, um exemplo de requisição e resposta.

=== CONTEXTO DO PROJETO ===
{repo_context[:5000]}

=== ARQUIVO: {file_path} ===
```
{code_content[:15000]}
```
"""

    # Usa call_llm com fallback automático entre modelos (doc técnica é mais longa: timeout maior)
    # Erros sobem para o chamador, que decide não salvar a falha como documentação.
    timeout = LLM_TIMEOUT if doc_type == "educational" else 120
    return call_llm(prompt, timeout=timeout)

def _notify_dev(db, dev_id: int, app_name: str, doc_type: str, success: bool, error: str = ""):
    """Cria DevNotification para o dev quando a geração terminar."""
    try:
        from app.models.dev_tester_models import DevNotification
        label = "pública" if doc_type == "educational" else "técnica"
        if success:
            title = f"Documentação {label} pronta: {app_name}"
            body = f"A documentação {label} do app '{app_name}' foi gerada com sucesso e está disponível no DocsLab."
            icon = "check"
            color = "emerald"
        else:
            title = f"Falha ao gerar doc {label}: {app_name}"
            body = f"Ocorreu um erro ao gerar a documentação {label} de '{app_name}'. {error[:120]}"
            icon = "bug"
            color = "rose"

        db.add(DevNotification(
            dev_id=dev_id,
            title=title,
            body=body,
            icon=icon,
            color=color,
            read=False,
        ))
        db.commit()
        print(f"[AutoDocs] Notificação criada para dev_id={dev_id}: {title}")
    except Exception as e:
        print(f"[AutoDocs] Erro ao criar notificação: {e}")


def process_github_repo_task(app_id: int, github_url: str, doc_type: str = "educational", dev_id: int = 0, beta_product_id: int = None):
    """
    Background Task: 
    1. Clona o repositório
    2. Lê os arquivos válidos
    3. Chama a LLM para documentar cada um
    4. Salva no banco e atualiza o status do app
    """
    db: Session = SessionLocal()
    app_record = db.query(AutoDocApp).filter(AutoDocApp.id == app_id).first()
    
    if not app_record:
        db.close()
        return

    try:
        app_record.status = "processing"
        db.commit()

        # Cria um diretório temporário para clonar
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"[AutoDocs] Clonando {github_url} para {temp_dir}...")
            
            # Executa git clone com timeout de 60s
            result = subprocess.run(
                ["git", "clone", "--depth", "1", github_url, temp_dir],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                raise Exception(f"Erro no Git Clone: {result.stderr[:300]}")

            # Varre o diretório clonado
            files_to_process = []
            for root, dirs, files in os.walk(temp_dir):
                # Ignora pastas não desejadas modificando a lista 'dirs' in-place
                dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
                
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in ALLOWED_EXTENSIONS:
                        full_path = os.path.join(root, file)
                        # Caminho relativo ao root do repositório
                        rel_path = os.path.relpath(full_path, temp_dir)
                        files_to_process.append((rel_path, full_path))

            print(f"[AutoDocs] {len(files_to_process)} arquivos encontrados para documentar no App ID {app_id}")

            if doc_type == "educational":
                # DOC PUBLICA: organizada por funcionalidade, sem nomes de arquivo
                public_files = [f for f in files_to_process if is_relevant_for_public(f[0])][:20]
                feature_notes = []
                last_llm_error = None
                for rel_path, full_path in public_files:
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            code_content = f.read()
                        if not code_content.strip():
                            continue
                        print(f"[AutoDocs] Extraindo funcionalidades de {rel_path}...")
                        notes = extract_features_for_public(code_content)
                        if notes and "IRRELEVANTE" not in notes.upper()[:20]:
                            feature_notes.append(notes)
                    except Exception as file_err:
                        last_llm_error = file_err
                        print(f"[AutoDocs] Erro ao analisar {rel_path}: {file_err}")

                if not feature_notes:
                    if not public_files:
                        raise Exception("Nenhum arquivo com funcionalidades de usuario foi encontrado no repositorio.")
                    if last_llm_error:
                        raise Exception(f"A IA nao respondeu ao analisar o codigo: {last_llm_error}")
                    raise Exception("Nenhuma funcionalidade relevante para usuarios foi encontrada.")

                print(f"[AutoDocs] Montando doc publica com {len(feature_notes)} blocos de funcionalidades...")
                for title, content in build_public_doc(app_record.app_name, feature_notes):
                    db.add(AutoDocFile(app_id=app_id, file_path=title, content=content))
                db.commit()
                files_to_process = []  # doc publica concluida, pula o modo arquivo-a-arquivo

            # DOC TECNICA: prioriza arquivos centrais (rotas, auth, models, services...)
            repo_context = build_repo_context(temp_dir, files_to_process) if files_to_process else ""
            ranked = sorted(
                files_to_process,
                key=lambda f: tech_priority(f[0], os.path.getsize(f[1])),
                reverse=True,
            )[:MAX_TECH_FILES]

            saved, failed = 0, []
            for rel_path, full_path in ranked:
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        code_content = f.read()
                    
                    if not code_content.strip():
                        continue

                    print(f"[AutoDocs] Analisando {rel_path} no modo {doc_type}...")
                    doc_content = document_file_with_llm(rel_path, code_content, doc_type, repo_context)

                    # Salva no banco de dados
                    new_doc = AutoDocFile(
                        app_id=app_id,
                        file_path=rel_path,
                        content=doc_content
                    )
                    db.add(new_doc)
                    db.commit()
                    saved += 1

                except Exception as file_err:
                    failed.append(rel_path)
                    print(f"[AutoDocs] Erro ao ler/documentar o arquivo {rel_path}: {file_err}")

            if ranked and saved == 0:
                raise Exception(f"A IA nao conseguiu documentar nenhum arquivo ({len(failed)} falhas).")
            if failed:
                print(f"[AutoDocs] Arquivos sem documentacao por falha da IA: {failed}")

        # Se tudo deu certo, atualiza status
        app_record.status = "completed"
        db.commit()
        print(f"[AutoDocs] Geração concluída para App ID {app_id}")

        # Registra no histórico de gerações (cota)
        from app.models.auto_docs_models import AutoDocGeneration
        db.add(AutoDocGeneration(
            dev_id=dev_id,
            beta_product_id=beta_product_id,
            doc_type=doc_type,
            status="completed",
        ))
        db.commit()

        # Notificação no app
        _notify_dev(db, dev_id, app_record.app_name, doc_type, success=True)

    except Exception as e:
        import traceback
        error_msg = str(e)[:500]
        print(f"[AutoDocs] Erro fatal na App ID {app_id}: {error_msg}")
        print(traceback.format_exc())
        try:
            app_record = db.query(AutoDocApp).filter(AutoDocApp.id == app_id).first()
            if app_record:
                app_record.status = "error"
                app_record.error_message = error_msg
                db.commit()

            # Registra falha no histórico
            from app.models.auto_docs_models import AutoDocGeneration
            db.add(AutoDocGeneration(
                dev_id=dev_id,
                beta_product_id=beta_product_id,
                doc_type=doc_type,
                status="error",
            ))
            db.commit()

            # Notificação de erro
            _notify_dev(db, dev_id, app_record.app_name if app_record else "?", doc_type, success=False, error=error_msg)
        except Exception:
            pass

    finally:
        db.close()
