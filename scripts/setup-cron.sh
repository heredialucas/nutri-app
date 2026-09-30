#!/bin/bash
set -e

# Instala/actualiza el cron de recordatorios de WhatsApp en la VPS.
# Uso: bash scripts/setup-cron.sh
# Lee NEXT_PUBLIC_APP_URL y CRON_SECRET desde .env.

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: falta $ENV_FILE" >&2
    exit 1
fi

APP_URL=$(grep -E '^NEXT_PUBLIC_APP_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"')
CRON_SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"')

if [ -z "$APP_URL" ] || [ -z "$CRON_SECRET" ]; then
    echo "ERROR: NEXT_PUBLIC_APP_URL o CRON_SECRET no están definidos en .env" >&2
    exit 1
fi

CRON_LINE="0 * * * * curl -fsS -X POST -H \"x-cron-secret: ${CRON_SECRET}\" ${APP_URL}/api/cron/notifications > /dev/null 2>&1"

( crontab -l 2>/dev/null | grep -v 'api/cron/notifications'; echo "$CRON_LINE" ) | crontab -

echo "==> Cron instalado:"
crontab -l | grep 'api/cron/notifications'
