#!/bin/bash
set -euo pipefail

# Instala/actualiza el cron de backup diario de la base de nutri-app.
# Uso: bash scripts/setup-backup-cron.sh

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="$APP_DIR/scripts/backup-db.sh"

if [ ! -x "$BACKUP_SCRIPT" ]; then
    echo "ERROR: no existe o no es ejecutable $BACKUP_SCRIPT" >&2
    exit 1
fi

CRON_LINE="30 3 * * * bash ${BACKUP_SCRIPT} >> /var/log/nutri-backup.log 2>&1"

( crontab -l 2>/dev/null | grep -v 'backup-db.sh'; echo "$CRON_LINE" ) | crontab -

echo "==> Cron de backup instalado:"
crontab -l | grep 'backup-db.sh'
