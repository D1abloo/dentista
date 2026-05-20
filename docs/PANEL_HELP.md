# Guía de uso del panel Dentista+

Esta guía explica las funciones principales de los paneles y cómo operar el sistema en producción.

## Tipos de acceso

- `/platform/login`: acceso Super Admin (nivel plataforma).
- `/login`: acceso de clínica (staff/admin) y paciente.
- `/admin`: panel interno de la clínica (requiere sesión staff).
- `/paciente`: portal del paciente (requiere sesión paciente).

## Panel Super Admin (`/platform`)

Este panel sirve para operar el SaaS a nivel global.

### Módulo de clínicas (`/platform/clinicas`)

- Ver listado de clínicas y su estado (`active`, `pending`, `suspended`).
- Cambiar plan de suscripción.
- Activar o suspender clínicas.

### Módulo de registros (`/platform/registros`)

- Revisar solicitudes recibidas desde `/registro-clinica`.
- Aprobar o rechazar altas con notas de revisión.
- Al aprobar una clínica:
  - Se crea la clínica.
  - Se crea su suscripción inicial (`essential`).
  - Se crea un usuario en Supabase Auth.
  - Se crea un perfil `clinic_admin` en `profiles`.

### Módulo de soporte (`/platform/soporte`)

- Revisar tickets abiertos o en progreso.
- Dar seguimiento operativo a incidencias de clínicas.

## Panel de clínica (`/admin`)

Panel para operaciones diarias del equipo clínico.

### Qué muestra

- Agenda y citas.
- Pacientes y su historial operativo.
- Elementos administrativos del día a día.

### Cómo carga datos en producción

1. Usuario staff inicia sesión en `/login`.
2. El backend valida Supabase Auth y `profiles`.
3. El frontend llama `GET /api/clinic/bootstrap`.
4. El panel se hidrata con datos de la clínica asignada.

## Portal paciente (`/paciente`)

Espacio privado para que el paciente consulte y gestione sus citas según permisos de sesión.

### Reglas importantes

- Solo ve su propia información.
- No puede operar sobre datos de otros pacientes.
- Las APIs validan alcance por `clinic_id` y por identidad de paciente.

## Flujo recomendado de operación

1. Revisar y aprobar registro de clínica en `/platform/registros`.
2. Entregar credenciales iniciales a la clínica.
3. Clínica entra por `/login` y opera desde `/admin`.
4. Pacientes entran por `/login` y usan `/paciente`.

## Variables de entorno clave

- `PUBLIC_DEMO_MODE=false`
- `AUTH_SESSION_SECRET`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `CLINIC_DEFAULT_PASSWORD`

## Solución rápida de problemas

- **401 No autenticado**: cerrar sesión e iniciar de nuevo; revisar cookie de sesión.
- **403 Sin permisos de clínica**: confirmar que el usuario pertenece a la clínica correcta.
- **Login falla**: validar usuario en Supabase Auth y vínculo `profiles.auth_user_id`.
- **Panel vacío en LIVE**: revisar `GET /api/clinic/bootstrap` y datos base de la clínica.

## Fase 4 (sincronización LIVE)

- Tras guardar en admin/paciente, el panel recarga datos desde Supabase.
- Citas: crear y cambiar estado persisten en servidor.
- Facturas/pagos: APIs `/api/billing/invoice` y `/api/billing/payment`.
- Recordatorios: cola `notification_jobs` procesada automáticamente al enviar.
- Stripe: webhook en `/api/billing/stripe-webhook`.

Ver `docs/SUPABASE_APPLY.md` para aplicar migraciones `0010` y `0011`.

## Referencias técnicas

- `docs/PRODUCTION.md`
- `docs/SUPABASE_APPLY.md`
- `docs/ARCHITECTURE.md`
- `src/lib/auth/productionLogin.ts`
- `src/lib/api/guards.ts`
- `src/pages/api/clinic/bootstrap.ts`
