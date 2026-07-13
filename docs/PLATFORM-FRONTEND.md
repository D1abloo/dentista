# Platform Frontend — AgendaClinic SaaS

## Fase 1 — Arquitectura actual

| Capa | Ubicación | Notas |
|------|-----------|--------|
| Rutas Astro | `src/pages/platform/*.astro` | Montan `PlatformApp` vía `DentistaApp` |
| Shell nuevo | `src/frontend/platform/` | Reconstrucción completa (este documento) |
| APIs | `src/pages/api/platform/*` | **No modificar** — contratos existentes |
| Auth cliente | `PlatformGate` + cookie `df_session` | `GET /api/auth/me` |
| Auth servidor | `requireSuperAdmin` | Todas las rutas `/api/platform/*` |
| Legacy UI | `src/components/platform/` | Solo referencia; no cableado a rutas |

## Fase 2 — Alcance frontend

**Se modifica:** `src/frontend/platform/**`, `src/frontend/features/platform/PlatformApp.tsx`, tokens CSS, feature flags, tests unitarios frontend.

**No se toca:** `src/pages/api/**`, `src/lib/db/**`, migraciones, `.env` producción, despliegue, contratos JSON `{ data, error, meta }`.

## Fase 3 — Estructura propuesta

```
src/frontend/platform/
  api/           # Cliente HTTP tipado
  components/    # Shell, marca, tablas, drawers
  hooks/         # Sidebar, media queries
  nav/           # Grupos de menú
  pages/         # Vista por módulo
  styles/        # Tokens de diseño plataforma
  PlatformRouter.tsx
```

## Variables de entorno (frontend)

| Variable | Default | Efecto |
|----------|---------|--------|
| `PUBLIC_ENABLE_TOKEN_FEATURES` | `false` | Oculta UI de tokens en toda la app |
| `PUBLIC_PORTAL_TOKEN_LOGIN` | `false` | Acceso paciente por token (ya existente) |

## Desarrollo local

```bash
npm install
npm run local:pg:bootstrap   # opcional, datos reales locales
CHOKIDAR_USEPOLLING=true npm run dev
```

URL: http://127.0.0.1:4321/platform/usuarios
