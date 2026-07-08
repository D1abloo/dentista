# Seguridad

## Principios

- Mínimo privilegio.
- Validación server-side.
- RLS obligatorio.
- Separación paciente/admin.
- No exponer datos clínicos innecesarios.

## Supabase

- `profiles` se vincula con `auth.users`.
- Las tablas multi-tenant usan `clinic_id`.
- RLS reforzado en migraciones `0028_rls_records_gaps.sql` y `0031_security_rls_hardening.sql`.
- Ejecutar `npm run qa:db-security` después de cambios de esquema/políticas.
- Las políticas demo incluidas son base; auditar antes de producción.

## Redis

- No cachear notas clínicas sensibles.
- Usar TTL corto para métricas.
- Prefijo por entorno y clínica.

## API

- Usar Zod en todo POST/PATCH.
- Normalizar errores.
- Añadir rate limit antes de producción.

## Asistente IA y verificación de paciente

- **Gemini** (`GEMINI_API_KEY`): solo en servidor (`src/lib/ai/geminiAppointmentsAssistant.ts`). No clasifica disponibilidad ni inventa citas.
- Huecos de reserva: `getAvailableSlotsForPublicBooking` — misma lógica que reserva pública clásica.
- **Citas existentes:** no se listan sin verificación previa (`POST /api/patient-appointments/verify`).
- Tokens de verificación: tabla `patient_verification_tokens` + HMAC (`src/lib/auth/patientVerificationToken.ts`, migración `0038`).
- Sesión paciente autenticada (`df_session` con rol `patient`) puede omitir re-verificación en el mismo flujo de chat.
- Cancelación/reprogramación online respetan política de la clínica (`clinic_settings`) y revalidan huecos en servidor.

## Hallazgos y correcciones recientes (2026-05)

- Detectada exposición de `tenants` por `anon` (RLS desactivado) y tablas con RLS sin políticas.
- Corregido en `0031_security_rls_hardening.sql`:
  - activación RLS en `tenants`, `patients`, `clinic_usage_daily`;
  - políticas explícitas en `rooms`, `reminders`, `appointment_events`, `clinic_subscriptions`, `patient_portal_access_*`, `platform_inspect_audit`;
  - backfill idempotente de `0030` (`audit_logs.event_type`, `login_events`).
- **2026-05-28 (alerta Supabase `rls_disabled_in_public`):** migración `0039_rls_missing_tables.sql`:
  - RLS + políticas en `organization_groups` y `patient_verification_tokens` (deny-all cliente; API con service role);
  - políticas en `staff_clinic_assignments` y `staff_clinic_preferences` (super admin, staff propio, clínica actual).
  - Verificación: `node --env-file=.env scripts/audit-db-security.mjs` → `issueCount: 0`.

## Sesiones demo

- `/admin` requiere sesión con rol `admin`.
- `/paciente` requiere sesión con rol `patient`.
- La cookie `df_session` es HTTP-only, SameSite=Lax y está firmada con `AUTH_SESSION_SECRET`.
- Las credenciales demo viven en `.env`; no deben tratarse como credenciales de producción.
- Sustituir `src/lib/auth.ts` por Supabase Auth antes de operar con usuarios reales.

## Datos personales

Este repositorio no implementa asesoría legal. Antes de operar con pacientes reales, revisa normativa local aplicable a salud, protección de datos, consentimiento y retención de historias clínicas.

## Dependencias — estado tras auditoría (2026-07)

### Aplicado de forma segura

- `npm audit fix` (sin `--force`): toolchain dev actualizado.
- `nodemailer@9.0.3` + `disableFileAccess` + `disableUrlAccess` en `src/lib/email/send.ts`.
- Supabase RLS: migración `0039_rls_missing_tables.sql` (verificar con `qa:db-security` cuando `DATABASE_URL` sea válida).

### Upgrade Astro 7 + nodemailer 9 (2026-07, Vercel)

- `astro@7.0.6`, `@astrojs/vercel@11.0.2`, `@astrojs/react@6`, `@astrojs/node@11` (dev/VPS)
- `@astrojs/tailwind@6` con `legacy-peer-deps` (integración deprecada; migrar a `@tailwindcss/vite` en sprint futuro)
- `overrides.path-to-regexp@^8.4.0` para cerrar GHSA en `@vercel/routing-utils`
- `.npmrc`: `legacy-peer-deps=true` para installs reproducibles en CI/Vercel
- Verificación: `npm audit` → 0 vulnerabilidades; `npm run build`, `npm run check`, `npm run smoke` OK

### Pendiente (no bloqueante)

- Migrar Tailwind v3 + `@astrojs/tailwind` → `@tailwindcss/vite` (Tailwind 4) cuando se retire la integración legacy.

### Verificación Supabase

Si el linter de Supabase sigue alertando: ejecutar `0039` en SQL Editor y refrescar Linter. Localmente: actualizar `DATABASE_URL` en `.env` si el proyecto fue pausado o rotado.
