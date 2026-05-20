# Dentista+ — Despliegue en producción

## Modo de operación

| Variable | Producción | Solo desarrollo local |
|----------|------------|------------------------|
| `PUBLIC_DEMO_MODE` | `false` (por defecto) | `true` para datos demo locales |
| `AUTH_SESSION_SECRET` | Obligatorio (32+ caracteres aleatorios) | Puede usar valor dev |
| Supabase | URL + anon + service role configurados | Opcional en demo |

Con `PUBLIC_DEMO_MODE=false`:

- No se cargan semillas demo ni `localStorage` de pacientes ficticios.
- El endpoint `/api/demo/state` responde **403**.
- Los paneles clínica/paciente arrancan con estado vacío hasta conectar Supabase.
- El login clínica/paciente usa **Supabase Auth** + fila en `profiles` (cookie de sesión HMAC en servidor).
- Tras login, los paneles cargan datos con `GET /api/clinic/bootstrap`.

## Super Admin

1. Configura en `.env`:
   - `SUPER_ADMIN_EMAIL`
   - `SUPER_ADMIN_PASSWORD`
   - `SUPER_ADMIN_NAME` (opcional)
2. Aplica migraciones: `supabase db push` o ejecuta `0008_production_platform.sql`.
3. Accede a `/platform/login`.

### Capacidades del panel `/platform`

- Resumen de clínicas y registros pendientes
- Aprobar / rechazar altas en `/platform/registros`
- Activar, suspender y cambiar plan en `/platform/clinicas`
- Ver tickets de soporte en `/platform/soporte`

## Alta de clínicas

Las clínicas solicitan acceso en `/registro-clinica` → `POST /api/public/clinic-registration`.

Tras aprobar, se crea la fila en `clinics` + `clinic_subscriptions` con plan `essential`, un usuario en **Supabase Auth** y un perfil `clinic_admin` (contraseña inicial: `CLINIC_DEFAULT_PASSWORD` en `.env`).

## Aislamiento multi-tenant

- Toda tabla operativa incluye `clinic_id` / `tenant_id`.
- RLS en PostgreSQL con funciones `current_clinic_id()`, `is_super_admin()`, `is_clinic_staff()`.
- Las APIs de plataforma usan **service role** solo en servidor, nunca en el cliente.
- Validación Zod en todos los endpoints.

## Variables de entorno recomendadas (producción)

Ver `.env.example`. Mínimo:

```env
PUBLIC_DEMO_MODE=false
AUTH_SESSION_SECRET=<generar-secreto-fuerte>
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
CLINIC_DEFAULT_PASSWORD=<password-temporal-alta-clinica>
PUBLIC_APP_URL=https://tu-dominio.com
```

Aplica también la migración `0009_auth_bootstrap.sql` (índices y `profiles.tenant_id`).

## Login clínica / paciente (fase 2)

1. Usuario en Supabase Auth vinculado a `profiles.auth_user_id`.
2. `POST /api/auth/login` valida contraseña, comprueba `clinics.status = active` y guarda sesión.
3. El cliente llama `GET /api/clinic/bootstrap` para hidratar el estado del panel.
4. Las APIs de citas exigen sesión y acotan por `clinic_id` (`src/lib/api/guards.ts`).

## Próximos pasos

- Persistir cambios del panel en Supabase (hoy el bootstrap es lectura; mutaciones siguen en memoria/demo store)
- Webhooks de facturación (Stripe) ligados a `clinic_subscriptions`
- Cola de notificaciones (email/WhatsApp) en producción
- JWT de Supabase en cliente para RLS directo (opcional; hoy sesión por cookie)

## Fase 3 aplicada

- Endpoints nuevos de persistencia:
  - `POST/PATCH /api/records/report`
  - `POST /api/records/document`
  - `POST /api/records/message`
  - `POST/PATCH /api/records/consent`
- Checkout Stripe:
  - `POST /api/billing/stripe-checkout`
  - Usa `STRIPE_SECRET_KEY` (si falta, fallback mock).
- Cola de recordatorios:
  - `POST /api/reminders/send` ahora encola en `notification_jobs`.
- Migración: `0010_phase3_records_billing.sql`

## Comprobaciones antes de publicar

```bash
npm run check
npm run smoke
npm run build
```

Verificar manualmente: `/`, `/contacto`, `/registro-clinica`, `/platform/login`, `/login`, `/admin` (vacío sin datos hasta Supabase).

## Ayuda funcional de paneles

Para operación diaria del producto, consultar `docs/PANEL_HELP.md`.
