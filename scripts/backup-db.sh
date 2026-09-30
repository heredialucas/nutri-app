#!/bin/bash
set -euo pipefail

# Backup diario de la base local de nutri-app.
# Uso: bash scripts/backup-db.sh
# Escribe en /root/backups/nutri-app y retiene 14 días.

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$APP_DIR/.env"
BACKUP_DIR="/root/backups/nutri-app"
RETENTION_DAYS=14

if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: falta $ENV_FILE" >&2
    exit 1
fi

DB_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | tr -d '"')
if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL no definido en $ENV_FILE" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/nutri_app_${TS}.sql.gz"

pg_dump "$DB_URL" | gzip > "$OUT"
find "$BACKUP_DIR" -name 'nutri_app_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup OK: $OUT ($(du -h "$OUT" | cut -f1))"
