# Arquitectura DentalFlow

## Vista general

DentalFlow está diseñado como SaaS multi-clínica con frontend SSR, componentes interactivos y backend ligero en rutas API de Astro.

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

### Datos

Entidades principales:

- clinics
- profiles
- dentists
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
- audit_logs
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
- Email transaccional vía Resend si `EMAIL_PROVIDER=resend`.
- SMS en modo mock preparado para futuro adaptador.
- Fallback mock si faltan credenciales.

## Estado actual

- UI premium lista en modo demo para portal paciente, reserva y admin.
- Landing Dentista+ conectada a catálogos, sedes, disponibilidad y creación de citas.
- APIs demo con contratos reales y validación Zod en payloads/queries.
- Migraciones SQL listas para Supabase, incluyendo módulos operativos admin.
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
