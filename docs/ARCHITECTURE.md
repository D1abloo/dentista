# Arquitectura DentalFlow / AgendaClinic

## Vista general

SaaS multi-clínica con frontend SSR (Astro), islas React, API en rutas Astro y PostgreSQL (Supabase) con RLS.

**Regla de aislamiento:** cada clínica registrada es **independiente** — relación 1:1 entre `clinics` y `tenants`. No hay cruce de datos clínicos entre clínicas.

```txt
Navegador (público / paciente / admin / plataforma)
        ↓
Astro SSR + React Islands
        ↓
API Routes (Zod + guards)
        ↓                    ↓
Supabase PostgreSQL/RLS       Redis (opcional)
        ↓                    ↓
Auth / Storage / Audit        Métricas / disponibilidad
```

## Capas

### Frontend

- **Páginas Astro:** SEO, routing, layouts (`AppLayout`, shells admin/paciente).
- **React:** portales, agenda, asistente IA, formularios.
- **Estilos:** Tailwind + `dental-saas.css`, `public-site.css`, `ai-booking.css`.

### Superficies principales

| Superficie | Rutas | Notas |
|------------|-------|-------|
| Sitio público | `/`, `/contacto`, `/registro-clinica`, `/registro-paciente` | Marca AgendaClinic |
| Asistente IA | `/citas-con-ia`, widget «Citas con IA» | Gemini + verificación paciente |
| Reserva clásica | `/reserva` | Flujo público extendido |
| Portal paciente | `/paciente/*` | Cookie `df_session` en LIVE |
| Panel clínica | `/admin/*` | Bootstrap `GET /api/clinic/bootstrap` |
| Super Admin | `/platform/*` | Plataforma multi-clínica |

### API

- Ubicación: `src/pages/api/**`
- Validación: **Zod** (`src/lib/validators.ts`)
- Respuesta: `{ data, error, meta }`
- Guards: `src/lib/api/guards.ts` (`assertClinicScopeAsync`, `assertOwnPatient`, …)
- Service role **solo servidor** (`getSupabaseAdmin`)

### Auth producción

- Login: `POST /api/auth/login` → Supabase Auth + `profiles`
- Sesión: cookie HMAC `df_session` (`src/lib/auth.ts`)
- Bootstrap: `GET /api/clinic/bootstrap`
- Cuenta dual plataforma+clínica: `src/lib/auth/dualRoleClinic.ts`
- Admin global: `src/lib/auth/platformClinicAccess.ts`

## Asistente de citas con IA

### Principios

1. **Gemini Pro** (`src/lib/ai/geminiAppointmentsAssistant.ts`) clasifica intención y genera respuesta en español.
2. **Nunca** inventa huecos ni citas existentes.
3. Huecos: `getAvailableSlotsForPublicBooking` (`src/lib/services/publicAiBooking.ts`).
4. Citas del paciente: solo tras verificación (`src/lib/services/patientAppointmentsPublic.ts`).

### Flujo reserva nueva

```txt
Chat → POST /api/ai/appointments-chat → intent JSON
     → disponibilidad real → selección hueco
     → datos paciente → POST /api/public-booking/create
     → appointments.source = public_ai_assistant
```

### Flujo gestión citas (ver / cambiar / cancelar)

```txt
Chat → intención review | next | cancel | reschedule
     → verificación (sesión paciente o email+teléfono)
     → token firmado (patient_verification_tokens + HMAC)
     → list / cancel / reschedule con revalidación de huecos
```

### Orquestación n8n (opcional)

Cuando `N8N_APPOINTMENTS_WEBHOOK_URL` está configurado:

```txt
App → POST /api/appointments/intent → webhook n8n
n8n → intención + confirmación explícita
    → GET/POST /api/appointments/* (Bearer N8N_SERVICE_TOKEN)
    → backend valida permisos y disponibilidad real
    → POST /api/appointments/audit-log
```

Ver `docs/N8N.md`. El backend sigue siendo la fuente de verdad; n8n no persiste citas sin `confirm: true`.

### Componentes UI

- `src/components/public/ai-booking/` — `AiAppointmentsAssistant`, hook `useAiAppointmentsFlow`
- `src/components/public/AiAppointmentsWidget.tsx` — drawer flotante

## Entidades principales (PostgreSQL)

- `clinics`, `profiles`, `dentists`, `treatments`, `appointments`, `appointment_events`
- `schedule_blocks`, `availability_rules`
- Informes, documentos, facturas, pagos, mensajes, consentimientos
- `clinic_settings` (incl. `allow_public_ai_booking`, límites reserva pública)
- `patient_verification_tokens` (migración `0038`)
- `audit_logs`, `login_events` (monitorización `0030`/`0031`)

## Cache

Redis (opcional) para métricas, catálogos y disponibilidad. Sin Redis: fallback en memoria (`src/lib/cache.ts`).

## Roles

| Rol | Acceso |
|-----|--------|
| `patient` | Portal paciente |
| `receptionist`, `dentist`, `admin`, `owner` | Panel clínica (alcance según rol) |
| `super_admin` | Plataforma `/platform` |

## Notificaciones

- Email: `src/lib/email/send.ts` (SMTP / Resend)
- WhatsApp: Meta Cloud API si está configurado
- Confirmaciones cita: `POST /api/notifications/appointment`

## Rutas API (referencia)

### Citas y catálogo

- `GET/POST/PATCH /api/appointments`
- `GET /api/patients`, `/api/treatments`, `/api/dentists`, `/api/locations`
- `GET /api/availability`

### Asistente IA y reserva pública

- `POST /api/ai/appointments-chat` — chat + intención + huecos/citas según contexto
- `POST /api/ai/booking-chat` — alias legacy (misma lógica)
- `POST /api/public-booking/available-slots`
- `POST /api/public-booking/create`
- `GET/POST /api/public/ai-booking` — bootstrap/slots legacy

### Gestión citas paciente (verificado)

- `POST /api/patient-appointments/verify`
- `GET /api/patient-appointments/list`
- `GET /api/patient-appointments/next`
- `POST /api/patient-appointments/cancel`
- `POST /api/patient-appointments/reschedule`
- `POST /api/patient-appointments/send-secure-link`

### Admin, plataforma, auth

- `GET /api/admin/metrics`, `/api/admin/modules`
- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/clinic/bootstrap`
- Rutas bajo `/api/platform/*`, `/api/records/*`, `/api/billing/*`

## Estado actual (mayo 2026)

- Producción por defecto: `PUBLIC_DEMO_MODE=false`
- Paneles LIVE con Supabase Auth y bootstrap
- SEO: `robots.txt`, `sitemap.xml`, metadatos por ruta
- Asistente IA premium en widget + `/citas-con-ia`
- Migraciones aplicables hasta `0038_patient_verification_ai_appointments.sql`
