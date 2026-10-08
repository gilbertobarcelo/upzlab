#!/bin/bash
#
# Sobe TUDO da UpzLab Community de uma vez:
#   1. Backend FastAPI  → http://localhost:8001/docs
#   2. Frontend Next.js → http://localhost:3003
#
# IMPORTANTE: a porta 3000 NÃO é nossa — pertence a outro projeto
# (egolpe_web). Nunca matar/ocupar a 3000 aqui.
#
# Uso: ./start_all.sh   (funciona executado de qualquer diretório)

set -u

# Raiz do projeto = pasta onde este script está (não importa de onde você roda)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Mata tudo que estiver escutando nas portas dos serviços (inclui filhos do
# --reload do uvicorn e do node), garantindo que nada fique pendurado.
kill_ports() {
  local port pids pid
  for port in "$@"; do
    pids="$(lsof -ti :"$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      for pid in $pids; do kill -9 "$pid" 2>/dev/null || true; done
    fi
  done
}

cleanup() {
  # Evita rodar 2x (o exit de um trap dispara o trap EXIT)
  [ "${CLEANED:-0}" = "1" ] && return
  CLEANED=1
  echo ""
  echo -e "${YELLOW}🛑 Parando serviços...${NC}"
  # 1. Jobs em background deste script (uvicorn, npm, etc.)
  for pid in $(jobs -p 2>/dev/null); do kill "$pid" 2>/dev/null || true; done
  # 2. Backstop: quem sobrar nas portas (3003=frontend, 8001=backend; NUNCA 3000)
  kill_ports 3003 8001
  echo -e "${GREEN}✅ Serviços parados com sucesso.${NC}"
  exit 0
}
trap cleanup INT TERM EXIT

echo "🚀 Iniciando todo o ecossistema UpzLab Community..."

# Limpa processos antigos presos nas portas 3003 e 8001 (a 3000 é de outro
# projeto e fica intocada)
kill_ports 3003 8001

# ---------------------------------------------------------------------------
# 1. BACKEND (FastAPI na porta 8001)
# ---------------------------------------------------------------------------
echo -e "${BLUE}📦 Iniciando Backend (FastAPI) na porta 8001...${NC}"

if ! command -v uvicorn >/dev/null 2>&1 && ! python3 -c "import uvicorn" >/dev/null 2>&1; then
  echo -e "${RED}✗ uvicorn não encontrado. Instale com: pip install fastapi uvicorn${NC}"
  exit 1
fi

# Supervisor: se o uvicorn morrer (crash, kill externo, DB fora do ar...),
# reinicia sozinho em 3s. Os logs saem DIRETO (sem pipe) para não perder
# tracebacks por causa de buffering.
(
  cd "$BACKEND_DIR" || exit 1
  while true; do
    if command -v uvicorn >/dev/null 2>&1; then
      uvicorn main:app --reload --port 8001
    else
      python3 -m uvicorn main:app --reload --port 8001
    fi
    echo -e "${RED}⚠️ [BACKEND] caiu (exit $?) — reiniciando em 3s...${NC}"
    sleep 3
  done
) &
BACKEND_LOOP_PID=$!

# Espera o backend responder (máx. 30s) — se morrer, avisa em vez de mentir
backend_ok=0
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:8001/ 2>/dev/null || true)"
  if [ "$code" != "000" ] && [ -n "$code" ]; then backend_ok=1; break; fi
  sleep 1
done
if [ "$backend_ok" = "1" ]; then
  echo -e "  ${GREEN}✓ Backend no ar → http://localhost:8001/docs${NC}"
else
  echo -e "  ${RED}✗ Backend ainda não respondeu em 30s — o supervisor acima continua tentando. Veja os erros acima.${NC}"
fi

# ---------------------------------------------------------------------------
# 2. FRONTEND (Next.js na porta 3003 — a 3000 é do outro projeto)
# ---------------------------------------------------------------------------
echo -e "${BLUE}💻 Iniciando Frontend (Next.js) na porta 3003...${NC}"
cd "$SCRIPT_DIR" || exit 1
npm run dev -- -p 3003 &

frontend_ok=0
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:3003/ 2>/dev/null || true)"
  if [ "$code" != "000" ] && [ -n "$code" ]; then frontend_ok=1; break; fi
  sleep 1
done
if [ "$frontend_ok" = "1" ]; then
  echo -e "  ${GREEN}✓ Frontend no ar → http://localhost:3003${NC}"
else
  echo -e "  ${RED}✗ Frontend NÃO respondeu em 60s. Veja os erros do Next.js acima.${NC}"
fi

echo ""
echo -e "${GREEN}✅ Tudo pronto! Pressione CTRL+C para desligar tudo.${NC}"
echo "➡️  Frontend:   http://localhost:3003/dashboard"
echo "➡️  Backend API: http://localhost:8001/docs"

# Espera os processos; o trap cleanup derruba os dois ao fechar (CTRL+C)
wait
