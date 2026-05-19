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
- El login usa credenciales de producción (Super Admin + futuro Supabase Auth).

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

Tras aprobar, se crea la fila en `clinics` + `clinic_subscriptions` con plan `essential`.

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
PUBLIC_APP_URL=https://tu-dominio.com
```

## Próximos pasos (integración completa)

- Login clínica/paciente vía Supabase Auth + `profiles` con `clinic_id` en JWT
- Sincronizar paneles admin/paciente con APIs reales (sin `DemoState` local)
- Webhooks de facturación (Stripe) ligados a `clinic_subscriptions`
- Cola de notificaciones (email/WhatsApp) en producción

## Comprobaciones antes de publicar

```bash
npm run check
npm run smoke
npm run build
```

Verificar manualmente: `/`, `/contacto`, `/registro-clinica`, `/platform/login`, `/login`, `/admin` (vacío sin datos hasta Supabase).
