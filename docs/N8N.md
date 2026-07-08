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

1. Tras **Calendar Payload**, añade nodo **Google Calendar → Create Event**.
2. Mapea `summary`, `start.dateTime`, `end.dateTime`, `location` del payload.
3. Credenciales OAuth en n8n (no en el repo).

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

```bash
npm run check
npm run smoke
npm run test:unit
```

Manual: crear cita → email confirmación; cancelar → aviso staff; cron recordatorios; desactivar n8n → fallback chat.
