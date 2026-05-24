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

## Hallazgos y correcciones recientes (2026-05)

- Detectada exposición de `tenants` por `anon` (RLS desactivado) y tablas con RLS sin políticas.
- Corregido en `0031_security_rls_hardening.sql`:
  - activación RLS en `tenants`, `patients`, `clinic_usage_daily`;
  - políticas explícitas en `rooms`, `reminders`, `appointment_events`, `clinic_subscriptions`, `patient_portal_access_*`, `platform_inspect_audit`;
  - backfill idempotente de `0030` (`audit_logs.event_type`, `login_events`).

## Sesiones demo

- `/admin` requiere sesión con rol `admin`.
- `/paciente` requiere sesión con rol `patient`.
- La cookie `df_session` es HTTP-only, SameSite=Lax y está firmada con `AUTH_SESSION_SECRET`.
- Las credenciales demo viven en `.env`; no deben tratarse como credenciales de producción.
- Sustituir `src/lib/auth.ts` por Supabase Auth antes de operar con usuarios reales.

## Datos personales

Este repositorio no implementa asesoría legal. Antes de operar con pacientes reales, revisa normativa local aplicable a salud, protección de datos, consentimiento y retención de historias clínicas.
