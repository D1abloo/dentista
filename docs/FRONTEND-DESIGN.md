# Frontend Design System v3 — AgendaClinic

Actualización visual global (julio 2026) para unificar la experiencia premium en sitio público, portales paciente/admin, plataforma y asistente IA.

## Objetivo

Mejorar estética, jerarquía visual, microinteracciones y consistencia **sin modificar** rutas, APIs, permisos ni lógica de negocio.

## Identidad visual

| Token | Valor | Uso |
|-------|-------|-----|
| Marca | Gradiente `#0ea5e9 → #14b8a6 → #0d9488` | CTAs, enlaces activos, acentos |
| Navy | `#0f2742` / `#041a2e` | Admin rail, títulos |
| Superficie | `#ffffff` / `#f6fafc` | Cards, fondos |
| Tipografía cuerpo | **DM Sans** | UI, formularios, tablas |
| Tipografía display | **Fraunces** | Títulos, KPIs, cabeceras |

## Archivos principales

- `src/styles/premium-design-system.css` — capa global de tokens, animaciones y refinamiento (importada al final en `AppLayout.astro`)
- `src/components/ui/AppLoader.tsx` — loader reutilizable (puntos animados)
- `src/components/ui/Badge.tsx` — badges de estado con indicador visual
- `src/components/ui/Modal.tsx` — modales con animación scale-in
- `tailwind.config.mjs` — utilidades `animate-fade-up`, `animate-scale-in`

## Componentes mejorados vía CSS

- Botones: `.btn`, `.ui-btn`, `.adb-btn`
- Cards: `.ui-card`, `.premium-card`, `.kpi`, `.adm-kpi`, módulos admin
- Formularios: `.field-control`, `.df-field`
- Tablas: `.data-table`, `.table-cards__row`
- Navegación: `.portal-rail`, `.rail-link`, topbars
- Modales y drawers
- Landing pública: `.adb-landing`, secciones
- Login y cookie banner

## Animaciones

- Entrada de página: `df-fade-up` en `.portal-body` y secciones landing
- Modales: `df-scale-in` + backdrop blur
- Drawers: `df-slide-in-left`
- Hover: elevación sutil en cards y botones
- Loaders: `AppLoader` con bounce de 3 puntos
- `prefers-reduced-motion`: desactiva animaciones

## Pruebas recomendadas

```bash
npm run check
npm run smoke
npm run build
```

Rutas manuales:

- `/` — landing dental
- `/citas-con-ia` — asistente IA
- `/login`, `/login/admin`, `/login/paciente`
- `/paciente`, `/paciente/reservar`, `/paciente/perfil`
- `/admin`, `/admin/agenda`, `/admin/pacientes`
- `/platform` (si aplica)

Verificar responsive en 375px, 768px y 1280px.

## Restricciones respetadas

- Sin cambios en endpoints, permisos ni nombres de campos
- Sin datos demo sustituyendo producción
- Sin elementos decorativos con apariencia funcional sin acción real
