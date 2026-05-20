# Aplicar migraciones en Supabase (desde cero)

Si en Supabase **no has ejecutado ninguna migración**, sigue este orden en el **SQL Editor** (pestaña *New query* → pegar archivo → *Run*), uno por uno.

## Orden obligatorio

| # | Archivo | ¿Obligatorio? | Qué hace |
|---|---------|---------------|----------|
| 1 | `0001_schema.sql` | **Sí** | Tablas base: clínicas, perfiles, citas, facturas, pagos, RLS inicial |
| 2 | `0002_seed.sql` | Recomendado | Datos demo (clínica Madrid, pacientes, dentistas) para pruebas |
| 3 | `0003_operations.sql` | **Sí** | Disponibilidad, campañas, reseñas, permisos, integraciones |
| 4 | `0004_seed_operations.sql` | Recomendado | Semillas de módulos operativos |
| 5 | `0005_patient_records.sql` | **No ejecutar** | Legacy (IDs texto); choca con `0006`. **Saltar.** |
| 6 | `0006_multi_tenant_rls.sql` | **Sí** | Tenants, pacientes UUID, informes, documentos, mensajes, RLS |
| 7 | `0007_demo_app_state.sql` | Opcional | Tabla JSON para modo demo remoto (`PUBLIC_DEMO_MODE=true`) |
| 8 | `0008_production_platform.sql` | **Sí** | Super Admin, registros de clínicas, suscripciones, soporte |
| 9 | `0009_auth_bootstrap.sql` | **Sí** | Índices auth y `profiles.tenant_id` |
| 10 | `0010_phase3_records_billing.sql` | **Sí** | Consentimientos, cola de notificaciones, checkout Stripe |
| 11 | `0011_phase4_ops.sql` | **Sí** | FK a `profiles`, columnas factura/pago, webhook Stripe |

### Resumen rápido

Ejecuta **10 archivos** en este orden:

```
0001 → 0002 → 0003 → 0004 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011
```

**No ejecutes** `0005_patient_records.sql` en una instalación nueva.

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
2. Super Admin: `/platform/login` (credenciales de `.env`)
3. Alta de clínica: `/registro-clinica` → aprobar en `/platform/registros`
4. Login clínica: `/login` (usuario creado al aprobar + `CLINIC_DEFAULT_PASSWORD`)
5. Comprueba que el panel carga datos: `/admin` y `/paciente`

## Webhook Stripe (opcional)

Endpoint: `https://tu-dominio.com/api/billing/stripe-webhook`  
Evento: `checkout.session.completed`
