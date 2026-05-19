#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Creado .env desde .env.example"
fi

npm install
npm run smoke

echo "DentalFlow listo en modo dev. Ejecuta: npm run dev"
echo "Para subir cambios: npm run git:save -- \"feat: mensaje\""
