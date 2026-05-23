# Arquitectura DentalFlow

## Vista general

DentalFlow está diseñado como SaaS multi-clínica con frontend SSR, componentes interactivos y backend ligero en rutas API de Astro.

**Regla de aislamiento:** cada clínica registrada es **siempre independiente** — relación 1:1 entre `clinics` y `tenants`. No hay sedes compartiendo `tenant_id` ni cruce de datos clínicos entre clínicas del mismo grupo comercial. Un administrador con varias clínicas tiene un perfil staff por clínica y cambia de contexto sin ver datos de otra.

```txt
Paciente/Admin Browser
        ↓
Astro SSR + React Islands
        ↓
API Routes Astro
        ↓                    ↓
Supabase PostgreSQL/RLS       Redis Cache
        ↓                    ↓
Auth / Storage / Audit        Metrics / Availability / Sessions
```

## Capas

### Frontend

- Páginas Astro: SEO, routing y layout general.
- Islas React: login, portal paciente, dashboards, calendario, wizard de reserva, charts.
- Tailwind: sistema visual premium.

Superficies separadas:

- `/`: landing pública Dentista+ con mockup premium desktop/móvil y reserva conectada a APIs demo.
- `/reserva`: flujo público de reserva extendido, sin panel administrativo.
- `/login`: selector de acceso paciente/admin con sesión HTTP-only firmada.
- `/paciente`: portal privado de paciente para gestionar sus citas.
- `/admin`: panel administrativo privado, protegido por rol admin.

### API

- Endpoints dentro de `src/pages/api`.
- Validación con Zod.
- Fallback demo cuando no hay credenciales.
- Respuestas JSON homogéneas `{ data, error, meta }`.

### Auth producción (fase 2)

- Login: `POST /api/auth/login` → Supabase `signInWithPassword` + lectura de `profiles` (`src/lib/auth/productionLogin.ts`).
- Sesión servidor: cookie HMAC `df_session` (`src/lib/auth.ts`).
- Bootstrap panel: `GET /api/clinic/bootstrap` mapea filas Supabase a `DemoState` (`src/lib/bootstrap/clinicState.ts`).
- Guards: `src/lib/api/guards.ts` acota APIs por `clinic_id` de la sesión.
- Migración: `0009_auth_bootstrap.sql` (`profiles.tenant_id`, índices).

### Datos

Entidades principales:

- clinics
- profiles
- dentists (`collegiate_number`, `email`, `phone` — obligatorio al alta de Dr/Dra para pie de informes)
- treatments
- rooms
- appointments
- appointment_events
- invoices
- payments
- messages
- reminders
- campaigns
- reviews
- availability_rules
- audit_logs (event_type, module, severity, result, user_email, tenant_id, IP, user_agent — migración 0030)
- login_events (historial de sesiones e intentos de login)
- system_logs
- role_permissions
- clinic_settings
- integrations

### Cache

Redis se usa para:

- Métricas de dashboard.
- Slots de disponibilidad.
- Catálogos de tratamientos/dentistas.
- Estado de jobs de recordatorios.

Nunca cachear datos clínicos sensibles sin estrategia explícita de seguridad.

## Multi-tenant

Toda entidad operativa contiene `clinic_id`. Las políticas RLS deben impedir acceso cruzado entre clínicas.

Migración `0028_rls_records_gaps.sql` cierra huecos en consentimientos, documentos, mensajes, pagos y lectura de facturas por paciente. Las APIs usan `assertClinicScopeAsync` y `assertOwnPatient` en `src/lib/api/guards.ts`. Matriz QA: `docs/QA_E2E_MATRIX.md` · script `npm run qa:audit`.

## Roles

- `patient`: portal propio.
- `receptionist`: agenda, pacientes, citas, pagos.
- `dentist`: agenda propia, ficha clínica, notas.
- `admin`: configuración clínica, reportes, equipos.
- `owner`: multi-sede, facturación SaaS, permisos globales.

## Notificaciones

`src/pages/api/reminders/send.ts` está en modo mock para envíos masivos administrativos.
`src/pages/api/notifications/appointment.ts` procesa confirmaciones de cita y genera enlace de activación `/activar`.

- WhatsApp Cloud API de Meta si `WHATSAPP_PROVIDER=meta`.
- Email transaccional unificado en `src/lib/email/send.ts`: SMTP (Hostinger) o Resend según credenciales (`EMAIL_PROVIDER=auto` por defecto).
- SMS en modo mock preparado para futuro adaptador.
- Fallback mock si faltan credenciales.

## Estado actual

- **Producción por defecto** (`PUBLIC_DEMO_MODE=false`): sin semillas demo en UI ni `/api/demo/state`.
- Panel **Super Admin** en `/platform` (clínicas, registros, soporte).
- Alta de clínicas en `/registro-clinica` con aprobación manual.
- Migración `0008_production_platform.sql`: RLS, registros, suscripciones, soporte.
- Paneles clínica/paciente: estado vacío hasta integración Supabase Auth completa (ver `docs/PRODUCTION.md`).
- Redis con fallback memoria.

## Rutas API

- `GET/POST /api/appointments`
- `PATCH /api/appointments`
- `GET /api/patients`
- `GET /api/treatments`
- `GET /api/dentists`
- `GET /api/locations`
- `GET /api/availability`
- `GET /api/admin/metrics`
- `GET /api/admin/modules`
- `GET /api/cache/health`
- `POST /api/reminders/send`
- `POST /api/notifications/appointment`
