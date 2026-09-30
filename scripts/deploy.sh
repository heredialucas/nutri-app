#!/bin/bash
set -e

# Deploy de nutri-app en la VPS. Mismo patron que las otras apps:
# /root/deploy_nutri.sh es el lanzador y este script vive versionado en el repo.
#
# Uso (en la VPS): bash /root/deploy_nutri.sh
#   o directamente: bash /root/apps/nutri-app/scripts/deploy.sh

cd /root/apps/nutri-app

git fetch origin
git reset --hard origin/main

pnpm install --frozen-lockfile
pnpm build

pm2 reload nutri-app --update-env

echo "==> Deploy completo: $(git log --oneline -1)"
