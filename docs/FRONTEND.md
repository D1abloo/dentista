# Frontend Dentista+

## Resumen

Dentista+ es una aplicación SaaS premium para gestión de citas dentales. El frontend usa **Astro** (páginas y layout), **React** (portales interactivos), **TypeScript** estricto y el design system en `src/styles/dental-saas.css`.

Notas recientes:

- Marca unificada con logo circular transparente en header/footer (`DentistaWebpLockup`).
- Flujo LIVE priorizado (`/login/admin`, `/login/paciente`, `/platform/login`) con cookie `df_session`.
- Usuario dual `admin@dentista.app`: puede alternar plataforma y panel clínica sin perder contexto.

## Sitio público

- **Ruta:** `/`
- **Componentes:** `src/components/public/` (`LandingPage`, `PublicHeader`, `PublicFooter`, `CookieBanner`)
- **Contenido:** hero con CTAs «Reservar cita» y «Entrar al portal», secciones de servicios, portal paciente, panel admin, informes/facturas/pagos y multi-clínica
- **Legal:** `/cookies`, `/privacidad`, `/terminos`, `/documentacion`, `/contacto`
- **Ancho máximo:** contenedor `.shell` (~1200px), responsive mobile-first

## Portal del paciente

- **Rutas:** `/paciente`, `/paciente/citas`, `/paciente/reservar`, `/paciente/informes`, `/paciente/documentos`, `/paciente/facturas`, `/paciente/pagos`, `/paciente/perfil`, `/paciente/mensajes`
- **Layout:** `PatientShell` con barra lateral (escritorio) y menú inferior (móvil)
- **Sesión demo:** `localStorage` con `role: "paciente"` y `patientId` (por defecto `PAT-0001`)
- **Regla de datos:** el paciente ve **todos** sus registros por `patientId`, aunque provengan de distintos `tenantId` (multi-clínica)

## Informes clínicos — nueva organización visual

- **Panel clínica** (`/admin/informes`): formulario por recuadros numerados (antecedentes, informe clínico, fuentes, anamnesis, diagnóstico, recomendaciones), membrete con logo y nº de colegiado, plantillas rápidas por tipo de cita. Estilos: `admin-clinical-reports.css`, componentes `AdminClinicalReports` y `ReportSectionBox`.
- **Portal paciente** (`/paciente/informes`): listado con vista previa; **Ver informe** abre visor a pantalla completa (móvil) o modal (escritorio) con pestañas *Informe clínico · Diagnóstico · Indicaciones* y bloques legibles. Componente `PatientReportViewer`, estilos `patient-reports.css`.
- **Portal paciente** (`/paciente/mensajes`): bandeja con vista previa; **Ver mensaje** abre `PatientMessageViewer` (pestañas *Mensaje · Responder*), texto legible sin panel lateral con scroll excesivo.

## Panel administrativo

- **Rutas:** `/admin`, `/admin/agenda`, `/admin/citas`, `/admin/pacientes`, `/admin/pacientes/:id`, módulos de informes, documentos, facturas, pagos, dentistas, tratamientos, clínicas, configuración y normativa
- **Layout:** `AdminShell` con aviso de clínica activa y `tenantId`
- **Sesión demo:** `role: "admin"` y `tenantId` (`TEN-0001` Centro, `TEN-0002` Norte, `TEN-0003` Sur)
- **Regla de datos:** solo registros con `record.tenantId === activeTenantId`

## Login demo

En `/login` puedes entrar como:

1. Paciente (`PAT-0001`)
2. Admin Clínica Centro (`TEN-0001`)
3. Admin Clínica Norte (`TEN-0002`)
4. Admin Clínica Sur (`TEN-0003`)

La sesión se guarda en `localStorage` (ver `docs/LOCALSTORAGE_DEMO.md`).

## Componentes reutilizables

- UI: `src/components/ui/` (`Card`, `StatCard`, `IdBadge`, `Badge`, formularios, modales)
- Marca: `LogoMark`
- Búsqueda global de IDs: `GlobalIdSearch`

## Validación y mensajes

Los formularios usan `src/lib/validation.ts`. Todos los errores visibles están en **español**.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # compilación
npm run smoke    # comprobación de estructura
npm run lint:light
```
