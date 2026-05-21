# Guía de uso del panel Dentista+

Esta guía explica las funciones principales de los paneles y cómo operar el sistema en producción.

## Tipos de acceso

- `/platform/login`: acceso Super Admin (nivel plataforma).
- `/login`: acceso de clínica (staff/admin) y paciente.
- `/admin`: panel interno de la clínica (requiere sesión staff).
- `/paciente`: portal del paciente (requiere sesión paciente).

## Panel Super Admin (`/platform`)

Este panel sirve para operar el SaaS a nivel global. El sidebar está organizado por secciones: **General**, **Clínicas y tenants**, **Altas**, **Operaciones** y **Sistema**.

### Aislamiento entre clínicas

- Cada clínica aprobada recibe un `tenant_id` único y accede solo a su panel `/admin`.
- Pacientes, citas, facturas y mensajes están acotados por `clinic_id` y RLS; no hay contacto ni listados cruzados entre organizaciones.
- Revisa el estado en `/platform/aislamiento` y la documentación en `/platform/seguridad`.

### Módulo de clínicas (`/platform/clinicas`)

- Ver listado de clínicas y su estado (`active`, `pending`, `suspended`).
- Cambiar plan de suscripción.
- Activar o suspender clínicas.

### Usuarios (`/platform/usuarios`)

- **Solo super administrador** (`/platform/login`): crear y listar cuentas de personal y pacientes.
- El panel de clínica (`/admin`) no gestiona usuarios.
- Alta con rol, clínica, destino (panel clínica o portal paciente) y envío de credenciales por correo.
- Filtro por clínica y buscador por nombre o email.

### Registros (`/platform/registros` y `/platform/historial`)

- **Pendientes**: solicitudes desde `/registro-clinica` por aprobar o rechazar.
- **Historial**: altas ya procesadas (aprobadas o rechazadas).
- Al aprobar una clínica:
  - Se crea un **tenant** aislado.
  - Se crea la clínica vinculada al tenant.
  - Se crea su suscripción inicial (`essential`).
  - Se crea un usuario en Supabase Auth con `clinic_id` y `tenant_id` en metadata.
  - Se crea un perfil `clinic_admin` en `profiles`.

### Suscripciones (`/platform/suscripciones`)

- Planes SaaS, asientos y estado de facturación por clínica.

### Soporte (`/platform/soporte`)

- Revisar tickets y cambiar estado (`open`, `in_progress`, `resolved`, `closed`).

### Métricas (`/platform/metricas`)

- Contadores agregados por día y clínica (sin datos clínicos sensibles).

### Configuración (`/platform/configuracion`)

- Branding global y reglas de registro de nuevas clínicas.

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
