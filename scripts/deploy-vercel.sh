#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1; then
  echo "Instalando Vercel CLI…"
  npm install --global vercel@latest
fi

if [ -z "${VERCEL_TOKEN:-}" ]; then
  if ! vercel whoami >/dev/null 2>&1; then
    echo "No hay sesión Vercel. Ejecuta: npx vercel login"
    echo "O exporta VERCEL_TOKEN desde https://vercel.com/account/tokens"
    exit 1
  fi
fi

echo "→ Build producción (vercel-build)"
npm run vercel-build

TOKEN_ARG=()
if [ -n "${VERCEL_TOKEN:-}" ]; then
  TOKEN_ARG=(--token "$VERCEL_TOKEN")
fi

if [ ! -f .vercel/project.json ]; then
  echo "→ Enlazar proyecto (primera vez)"
  vercel link "${TOKEN_ARG[@]}"
fi

echo "→ Deploy producción"
vercel deploy --prebuilt --prod --yes "${TOKEN_ARG[@]}"

echo "Deploy enviado. Comprueba la URL en el panel de Vercel."
