#!/usr/bin/env bash
# Tests SQL sur un Postgres jetable : stub auth → migrations → seed → tests.
set -euo pipefail
cd "$(dirname "$0")/.."

NAME=jcsd-test
podman rm -f "$NAME" >/dev/null 2>&1 || true
podman run -d --name "$NAME" -e POSTGRES_PASSWORD=x docker.io/library/postgres:17-alpine >/dev/null
trap 'podman rm -f "$NAME" >/dev/null' EXIT
until podman exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 1

run() { podman exec -i "$NAME" psql -q -X -v ON_ERROR_STOP=1 -U postgres "$@"; }

podman cp supabase "$NAME":/supabase
run -f /supabase/tests/_stub_auth.sql
for f in supabase/migrations/*.sql; do run -f "/$f"; done
run -f /supabase/seed.sql
for f in supabase/tests/[!_]*.sql; do run -f "/$f"; done
