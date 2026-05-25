# Ejecución y publicación

## VPS Linux + dominio propio

Guía completa (nginx, HTTPS, systemd, Supabase): **[DEPLOY_VPS_LINUX.md](./DEPLOY_VPS_LINUX.md)**.

Resumen: `npm install @astrojs/node` → configurar `.env` → `npm run build:vps` → `npm run start:vps` detrás de nginx.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run dev
```

## Publicar cambios en GitHub

### Autor de commits (GitHub / Vercel)

Para que GitHub y Vercel reconozcan tu usuario, el email del commit debe estar **verificado** en [GitHub → Emails](https://github.com/settings/emails):

| Campo | Valor |
|-------|--------|
| Nombre | Isaac Coria |
| Email | `isaaccoria46@gmail.com` |

`npm run git:save` carga `GIT_AUTHOR_NAME` y `GIT_AUTHOR_EMAIL` desde `.env` (ver `.env.example`). Si no existen, usa los valores de la tabla.

Configuración local opcional (una vez en tu máquina):

```bash
git config user.name "Isaac Coria"
git config user.email "isaaccoria46@gmail.com"
```

### Subir cambios

```bash
npm run smoke
npm run git:save -- "feat: describe el cambio"
```

El remoto esperado es:

```bash
https://github.com/D1abloo/dentista.git
```

## Supabase real

1. Crea proyecto en Supabase.
2. Ejecuta migraciones en orden:
   - `0001_schema.sql`
   - `0002_seed.sql`
   - `0003_operations.sql`
   - `0004_seed_operations.sql`
3. Configura variables en `.env`.
4. Cambia `PUBLIC_DEMO_MODE=false`.

## Redis en desarrollo

Redis es opcional. Deja `REDIS_URL` vacío para usar cache en memoria. Si usas un Redis externo o local instalado manualmente, configura:

```bash
REDIS_URL=redis://localhost:6379
```

## Vercel

Build con `@astrojs/vercel` y `output: 'static'` (páginas HTML en build + APIs en serverless). `vercel.json` define el comando de CI.

| Ajuste | Valor correcto |
|--------|----------------|
| Build command | `npm run vercel-build` |
| Output directory | **Vacío** (recomendado) o `dist` (fallback: el script copia `index.html`) |
| Node.js | 20.x |

`npm run vercel-build` genera `.vercel/output` y copia el HTML a `dist/index.html` por si el panel tiene Output Directory = `dist`.

### Variables de entorno

- `PUBLIC_DEMO_MODE=true` — modo demo sin Supabase
- `AUTH_SESSION_SECRET` — cadena aleatoria en producción

### Si ves `404: NOT_FOUND` (código Vercel)

1. Usa el último commit (adapter Vercel + `vercel-build`).
2. Build command = `npm run vercel-build`.
3. Output directory: vacío **o** `dist` (ambos funcionan con el sync actual).
4. Redeploy **sin caché** (Deployments → Redeploy → sin build cache).
5. En el log debe aparecer `└─ /index.html`, `Vercel Build Output API OK` y `sync-dist: dist/index.html listo`.
6. Si el build falla con `NoAdapterInstalled`, confirma que `astro.config.mjs` incluye `adapter: vercel()` de `@astrojs/vercel`.

## Checklist producción futura

- [x] Hosting SSR: Vercel (`@astrojs/vercel`)
- [ ] RLS activado y probado.
- [ ] Service role solo en backend.
- [ ] Redis protegido por TLS/ACL si es proveedor cloud.
- [ ] Logs sin datos clínicos sensibles.
- [ ] Backups Supabase configurados.
- [ ] Dominio y HTTPS activos.
- [ ] Emails/WhatsApp/SMS con proveedor real.
- [ ] Rate limit para endpoints públicos.
- [ ] Monitoring de errores.
- [ ] Pruebas e2e de reserva y cancelación.
