# n8n — Automatización de citas

Integración de **n8n** como orquestador conversacional. El backend AgendaClinic sigue siendo la **fuente de verdad**.

## Workflows (importar los 3)

| Archivo | Nombre | Función |
|---------|--------|---------|
| `n8n/workflows/appointment-automation.json` | **Appointment Automation** | Webhook principal + confirmaciones + notificaciones |
| `n8n/workflows/appointment-reminders-cron.json` | **Appointment Reminders Cron** | Recordatorios 24h antes (cada hora) |
| `n8n/workflows/appointment-error-handler.json` | **Appointment Error Handler** | Alertas admin + auditoría de errores |

Orden recomendado: importar **Error Handler** primero, luego **Automation** y **Reminders Cron** (referencian el error workflow).

## Variables de entorno

### App (servidor)

```bash
N8N_APPOINTMENTS_WEBHOOK_URL="https://n8n.tu-dominio.com/webhook/appointments"
N8N_WEBHOOK_SECRET="secreto-app-a-n8n"
N8N_SERVICE_TOKEN="secreto-n8n-a-backend"
N8N_ADMIN_EMAIL="admin@tu-clinica.com"   # alertas de fallo
```

### n8n

```bash
APP_BASE_URL="https://tu-app.vercel.app"
N8N_SERVICE_TOKEN="mismo-valor-que-en-la-app"
N8N_WEBHOOK_SECRET="mismo-valor-que-en-la-app"
```

### Google Calendar (opcional en n8n)

El workflow **Appointment Automation** ya incluye:

1. **Calendar Payload** — obtiene `summary`, `start`, `end`, `location` del backend.
2. **Calendar Enabled?** — solo crea evento si `GOOGLE_CALENDAR_ENABLED=true`.
3. **Google Calendar Create** — nodo OAuth2 (configurar credencial en n8n).
4. **Audit Calendar** — registra `calendar.event_created` en auditoría.

Variables en n8n:

```bash
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=primary   # o ID de calendario de la clínica
```

Pasos en n8n:

1. Importa `appointment-automation.json`.
2. Abre **Google Calendar Create** → credenciales → **Create New** → Google OAuth2.
3. Autoriza la cuenta de la clínica.
4. Activa el workflow y prueba una cita confirmada.

## Endpoints citas (n8n → backend)

| Método | Ruta |
|--------|------|
| POST | `/api/appointments/intent` |
| GET | `/api/appointments/availability` |
| POST | `/api/appointments` (`confirm: true`) |
| GET | `/api/appointments` |
| GET | `/api/appointments/{id}` |
| POST | `/api/appointments/{id}/cancel` |
| POST | `/api/appointments/{id}/reschedule` |
| POST | `/api/appointments/audit-log` |

## Endpoints notificaciones y cron (n8n → backend)

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/n8n/notify/created` | Email paciente + aviso staff + payload calendario |
| POST | `/api/n8n/notify/cancelled` | Email cancelación + staff |
| POST | `/api/n8n/notify/staff` | Aviso profesional/grupo |
| POST | `/api/n8n/notify/admin-alert` | Email admin si falla workflow |
| GET | `/api/n8n/reminders/due?hoursBefore=24` | Citas con recordatorio pendiente |
| POST | `/api/n8n/reminders/send` | Enviar recordatorios por IDs |
| POST | `/api/n8n/calendar/event` | Payload para Google Calendar |

Todos requieren `Authorization: Bearer N8N_SERVICE_TOKEN`.

## Flujo principal

1. Usuario escribe en asistente/portal/panel.
2. App → `POST /api/appointments/intent` → webhook n8n.
3. n8n detecta intención (vía backend Gemini).
4. Si falta datos → pregunta solo lo necesario.
5. Si requiere acción destructiva → `needsConfirmation: true`.
6. Tras confirmar → backend crea/cancela/reprograma con validación real.
7. n8n dispara notificaciones (email, staff, calendario).
8. Auditoría en `audit_logs`.

## Intenciones

- `check_availability`
- `create_appointment`
- `get_appointments`
- `cancel_appointment`
- `reschedule_appointment`

## Recordatorios automáticos

El workflow **Appointment Reminders Cron**:

- Se ejecuta cada hora.
- Consulta citas en ventana ±1h respecto a `hoursBefore=24`.
- Envía email al paciente.
- Registra auditoría.

Ajusta `hoursBefore` en el nodo HTTP o duplica el workflow para 2h / 48h.

## Manejo de errores

- `settings.errorWorkflow` apunta a **Appointment Error Handler**.
- Envía email a `N8N_ADMIN_EMAIL`.
- Registra `n8n.workflow.error` en auditoría.
- La app sigue operativa (fallback Gemini si n8n cae en chat).

## Seguridad

- Token de servicio en todas las llamadas n8n → API.
- Cabeceras `x-automation-user-id` + `x-automation-company-id` para permisos.
- Sin secretos en frontend.
- Aislamiento multi-clínica en backend.

## Pruebas

### Automáticas (local)

```bash
npm run check
npm run smoke
npm run test:unit
npm run test:n8n
```

`test:n8n` valida la estructura del workflow (incl. Google Calendar) sin servidor.

**Con servidor en marcha** (`npm run dev` en otra terminal) y `N8N_SERVICE_TOKEN` en `.env`:

```bash
npm run test:n8n -- --live
```

Comprueba: 403 sin token, 422 en payloads inválidos, rutas n8n protegidas.

### Manual — backend (curl)

Sustituye `TOKEN` y `BASE` (ej. `http://127.0.0.1:4321` o tu URL Vercel).

```bash
# Sin token → 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE/api/n8n/notify/created" \
  -H "content-type: application/json" \
  -d '{"clinicId":"...","appointmentId":"..."}'

# Con token — payload calendario (cita real en BD)
curl -s -X POST "$BASE/api/n8n/calendar/event" \
  -H "Authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d '{"clinicId":"UUID_CLINICA","appointmentId":"UUID_CITA"}'

# Recordatorios pendientes (24h)
curl -s "$BASE/api/n8n/reminders/due?hoursBefore=24&clinicId=UUID_CLINICA" \
  -H "Authorization: Bearer TOKEN"
```

### Manual — n8n

1. Importa los 3 workflows y configura `APP_BASE_URL`, `N8N_SERVICE_TOKEN`, `N8N_WEBHOOK_SECRET`.
2. Activa **Appointment Automation** y copia la URL del webhook.
3. En la app, define `N8N_APPOINTMENTS_WEBHOOK_URL` con esa URL.
4. **Disponibilidad:** chat en `/citas-con-ia` → “¿hay hueco el martes?”.
5. **Crear cita:** confirma cuando pida `needsConfirmation` → revisa email staff y evento en Google Calendar (si está activo).
6. **Cancelar:** pide cancelar una cita verificada → revisa **Notify Cancelled**.
7. **Cron:** ejecuta manualmente **Appointment Reminders Cron** en n8n → comprueba emails.
8. **Error:** desactiva `APP_BASE_URL` incorrecto → debe disparar **Appointment Error Handler** y email a `N8N_ADMIN_EMAIL`.
9. **Fallback:** quita `N8N_APPOINTMENTS_WEBHOOK_URL` en la app → el chat sigue con Gemini directo.

### Manual — Google Calendar

1. `GOOGLE_CALENDAR_ENABLED=true` en n8n.
2. Credencial OAuth en el nodo **Google Calendar Create**.
3. Tras crear cita confirmada, revisa el calendario y el log **Audit Calendar** en ejecuciones n8n.
