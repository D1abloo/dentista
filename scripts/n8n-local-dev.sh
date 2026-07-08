#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

export N8N_PORT="${N8N_PORT:-5678}"
export N8N_HOST="${N8N_HOST:-127.0.0.1}"
export N8N_PROTOCOL="${N8N_PROTOCOL:-http}"
export N8N_EDITOR_BASE_URL="${N8N_EDITOR_BASE_URL:-http://127.0.0.1:5678}"
export WEBHOOK_URL="${WEBHOOK_URL:-http://127.0.0.1:5678/}"

# Variables que usan los nodos HTTP del workflow ($env.*)
export APP_BASE_URL="${APP_BASE_URL:-${PUBLIC_APP_URL:-http://127.0.0.1:4321}}"
export N8N_SERVICE_TOKEN="${N8N_SERVICE_TOKEN:-local-n8n-service-token-dev}"
export N8N_WEBHOOK_SECRET="${N8N_WEBHOOK_SECRET:-local-n8n-webhook-secret-dev}"
export N8N_ADMIN_EMAIL="${N8N_ADMIN_EMAIL:-admin@dentista.app}"
export GOOGLE_CALENDAR_ENABLED="${GOOGLE_CALENDAR_ENABLED:-false}"
export GOOGLE_CALENDAR_ID="${GOOGLE_CALENDAR_ID:-primary}"

# Permitir $env.* en nodos HTTP (n8n 2.x lo bloquea por defecto)
export N8N_BLOCK_ENV_ACCESS_IN_NODE=false

echo "n8n local → http://${N8N_HOST}:${N8N_PORT}"
echo "APP_BASE_URL → ${APP_BASE_URL}"
echo "Importar workflows: npm run n8n:bootstrap (en otra terminal)"

exec npx --yes n8n start
