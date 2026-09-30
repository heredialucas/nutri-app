#!/bin/bash
set -euo pipefail

# Crea el rol y la base de datos locales de nutri-app en la VPS.
# Uso: bash scripts/setup-db.sh
# Variables opcionales: DB_NAME, DB_USER, DB_PASSWORD

DB_NAME="${DB_NAME:-nutri_app}"
DB_USER="${DB_USER:-nutri_app}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"

echo "==> Creando/actualizando rol ${DB_USER}"
su postgres -c "psql -v ON_ERROR_STOP=1 -q" <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
SQL

if su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1; then
    echo "==> Base ${DB_NAME} ya existe"
else
    su postgres -c "createdb -O ${DB_USER} ${DB_NAME}"
    echo "==> Base ${DB_NAME} creada"
fi

echo
echo "Agregar a .env:"
echo "DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}\""
echo "DIRECT_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}\""
