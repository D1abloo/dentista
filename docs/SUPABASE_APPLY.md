# Aplicar migraciones en Supabase

Orden recomendado (SQL Editor o `supabase db push`):

1. `0008_production_platform.sql`
2. `0009_auth_bootstrap.sql`
3. `0010_phase3_records_billing.sql`
4. `0011_phase4_ops.sql`

## Variables en `.env` (producción)

```env
PUBLIC_DEMO_MODE=false
PUBLIC_SUPABASE_URL=https://rvknkzbxxaeoxqkgzsdq.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role>
AUTH_SESSION_SECRET=<secreto-32+>
STRIPE_SECRET_KEY=<opcional>
STRIPE_WEBHOOK_SECRET=<opcional>
PUBLIC_APP_URL=https://tu-dominio.com
```

No subas las keys al repositorio.

## Tras aplicar SQL

1. Crear usuario Super Admin en `.env` y probar `/platform/login`.
2. Aprobar una clínica en `/platform/registros`.
3. Login clínica en `/login` con el usuario creado al aprobar.
4. Verificar bootstrap: `GET /api/clinic/bootstrap` con sesión.
5. Crear informe/documento/mensaje desde `/admin` y comprobar filas en Supabase.
6. Encolar recordatorio: `POST /api/reminders/send` → procesa cola automáticamente.
7. Pago Stripe: `POST /api/billing/stripe-checkout` y webhook `POST /api/billing/stripe-webhook`.

## Webhook Stripe

En el dashboard de Stripe, endpoint:

`https://tu-dominio.com/api/billing/stripe-webhook`

Evento: `checkout.session.completed`
