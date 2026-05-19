# Dentista / DentalFlow — Gestión premium de citas dentales

App lista para abrir en **Codex** y trabajar en **desarrollo local con npm**, sin Docker y sin Kubernetes. Incluye una landing pública premium Dentista+, login demo por rol, portal de paciente, panel admin, rutas API, Supabase preparado, Redis cache opcional con fallback en memoria, SQL de base de datos, guías MCP, skill y prompts.

Repositorio objetivo:

**Cualquier cambio → subir a GitHub** (obligatorio tras cada tarea):

```bash
npm run smoke
npm run git:save -- "tipo: mensaje claro"
```

Repositorio: `https://github.com/D1abloo/dentista.git`

DentalFlow showcase

## Stack

- **Astro SSR** para páginas rápidas, SEO y rutas API.
- **React** para dashboards interactivos y componentes complejos.
- **Supabase** para auth, PostgreSQL, RLS y storage.
- **Redis cache opcional** para métricas/disponibilidad; en desarrollo funciona con memoria si no hay Redis.
- **Tailwind CSS** para UI premium responsive.
- **Zod** para validación server-side.

## Regla principal de desarrollo

Este proyecto se trabaja con:

```bash
npm run dev
```

No se usa Docker ni Kubernetes en el flujo de desarrollo.

## Inicio rápido

```bash
cp .env.example .env
npm install
npm run dev
```

Abre:

- `http://localhost:4321/` landing pública Dentista+ con directorio de 58 clínicas demo, imágenes reales y buscador por clínica, ciudad, dirección, contacto y especialidad.
- `http://localhost:4321/login` acceso demo con selector de rol.
- `http://localhost:4321/activar?token=...` activación demo de cuenta de paciente.
- `http://localhost:4321/paciente` panel del paciente.
- `http://localhost:4321/paciente/reservar` reserva completa de cita.
- `http://localhost:4321/paciente/citas` gestión de citas del paciente.
- `http://localhost:4321/admin` panel administrativo.
- `http://localhost:4321/admin/agenda` agenda global.
- `http://localhost:4321/admin/citas` gestión administrativa de citas.

## Login (LIVE por defecto en Vercel)

`PUBLIC_DEMO_MODE=false` en producción: sesión por **cookie** (`/api/auth/login`), sin auto-login en `localStorage`.

| Rol | Email por defecto | Contraseña |
|-----|-------------------|------------|
| Admin | `admin@clinic.local` | `admin12345` |
| Paciente | `maria@example.com` | `paciente123` |

Configura `ADMIN_DEMO_*`, `PATIENT_DEMO_*` y `AUTH_SESSION_SECRET` en Vercel. Con `PUBLIC_DEMO_MODE=true` (solo desarrollo demo) vuelve el login por botones y `localStorage`.

Paciente y clínica tienen **portales separados**. Enlaces:

| URL | Destino |
|-----|---------|
| `/login/paciente` | Login solo paciente (PAT-0001) |
| `/login/admin` | Login solo administración clínica |
| `/login/admin?tenant=TEN-0002` | Admin Clínica Norte |
| `/login` | Selector de portal |
| `/admin` o `/paciente` sin sesión | Pantalla de acceso requerido |

- **Paciente:** `PAT-0001` (María González, multi-clínica en demo)
- **Admin:** Centro (`TEN-0001`), Norte (`TEN-0002`) o Sur (`TEN-0003`) — cada panel solo ve su `tenantId`

La sesión se guarda en `localStorage` (`dentista_role`, `dentista_patient_id`, `dentista_tenant_id`). Ver `docs/ROLES.md`, `docs/MULTI_TENANT.md` y `docs/LOCALSTORAGE_DEMO.md`.

`RoleGate` muestra qué usuario hace falta si entras en `/admin` o `/paciente` sin sesión o con el rol equivocado (no re-inicia sesión solo). Los endpoints de auth demo siguen disponibles con credenciales ficticias para pruebas API.

## Documentación frontend

- `docs/FRONTEND.md` — sitio público, portal paciente y panel admin
- `docs/MULTI_TENANT.md` — aislamiento por clínica y portal paciente unificado
- `docs/PRIVACIDAD.md` — cookies, demo y RLS en producción

## Subir cada cambio a GitHub (obligatorio)

Después de **cada** cambio relevante, ejecutar siempre:

```bash
npm run smoke
npm run check    # opcional si hay build previo en .vercel/
npm run git:save -- "feat: describe el cambio"
```

El script `git:save` configura `origin`, crea commit y hace **push a `main`** en `https://github.com/D1abloo/dentista.git`.

Comandos manuales equivalentes:

```bash
git add -A
git commit -m "feat: describe el cambio"
git push origin main
```

## Modo demo y modo LIVE

**Producción (Vercel):** `PUBLIC_DEMO_MODE=false` — modo **LIVE** (login con email/contraseña, cookie de sesión, sin auto-login paciente).

**Desarrollo demo:** `PUBLIC_DEMO_MODE=true` — botones de acceso rápido y `localStorage` (`dentista_role`, etc.). Los paneles y API siguen usando datos de muestra; con Supabase configurado también se puede persistir en `demo_app_state`.

### Vinculación admin ↔ paciente (modo demo)

Todas las entidades clínicas usan **IDs legibles** y se guardan en `localStorage` (`dentista_demo_v3`):


| Prefijo | Entidad         | Ejemplo                                          |
| ------- | --------------- | ------------------------------------------------ |
| `PAT`   | Paciente        | `PAT-0001` (María González, login demo paciente) |
| `CIT`   | Cita            | `CIT-0001`                                       |
| `INF`   | Informe clínico | `INF-0001`                                       |
| `FAC`   | Factura         | `FAC-0001`                                       |
| `PAG`   | Pago            | `PAG-0001`                                       |
| `DOC`   | Documento       | `DOC-0001`                                       |


**Regla:** al crear informes, facturas, pagos o documentos en admin debes elegir un `patientId`. Ese registro aparece automáticamente en el portal del paciente (informes, documentos visibles, facturas y pagos). Los documentos con `visibility: admin` no se muestran al paciente (simula RLS).

**Probar:**

1. Entra como **admin** en `/login/admin` → crea una factura `FAC-…` para `PAT-0001` en `/admin/facturas`.
2. Entra como **paciente** en `/login/paciente` → verás la factura en `/paciente/facturas`.
3. Ficha completa del paciente: `/admin/pacientes/PAT-0001`.

En producción, las tablas equivalentes están en `supabase/migrations/0005_patient_records.sql` con RLS por `patient_id`.

Para conectar Supabase real:

1. Crea proyecto en Supabase.
2. Ejecuta las migraciones de `supabase/migrations`.
3. Configura `.env` con URL, anon key y service role.
4. Deja `REDIS_URL` vacío si no tienes Redis en desarrollo; el fallback en memoria seguirá funcionando.
5. Cambia `PUBLIC_DEMO_MODE=false` cuando quieras usar datos reales.

### WhatsApp y correo

Las confirmaciones funcionan en modo mock por defecto. Para conectar proveedores reales configura `.env`:

- `WHATSAPP_PROVIDER=meta`
- `WHATSAPP_PHONE_NUMBER_ID` con el ID del número en WhatsApp Manager.
- `WHATSAPP_ACCESS_TOKEN` con token de Meta.
- `WHATSAPP_GRAPH_VERSION`, por defecto `v25.0`.
- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM`

No commitees tokens ni teléfonos reales. El teléfono destino se toma del paciente; `WHATSAPP_TEST_TO` solo sirve para pruebas locales.

## Estructura

```txt
src/
  components/       UI React premium
  layouts/          Layout Astro responsive
  lib/              Supabase, Redis opcional, cache, dominio y datos demo
  pages/            Frontend + API endpoints
supabase/
  migrations/       Schema, RLS y seed demo
docs/               MCP, prompts, arquitectura, seguridad, workflow dev
.codex/             Skill e instrucciones para agentes
scripts/            Smoke test, bootstrap y guardado en GitHub
```

## Scripts importantes

```bash
npm run dev              # desarrollo local Astro
npm run build            # build SSR
npm run preview          # preview del build
npm run smoke            # validación rápida de estructura
npm run check            # astro check + lint ligero
npm run seed:sql         # imprime orden recomendado de seed
npm run codex:bootstrap  # bootstrap pensado para Codex
npm run git:save -- "msg" # commit + push a GitHub
```

## Rutas API incluidas

- `GET /api/appointments` lista citas.
- `POST /api/appointments` crea cita validada con Zod.
- `GET /api/treatments` lista tratamientos por clínica.
- `GET /api/dentists` lista odontólogos por clínica.
- `GET /api/locations` lista clínicas/sedes por clínica SaaS.
- `GET /api/availability` devuelve slots disponibles con fallback demo.
- `PATCH /api/appointments` reprograma/cancela citas del paciente o actualiza estados desde admin.
- `GET /api/admin/metrics` métricas cacheadas, protegidas por rol admin.
- `GET /api/admin/modules` módulos admin, logs, permisos e integraciones demo, protegidos por rol admin.
- `GET /api/patients` lista pacientes según rol.
- `GET /api/cache/health` estado de cache.
- `POST /api/reminders/send` mock de envío WhatsApp/email/SMS protegido por rol admin.
- `POST /api/notifications/appointment` procesa confirmación de cita, enlace de activación y envío por WhatsApp/correo/SMS con fallback demo.

## Funcionalidades incluidas

### Portal paciente

- Panel de paciente separado de la landing pública.
- Directorio público con 58 clínicas demo, fotos reales de clínica, filtro por ciudad, buscador funcional y detalle de sede para entrar a reservar con la clínica ya seleccionada.
- Reserva funcional por clínica, tratamiento, dentista, calendario, hora y gabinete.
- Horarios por minutos según intervalo configurado por administración.
- Validaciones en español, prevención de duplicados y notificaciones toast.
- Confirmaciones demo por correo electrónico, SMS y WhatsApp según preferencia del paciente.
- Integración preparada con WhatsApp Cloud API de Meta y correo vía Resend usando `.env`; si faltan claves se usa modo mock.
- El paciente recibe un enlace `/activar` para habilitar su cuenta demo y entrar a `Mis citas`.
- Persistencia de citas, perfil, mensajes, informes, documentos, facturas y pagos demo en `localStorage`, filtrados por `patientId`.
- Rutas `/paciente/informes`, `/paciente/documentos`, `/paciente/facturas` y `/paciente/pagos`.
- Gestión de próximas citas con detalle, filtros, reprogramación y cancelación.
- Historial con opción para reservar un tratamiento similar.
- Perfil editable con datos ficticios, alergias, medicación y preferencias de recordatorio.
- Pagos/facturas demo con recibo descargable y estados pendientes/completados.
- Bandeja de mensajes demo con marcado como leído.
- Recordatorios normativos y operativos visibles para el paciente.
- Mobile-first y responsive 100%.

### Panel admin

- Panel administrativo separado y protegido por rol demo `admin`.
- Agenda con vista día, semana y mes, filtros por clínica/dentista/gabinete, bloqueo de horarios y huecos disponibles.
- Gestión de citas con tabla responsive, buscador, filtros, crear/editar, confirmar, completar, cancelar, no asistió y exportación CSV demo.
- Gestión de pacientes con creación, edición, ficha (`/admin/pacientes/PAT-XXXX`), historial y alertas administrativas.
- Informes, documentos, facturas y pagos vinculados por paciente (`/admin/informes`, `/admin/documentos`, `/admin/facturas`, `/admin/pagos`).
- Dashboard con actividad reciente vinculada a pacientes (IDs visibles).
- Gestión de dentistas con especialidad, horario, clínica asignada, estado y agenda.
- Gestión de tratamientos con precio demo, duración, creación, edición y activación/desactivación.
- Gestión de clínicas, gabinetes, horarios, teléfonos y disponibilidad.
- Configuración del intervalo del calendario: 5, 10, 15, 20, 30 o 60 minutos.
- Pagos y facturación demo con métricas, marcado como pagado y exportación CSV.
- Reportes de citas, tratamientos, ocupación, cancelaciones, ingresos demo y pacientes nuevos.
- Normativa editable en modo demo: cancelación, reprogramación, consentimiento, protección de datos, recordatorios, urgencias y no presentación.
- Configuración general persistida en `localStorage`.

### PWA

- Manifest web en `public/manifest.webmanifest`.
- Service worker básico en `public/sw.js`.
- Iconos SVG para instalación en móvil/escritorio.

## Verificación local

```bash
npm run smoke
npm run lint:light
npm run build
```

Para pruebas manuales, levanta `npm run dev` y visita `/`, `/login`, `/paciente`, `/paciente/reservar`, `/paciente/citas`, `/admin`, `/admin/agenda`, `/admin/citas`, `/admin/normativa` y `/api/cache/health`.

## Seguridad

- Supabase RLS en migraciones.
- Validación server-side con Zod.
- Cache con fallback de memoria para desarrollo.
- Arquitectura multi-clínica con `clinic_id`.
- No hay secretos en el repositorio.

## Trabajo sugerido en Codex

Lee primero `CODEX_START_HERE.md`, `AGENTS.md`, `docs/PROMPT.md`, `docs/MCP.md` y `.codex/skills/dentalflow/SKILL.md`. Después pide a Codex:

> Implementa persistencia real Supabase en todos los endpoints, completa auth por roles y añade tests e2e para el flujo de reserva. Después ejecuta `npm run smoke` y sube los cambios a GitHub.

