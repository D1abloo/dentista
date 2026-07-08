#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NETWORK="${DENTISTA_DOCKER_NETWORK:-dentista-local}"
PG_CONTAINER="${DENTISTA_PG_CONTAINER:-dentista-pg}"
REST_CONTAINER="${DENTISTA_REST_CONTAINER:-dentista-rest}"
PG_PORT="${DENTISTA_PG_PORT:-5434}"
REST_PORT="${DENTISTA_REST_PORT:-54321}"
REST_INTERNAL_PORT="${DENTISTA_REST_INTERNAL_PORT:-54322}"
PG_USER="${DENTISTA_PG_USER:-postgres}"
PG_PASS="${DENTISTA_PG_PASS:-postgres}"
PG_DB="${DENTISTA_PG_DB:-dentista}"
JWT_SECRET="${PGRST_JWT_SECRET:-super-secret-jwt-token-with-at-least-32-characters-long}"

ensure_network() {
  docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"
}

start_postgres() {
  ensure_network
  if docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
    echo "✓ PostgreSQL ya activo ($PG_CONTAINER)"
    return
  fi
  if docker ps -a --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
    docker start "$PG_CONTAINER" >/dev/null
    echo "✓ PostgreSQL iniciado ($PG_CONTAINER)"
    return
  fi
  docker run -d \
    --name "$PG_CONTAINER" \
    --network "$NETWORK" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="$PG_PASS" \
    -e POSTGRES_DB="$PG_DB" \
    -p "${PG_PORT}:5432" \
    -v dentista-pg-data:/var/lib/postgresql/data \
    postgres:16-alpine >/dev/null
  echo "✓ PostgreSQL creado ($PG_CONTAINER → localhost:$PG_PORT/$PG_DB)"
}

wait_postgres() {
  for _ in $(seq 1 40); do
    if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "✗ PostgreSQL no respondió a tiempo"
  exit 1
}

start_postgrest() {
  ensure_network
  wait_postgres
  if docker ps --format '{{.Names}}' | grep -qx "$REST_CONTAINER"; then
    echo "✓ PostgREST ya activo ($REST_CONTAINER)"
    return
  fi
  if docker ps -a --format '{{.Names}}' | grep -qx "$REST_CONTAINER"; then
    docker rm -f "$REST_CONTAINER" >/dev/null
  fi
  docker run -d \
    --name "$REST_CONTAINER" \
    --network "$NETWORK" \
    -p "${REST_INTERNAL_PORT}:3000" \
    -e "PGRST_DB_URI=postgresql://authenticator:${PG_PASS}@${PG_CONTAINER}:5432/${PG_DB}" \
    -e PGRST_DB_SCHEMAS=public \
    -e PGRST_DB_ANON_ROLE=anon \
    -e "PGRST_JWT_SECRET=${JWT_SECRET}" \
    postgrest/postgrest:v12.2.3 >/dev/null
  for _ in $(seq 1 20); do
    if curl -sf "http://127.0.0.1:${REST_INTERNAL_PORT}/" >/dev/null 2>&1; then
      echo "✓ PostgREST interno → 127.0.0.1:${REST_INTERNAL_PORT}"
      return
    fi
    sleep 1
  done
  echo "✗ PostgREST no respondió. Logs: docker logs $REST_CONTAINER"
  exit 1
}

start_proxy() {
  if pgrep -f "scripts/local-rest-proxy.mjs" >/dev/null 2>&1; then
    echo "✓ Proxy API ya activo (puerto $REST_PORT)"
    return
  fi
  DENTISTA_REST_INTERNAL_URL="http://127.0.0.1:${REST_INTERNAL_PORT}" \
    DENTISTA_API_PORT="$REST_PORT" \
    nohup node scripts/local-rest-proxy.mjs >/tmp/dentista-rest-proxy.log 2>&1 &
  sleep 1
  if curl -sf "http://127.0.0.1:${REST_PORT}/rest/v1/" >/dev/null 2>&1; then
    echo "✓ API supabase-js → http://127.0.0.1:${REST_PORT}/rest/v1"
  else
    echo "✗ Proxy API no respondió. Ver /tmp/dentista-rest-proxy.log"
    exit 1
  fi
}

cmd="${1:-start}"

case "$cmd" in
  start)
    start_postgres
    wait_postgres
    start_postgrest
    start_proxy
    echo ""
    echo "DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@127.0.0.1:${PG_PORT}/${PG_DB}"
    echo "PUBLIC_SUPABASE_URL=http://127.0.0.1:${REST_PORT}"
    ;;
  postgres)
    start_postgres
    wait_postgres
    ;;
  rest)
    start_postgrest
  ;;
  proxy)
    start_proxy
    ;;
  stop)
    pkill -f "scripts/local-rest-proxy.mjs" 2>/dev/null || true
    docker stop "$REST_CONTAINER" "$PG_CONTAINER" 2>/dev/null || true
    echo "✓ Servicios detenidos"
    ;;
  status)
    docker ps --filter "name=${PG_CONTAINER}|${REST_CONTAINER}" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;
  logs)
    docker logs -f "$PG_CONTAINER"
    ;;
  *)
    echo "Uso: $0 {start|postgres|rest|proxy|stop|status|logs}"
    exit 1
    ;;
esac
