#!/bin/bash
set -e

# Deploy de Mauro Acosta · Gestión nutricional en la VPS.
# Uso: bash scripts/deploy.sh
# Requiere: git, pnpm, pm2 y el archivo .env presente en la raíz del proyecto.

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Directorio: $APP_DIR"

if [ ! -f .env ]; then
    echo "ERROR: falta el archivo .env en $APP_DIR" >&2
    exit 1
fi

echo "==> Actualizando código (git pull)..."
git fetch origin
git reset --hard origin/main

echo "==> Instalando dependencias..."
pnpm install --frozen-lockfile

echo "==> Build (prisma generate + next build)..."
pnpm build

echo "==> Reiniciando PM2..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "==> Deploy completado."
