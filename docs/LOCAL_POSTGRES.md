# PostgreSQL 100% local (sin Supabase cloud)

Desarrollo y VPS con **PostgreSQL en Docker** en tu máquina. No necesitas cuenta en supabase.com.

## Arquitectura

```mermaid
flowchart LR
  App[npm run dev :4321]
  Proxy[Proxy /rest/v1 :54321]
  REST[PostgREST :54322]
  PG[(PostgreSQL :5434)]
  App --> Proxy
  Proxy --> REST
  REST --> PG
```

| Componente | Puerto | Descripción |
|------------|--------|-------------|
| PostgreSQL | **5434** | BD (5432 suele estar ocupado por otros proyectos) |
| PostgREST | 54322 | API REST interna |
| Proxy supabase-js | **54321** | Traduce `/rest/v1/*` → PostgREST |
| App Astro | 4321 | Frontend + APIs |

## Requisitos

- Docker activo (`systemctl start docker` en Linux)
- Node 20+

## Inicio rápido

```bash
# 1. Configura .env local
npm run local:pg:setup

# 2. Bootstrap (Docker + migraciones + clínica demo + huecos)
npm run local:pg:bootstrap

# 3. App
CHOKIDAR_USEPOLLING=true npm run dev

# 4. (Opcional) n8n
npm run n8n:dev && npm run n8n:bootstrap
```

**Probar:** http://127.0.0.1:4321/citas-con-ia → «Reservar nueva cita»

**Login:** `admin@dentista.app` (contraseña en `.env` → `SUPER_ADMIN_PASSWORD`)

## Comandos

| Comando | Acción |
|---------|--------|
| `npm run local:pg:setup` | Escribe `LOCAL_POSTGRES=true` y URLs en `.env` |
| `npm run local:pg:bootstrap` | Todo: PG + migraciones + seed |
| `npm run local:pg:start` | Solo Docker (PG + PostgREST + proxy) |
| `npm run local:pg:stop` | Para servicios |
| `npm run local:pg:status` | Estado contenedores |
| `npm run db:migrate:all` | Solo SQL |
| `npm run seed:clinic` | Solo semilla |

## Variables `.env` (automáticas con `local:pg:setup`)

```env
LOCAL_POSTGRES=true
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/dentista
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…
GEMINI_API_KEY=…
```

> `PUBLIC_SUPABASE_URL` apunta al **proxy local**, no a Supabase cloud. El cliente `@supabase/supabase-js` sigue usándose contra PostgREST.

## Auth local

Sin GoTrue: login verifica contraseñas en `auth.users` con `pgcrypto` (bcrypt). Implementado en `src/lib/localPostgres/auth.ts`.

## Pasar al VPS

1. Instala PostgreSQL en el VPS (o Docker con los mismos contenedores).
2. Copia `.env` cambiando hosts/puertos.
3. `npm run db:migrate:all` + `npm run seed:clinic`
4. `npm run build:vps` + systemd/nginx (`deploy/vps/`)

Ver también: `docs/DEPLOY_VPS_LINUX.md`

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| `Bind for :::5432 failed` | Puerto ocupado; usamos **5434** por defecto (`DENTISTA_PG_PORT`) |
| `ECONNREFUSED 54321` | `npm run local:pg:start` (proxy caído) |
| `JWSError JWSInvalidSignature` | `npm run local:pg:setup` y reinicia `npm run dev` |
| Sin huecos en calendario | `npm run seed:clinic` (crea `availability_rules` L–V 9–18h) |
| Docker no arranca | `sudo systemctl start docker` |
