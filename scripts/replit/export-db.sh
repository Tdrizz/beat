#!/usr/bin/env bash
# Run INSIDE the Replit project shell. Dumps the live data (no schema) from
# Replit Postgres; the schema on Supabase comes from the committed migrations.
#   bash export-db.sh            -> glamr-data.dump
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL must be set (Replit provides it)}"
psql "$DATABASE_URL" -Atc "select 'profiles: ' || count(*) from profiles"
pg_dump "$DATABASE_URL" --data-only --schema=public --no-owner --no-privileges -Fc -f glamr-data.dump
echo "Wrote glamr-data.dump ($(du -h glamr-data.dump | cut -f1))"
