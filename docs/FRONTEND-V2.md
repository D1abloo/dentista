# Frontend v2 — AgendaClinic / Dentista+

Reconstrucción completa del frontend (2026). El código legacy en `src/components/public`, `src/components/admin`, etc. queda como **referencia funcional**; la UI activa vive en `src/frontend/`.

## Estructura

```
src/frontend/
  ds/                 # Design system (Button, Input, Card, Modal, PageState…)
  layouts/            # PublicShell, PortalShell
  features/
    public/           # Landing
    auth/             # Login unificado, admin, plataforma
    admin/            # Panel clínica + vistas
    patient/          # Portal paciente
    platform/         # Panel SaaS
    shared/           # PortalSwitcherV2
  hooks/              # useAsync, useOnline
  lib/cn.ts           # Utilidad de clases
src/styles/v2/        # Tokens + Tailwind base
```

## Instalación y ejecución

```bash
npm install
npm run local:pg:bootstrap   # opcional: datos locales
CHOKIDAR_USEPOLLING=true npm run dev
```

Abre `http://127.0.0.1:4321/` (público), `/login/admin`, `/paciente`, `/platform`.

## Calidad

```bash
npm run check
npm run smoke
node --test scripts/unit/frontend-v2.mjs
```

## Decisiones técnicas

| Área | Decisión |
|------|----------|
| Estilos | Tailwind + tokens CSS (`--nx-*`), una hoja `v2/index.css` por layout |
| Tipografía | Instrument Sans (UI) + Fraunces (display) |
| Portales | `PortalShell` compartido: sidebar desktop, drawer móvil, skip link |
| Datos | Hooks y APIs existentes (`useDemoStore`, `fetch /api/*`); sin Supabase en cliente |
| Accesibilidad | WCAG 2.2 AA: foco visible, roles, labels, `aria-live` en errores |
| Estados | `PageState`, `Spinner`, `Alert`, `useOnline` |

## Comparativa con frontend anterior

| Problema anterior | Mejora v2 |
|-------------------|-----------|
| 67+ CSS con solapamientos | 1 bundle Tailwind + tokens |
| 3 familias de componentes (public/admin/ui) | `src/frontend/ds` unificado |
| Navegación inconsistente entre portales | `PortalShell` + `PortalSwitcherV2` |
| Poca cobertura de estados vacío/error/offline | `PageState` + `useAsync` en módulos |
| Landing fragmentada en muchos partials legacy | `LandingPage` cohesiva mobile-first |

## Mantenimiento

- Nuevas pantallas: crear vista en `features/<zona>/views/` y registrar en el router de la app.
- Nuevos primitivos: añadir a `frontend/ds/` y exportar en `ds/index.ts`.
- No importar CSS legacy en `PublicLayout` / `PortalLayout`.
