# Aplicar migraciones en Supabase (desde cero)

Si en Supabase **no has ejecutado ninguna migración**, sigue este orden en el **SQL Editor** (pestaña *New query* → pegar archivo → *Run*), uno por uno.

## Orden obligatorio

| # | Archivo | ¿Obligatorio? | Qué hace |
|---|---------|---------------|----------|
| 1 | `0001_schema.sql` | **Sí** | Tablas base: clínicas, perfiles, citas, facturas, pagos, RLS inicial |
| 2 | `0002_seed.sql` | Solo si quieres datos demo en BD | Clínica Madrid de prueba. En **PRO** puedes **saltarlo** |
| 3 | `0003_operations.sql` | **Sí** | Disponibilidad, campañas, reseñas, permisos, integraciones |
| 4 | `0004_seed_operations.sql` | Solo con `0002` | Semillas operativas (requiere clínica `dentalflow-madrid`). En **PRO** **saltar** |
| 5 | `0005_patient_records.sql` | **No ejecutar** | Legacy (IDs texto); choca con `0006`. **Saltar.** |
| 6 | `0006_multi_tenant_rls.sql` | **Sí** | Tenants, pacientes UUID, informes, documentos, mensajes, RLS |
| 7 | `0007_demo_app_state.sql` | Opcional | Tabla JSON para modo demo remoto (`PUBLIC_DEMO_MODE=true`) |
| 8 | `0008_production_platform.sql` | **Sí** | Super Admin, registros de clínicas, suscripciones, soporte |
| 9 | `0009_auth_bootstrap.sql` | **Sí** | Índices auth y `profiles.tenant_id` |
| 10 | `0010_phase3_records_billing.sql` | **Sí** | Consentimientos, cola de notificaciones, checkout Stripe |
| 11 | `0011_phase4_ops.sql` | **Sí** | FK a `profiles`, columnas factura/pago, webhook Stripe |
| … | `0012`–`0017` | Según despliegue | Sucursales, PdP, logo, política contraseña, registro paciente |
| 18 | `0018_profiles_staff_patient_email.sql` | **Sí en PRO** | Mismo email staff + paciente en una clínica |
| 19 | `0019`–`0030` | **Sí** | NHC, bloques agenda, RLS records, auditoría/monitorización |
| 20 | `0031_security_rls_hardening.sql` | **Sí** | Hardening RLS + backfill idempotente de `0030` |
| 21 | `0032_schedule_block_dentist_ids.sql` | **Sí** | Columna `dentist_ids` en `schedule_blocks` (desbloqueo multi-profesional) |
| 22 | `0033_messages_from_patient.sql` | **Sí** | Columna `from_patient` en `messages` (mensajes bidireccionales portal) |
| 23 | `0034_staff_clinic_preferences.sql` | **Sí** | Preferencias staff por clínica |
| 24 | `0035_organizations_staff_access.sql` | **Sí** | Acceso staff multi-organización |
| 25 | `0036_invoice_fiscal_fields.sql` | **Sí** | Campos fiscales en facturas |
| 26 | `0037_public_ai_booking.sql` | **Sí** | Reserva pública IA: `appointments.source`, settings `allow_public_ai_booking` |
| 27 | `0038_patient_verification_ai_appointments.sql` | **Sí** | Tokens verificación paciente, `cancelled_at`, `rescheduled_from_id`, `visible_to_patient` |

### Resumen rápido — modo PRO (`PUBLIC_DEMO_MODE=false`)

Ejecuta como mínimo:

```
0001 → 0003 → 0006 → 0008 → 0009 → 0010 → 0011 → … → 0038
```

**Estado remoto (may 2026):** aplicar `0037` y `0038` antes de usar el asistente IA completo en producción.

Opcional: `0007_demo_app_state.sql` (solo demo remoto).

**No ejecutes:** `0005` (legacy). En PRO también **salta `0002` y `0004`** (los usuarios reales se crean al aprobar clínicas en `/platform`).

### Resumen — con datos demo en Supabase (opcional)

```
0001 → 0002 → 0003 → 0004 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011
```

> `0002_seed.sql` requiere cast del enum `user_role` (ya corregido en el repo).

## Alternativa con CLI

Si tienes Supabase CLI enlazado al proyecto:

```bash
supabase link --project-ref rvknkzbxxaeoxqkgzsdq
# Renombra o mueve 0005 fuera de migrations temporalmente, o fallará.
supabase db push
```

## Variables en `.env` (producción)

```env
PUBLIC_DEMO_MODE=false
PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role>
AUTH_SESSION_SECRET=<secreto-32+>
SUPER_ADMIN_EMAIL=admin@dentista.app
SUPER_ADMIN_PASSWORD=<password-fuerte>
CLINIC_DEFAULT_PASSWORD=<password-alta-clinica>
STRIPE_SECRET_KEY=<opcional>
STRIPE_WEBHOOK_SECRET=<opcional>
PUBLIC_APP_URL=https://tu-dominio.com
```

No subas las keys al repositorio.

## Comprobar que quedó bien

En Supabase → **Table Editor**, deberías ver tablas como:

- `clinics`, `profiles`, `appointments`, `dentists`, `treatments`
- `tenants`, `clinical_reports`, `patient_documents`, `messages`
- `clinic_registrations`, `clinic_subscriptions`, `platform_admins`
- `informed_consents`, `notification_jobs`, `stripe_checkout_sessions`

## Tras aplicar SQL

1. Reinicia la app: `npm run dev`
2. Super Admin: `/platform/login` (credenciales de `.env` o usuario en `platform_admins`)
3. Alta de clínica: `/registro-clinica` → aprobar en `/platform/registros`
4. Login clínica: `/login` (usuario creado al aprobar + `CLINIC_DEFAULT_PASSWORD`)
5. Comprueba que el panel carga datos: `/admin` y `/paciente`
6. Ejecuta auditoría de seguridad:

```bash
npm run qa:db-security
```

Debe devolver `issueCount: 0`.

## CLI de usuarios (`npm run users`)

Script: `scripts/manage-users.mjs` (requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env`).

| Comando | Descripción |
|---------|-------------|
| `npm run users:list` | Lista usuarios Auth, perfiles y super admins |
| `npm run users:clinics` | Muestra IDs de clínicas |
| `npm run users -- add ...` | Crea usuario con accesos y permisos |

**Accesos (`--access`):**

- `platform` — Super Admin en `/platform`
- `clinic` — Panel de clínica en `/admin`
- `public` — Portal paciente en `/paciente`

**Permisos (`--permission`):** `read`, `write` o `execute` (tabla `role_permissions`).

Ejemplos:

```bash
npm run users:list
npm run users:clinics
npm run users -- add --email super@tu-dominio.com --password 'TuClave123!' --name "Super Admin" \
  --access platform --permission execute
npm run users -- add --email admin@clinica.com --password 'TuClave123!' --name "Admin Sede" \
  --access clinic --clinic-id <UUID> --role clinic_admin --permission execute
npm run users -- permissions --email admin@clinica.com --clinic-id <UUID> --role admin --level write
```

## Clínica ficticia en PRO (presentación)

1. Ejecuta `0018_profiles_staff_patient_email.sql` en el SQL Editor.
2. En `.env` define `SUPER_ADMIN_PASSWORD` (mín. 6 caracteres).
3. Carga datos: `npm run seed:clinic` — crea **Clínica Dental Nova** (`clinica-dental-nova`), elimina restos demo anteriores y configura `admin@dentista.app` con acceso a plataforma, `/admin` y `/paciente`.

Accesos directos tras el seed:

- Panel clínica: `/login/admin?email=admin@dentista.app`
- Portal paciente: `/login/paciente?email=admin@dentista.app`

## Webhook Stripe (opcional)

Endpoint: `https://tu-dominio.com/api/billing/stripe-webhook`  
Evento: `checkout.session.completed`
