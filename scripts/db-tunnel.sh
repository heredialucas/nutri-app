#!/usr/bin/env bash
# Tunel SSH a la base de datos de produccion (nutri_app en la VPS)
# Uso: pnpm db:tunnel | pnpm db:tunnel:stop | pnpm db:tunnel:status

set -euo pipefail

LOCAL_PORT=15432
SSH_HOST="187.77.253.222"
SSH_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519_nutri_vps"
REMOTE="127.0.0.1:5432"
DB_NAME="nutri_app"

SSH_OPTS=(
  -i "$SSH_KEY"
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o ExitOnForwardFailure=yes
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=3
  -o StrictHostKeyChecking=accept-new
)

is_up() { lsof -nP -iTCP:"$LOCAL_PORT" -sTCP:LISTEN >/dev/null 2>&1; }

case "${1:-start}" in
  start)
    if is_up; then
      echo "[db-tunnel] El tunel ya esta activo en localhost:$LOCAL_PORT"
      exit 0
    fi
    if [ ! -f "$SSH_KEY" ]; then
      echo "[db-tunnel] ERROR: no existe la clave $SSH_KEY" >&2
      echo "[db-tunnel] Generala y autorizala en la VPS. Ver docs/DEPLOYMENT.md (Tunel de base de datos)." >&2
      exit 1
    fi
    echo "[db-tunnel] Abriendo tunel localhost:$LOCAL_PORT -> $SSH_USER@$SSH_HOST:$REMOTE ($DB_NAME)..."
    ssh -f -N "${SSH_OPTS[@]}" -L "$LOCAL_PORT:$REMOTE" "$SSH_USER@$SSH_HOST"
    sleep 1
    if is_up; then
      echo "[db-tunnel] Tunel activo. Postgres de produccion en: 127.0.0.1:$LOCAL_PORT/$DB_NAME"
    else
      echo "[db-tunnel] ERROR: no se pudo abrir el tunel" >&2
      exit 1
    fi
    ;;
  stop)
    pids="$(lsof -nP -tiTCP:"$LOCAL_PORT" -sTCP:LISTEN || true)"
    if [ -z "$pids" ]; then
      echo "[db-tunnel] No hay tunel activo en el puerto $LOCAL_PORT"
    else
      kill $pids && echo "[db-tunnel] Tunel cerrado (puerto $LOCAL_PORT)"
    fi
    ;;
  status)
    if is_up; then
      echo "[db-tunnel] ACTIVO en localhost:$LOCAL_PORT"
    else
      echo "[db-tunnel] INACTIVO (levantalo con: pnpm db:tunnel)"
      exit 1
    fi
    ;;
  *)
    echo "Uso: $0 {start|stop|status}" >&2
    exit 1
    ;;
esac
