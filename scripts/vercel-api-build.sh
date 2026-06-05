#!/usr/bin/env bash
set -euo pipefail

# Neon on Vercel may expose POSTGRES_PRISMA_URL before DATABASE_URL during Preview builds.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set for this Vercel build."
  echo "Link loancompass-db (Production) or loancompass-db-dev (Preview/Development) on loancompass-api."
  exit 1
fi

pnpm --filter api exec prisma migrate deploy
pnpm --filter api build
