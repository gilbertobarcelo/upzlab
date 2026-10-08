#!/bin/bash
echo "Iniciando a API Standalone da Comunidade UpzLab..."
source ../upzcontroll/.venv/bin/activate || echo "Aviso: Ambiente virtual não encontrado, tentando rodar globalmente"
uvicorn main:app --reload --port 8001
