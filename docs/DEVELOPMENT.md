# Desarrollo local

Repositorio pensado para **npm** (sin Docker/Kubernetes en el flujo dev).

## Arranque

```bash
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:4321`.

### Rutas útiles en dev

| Ruta | Qué probar |
|------|------------|
| `/` | Landing |
| `/citas-con-ia` | Asistente IA completo |
| `/login/admin` | Panel clínica (LIVE) |
| `/login/paciente` | Portal paciente |
| `/admin/agenda` | Agenda |
| `/platform/login` | Super Admin |

## LIVE con Supabase

```bash
# Aplicar migraciones en Supabase (ver docs/SUPABASE_APPLY.md hasta 0038)
npm run seed:clinic
npm run qa:db-security
npm run qa:live   # requiere npm run dev en paralelo
```

Variables mínimas en `.env`: `PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SESSION_SECRET`.

### Asistente IA en local

```env
GEMINI_API_KEY=...          # opcional; sin clave usa fallback local de intención
GEMINI_MODEL=gemini-1.5-pro
```

Sin Supabase configurado, el asistente no puede devolver huecos ni citas reales.

## Modo demo (solo desarrollo)

```env
PUBLIC_DEMO_MODE=true
```

Ver `docs/LOCALSTORAGE_DEMO.md`. No usar en producción.

## Redis

Opcional. Si `REDIS_URL` está vacío, `src/lib/cache.ts` usa memoria.

## Guardar cambios en GitHub

```bash
npm run smoke
npm run check
npm run git:save -- "feat: mensaje del cambio"
```

Repositorio: `https://github.com/D1abloo/dentista.git`.

## Checklist antes de push

- [ ] `npm run smoke`
- [ ] `npm run check`
- [ ] `npm run qa:db-security` (si tocaste RLS/migraciones)
- [ ] Probar `/`, `/citas-con-ia`, `/paciente`, `/admin`
- [ ] Sin secretos en commits (`.env` ignorado)
- [ ] Docs actualizados si cambió schema o APIs públicas
