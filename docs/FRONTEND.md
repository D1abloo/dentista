# Frontend Dentista+ / AgendaClinic

## Resumen

Frontend con **Astro** (páginas, SEO, API), **React** (portales y asistente IA), **TypeScript** estricto y design system en `src/styles/`.

- Marca pública: **AgendaClinic** (SEO, asistente IA).
- Producto interno: **Dentista+ / DentalFlow**.
- Modo recomendado: **LIVE** (`PUBLIC_DEMO_MODE=false`) con cookie `df_session`.

## Sitio público

| Ruta | Componentes / notas |
|------|---------------------|
| `/` | `LandingPage`, hero, CTAs «Citas con IA», portal, demo clínica |
| `/citas-con-ia` | `AiAppointmentsPage` — asistente completo (reserva + gestión) |
| `/reservar-con-ia` | Redirección 301 → `/citas-con-ia` |
| `/reserva` | Flujo reserva público clásico |
| `/contacto`, `/documentacion` | Contacto y ayuda |
| `/registro-clinica`, `/registro-paciente` | Altas |
| Legal | `/cookies`, `/privacidad`, `/terminos` |

**Widget global:** `AiAppointmentsWidget` en `AppLayout` (todas las páginas públicas) — botón «Citas con IA», drawer premium.

### Asistente de citas con IA (UI)

- **Título:** Asistente de citas con IA
- **Pestañas:** Nueva cita · Mis citas · Cambiar · Ayuda
- **Progreso:** 5 pasos (reserva) o 4 pasos (gestión con verificación)
- **Panel lateral:** resumen de reserva, huecos reales, citas existentes, formularios
- **Estilos:** `src/styles/ai-booking.css`
- **Hook:** `useAiAppointmentsFlow` en `src/components/public/ai-booking/`

## Portal del paciente

- **Rutas:** `/paciente`, `/paciente/citas`, `/paciente/reservar`, informes, documentos, facturas, pagos, mensajes, perfil
- **Layout:** `PatientShell` (sidebar + bottom nav móvil)
- **LIVE:** sesión por cookie; datos vía APIs con `patientId` de sesión
- **Demo** (`PUBLIC_DEMO_MODE=true`): ver `docs/LOCALSTORAGE_DEMO.md`

## Panel administrativo

- **Rutas:** agenda, citas, pacientes, informes, documentos, facturas, pagos, dentistas, tratamientos, configuración, normativa
- **Layout:** `AdminShell` + selector de clínica activa
- **Agenda:** vistas día/semana/mes, bloqueos, huecos
- **Informes clínicos:** `admin-clinical-reports.css`, visor paciente en `patient-reports.css`

## Accesos (LIVE)

| Portal | URL |
|--------|-----|
| Clínica | `/login/admin` |
| Paciente | `/login/paciente` o `/portal-paciente` |
| Plataforma | `/platform/login` |
| Hub | `/login` |

Credenciales QA: [`QA_USUARIOS_PRUEBA.md`](QA_USUARIOS_PRUEBA.md).

## SEO

- Metadatos: `src/lib/seo/publicPages.ts`
- `robots.txt`, `sitemap.xml` (generados)
- Página IA: título «Citas con IA | AgendaClinic»

## Componentes reutilizables

- UI: `src/components/ui/`
- Público: `src/components/public/`
- Admin: `src/components/admin/`
- Paciente: `src/components/patient/`

## Comandos

```bash
npm run dev
npm run build
npm run check
npm run smoke
```
