# Desarrollo local → VPS

Misma arquitectura en **local** y en **VPS**: app Node (Astro SSR) + **Supabase** (PostgreSQL + Auth). No hace falta Postgres en el portátil ni en el VPS.

```mermaid
flowchart LR
  subgraph local [Tu PC]
    Dev[npm run dev :4321]
  end
  subgraph cloud [Supabase Cloud]
    DB[(PostgreSQL)]
    Auth[Auth + REST]
  end
  subgraph vps [VPS futuro]
    Node[npm run build:vps]
    Nginx[Nginx 443]
  end
  Dev --> Auth
  Node --> Auth
  Nginx --> Node
```

## 1. Crear proyecto Supabase (una vez)

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Anota:
   - **Project ref** (subdominio, ej. `abcdefghijklmnop`)
   - **Settings → API**: `anon` y `service_role`
   - **Settings → Database → Connection string**: URI modo **Transaction pooler**, puerto **6543**

## 2. Configurar `.env` local

```bash
cp .env.example .env   # si no existe
npm run local:setup -- TU_PROJECT_REF TU_ANON_KEY TU_SERVICE_ROLE_KEY "postgresql://postgres.TU_REF:TU_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
```

Variables mínimas (las mismas en VPS):

| Variable | Local | VPS |
|----------|-------|-----|
| `PUBLIC_SUPABASE_URL` | `https://TU_REF.supabase.co` | Igual |
| `PUBLIC_SUPABASE_ANON_KEY` | anon | Igual |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | Igual (solo servidor) |
| `DATABASE_URL` | pooler :6543 | Igual |
| `PUBLIC_APP_URL` | `http://127.0.0.1:4321` | `https://app.tudominio.com` |
| `AUTH_SESSION_SECRET` | cualquiera 32+ chars | **único en producción** |
| `GEMINI_API_KEY` | tu clave | tu clave |

## 3. Bootstrap (migraciones + clínica demo)

```bash
npm run local:bootstrap
```

Hace:

1. Comprueba Supabase REST + PostgreSQL
2. `npm run db:migrate:all` — todas las migraciones PRO
3. `npm run seed:clinic` — Clínica Dental Nova + admin + pacientes + huecos
4. Prueba `/api/locations` y asistente IA (si `npm run dev` está activo)

## 4. Arrancar en local

**Terminal 1 — app**

```bash
CHOKIDAR_USEPOLLING=true npm run dev
```

**Terminal 2 — n8n (opcional)**

```bash
npm run n8n:env
npm run n8n:dev
npm run n8n:bootstrap
```

**Probar**

- http://127.0.0.1:4321/citas-con-ia → «Reservar nueva cita» → **calendario de huecos**
- http://127.0.0.1:4321/login → admin@dentista.app (password en `.env` `SUPER_ADMIN_PASSWORD`)

## 5. Pasar al VPS (mismo Supabase)

1. En Supabase → **Authentication → URL configuration**:
   - Site URL: `https://app.tudominio.com`
   - Redirect URLs: `https://app.tudominio.com/**`

2. En el VPS, copia el mismo `.env` cambiando solo:

```env
PUBLIC_APP_URL=https://app.tudominio.com
APP_BASE_URL=https://app.tudominio.com
```

3. Build y servicio:

```bash
npm ci
npm run build:vps
# systemd: deploy/vps/dentalflow.service
# nginx:   deploy/vps/nginx-dentalflow.conf
```

Guía completa VPS: `docs/DEPLOY_VPS_LINUX.md`

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run local:setup` | Escribe credenciales Supabase en `.env` |
| `npm run local:bootstrap` | Migraciones + seed + pruebas |
| `npm run db:migrate:all` | Solo SQL (reanudar con `START_FROM=0037_...`) |
| `npm run seed:clinic` | Solo semilla clínica |
| `npm run check` | TypeScript + lint |
| `npm run build:vps` | Build para Node en VPS |

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| `ENOTFOUND *.supabase.co` | Proyecto borrado o ref incorrecto → crea uno nuevo y `local:setup` |
| «No se pudo contactar con el asistente» | `local:bootstrap` + `npm run dev` reiniciado |
| Sin huecos en calendario | `seed:clinic` y revisa que haya `dentists` + `treatments` activos |
| n8n sin respuesta | `npm run n8n:dev` + `GEMINI_API_KEY` en `.env` |
