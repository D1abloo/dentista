# n8n — Automatización de citas

Integración de **n8n** como orquestador conversacional. El backend AgendaClinic sigue siendo la **fuente de verdad** para disponibilidad, permisos, conflictos y persistencia.

## Arquitectura

```
Usuario → App (portal / panel / asistente)
       → POST /api/appointments/intent
       → Webhook n8n POST /webhook/appointments
       → n8n detecta intención + confirma si aplica
       → API backend (Bearer N8N_SERVICE_TOKEN + cabeceras actor)
       → Supabase + auditoría
       → Respuesta natural al usuario
```

**n8n NO** confirma ni cancela citas sin pasar por el backend con `confirm: true`.

## Variables de entorno (servidor)

```bash
# URL pública del webhook n8n (producción o tunnel en dev)
N8N_APPOINTMENTS_WEBHOOK_URL="https://n8n.tu-dominio.com/webhook/appointments"

# Secreto app → n8n (cabecera x-n8n-webhook-token)
N8N_WEBHOOK_SECRET="genera-un-secreto-largo"

# Token n8n → backend (Authorization: Bearer)
N8N_SERVICE_TOKEN="genera-otro-secreto-largo"
```

En n8n (variables de entorno del contenedor/host):

```bash
APP_BASE_URL="https://tu-app.vercel.app"
N8N_SERVICE_TOKEN="mismo-valor-que-en-la-app"
```

## Workflow

Importar `n8n/workflows/appointment-automation.json` en n8n con nombre **Appointment Automation**.

Webhook: `POST /webhook/appointments`

Payload:

```json
{
  "userId": "uuid-perfil",
  "companyId": "uuid-clinica",
  "message": "Quiero una cita mañana a las 10",
  "channel": "assistant",
  "timezone": "Europe/Madrid",
  "metadata": {
    "verificationToken": "opcional-asistente-publico",
    "confirmation": false
  }
}
```

## Endpoints backend (para n8n)

| Método | Ruta | Uso |
|--------|------|-----|
| POST | `/api/appointments/intent` | Entrada desde la app |
| GET | `/api/appointments/availability` | Disponibilidad real |
| POST | `/api/appointments` | Crear (requiere `confirm: true`) |
| GET | `/api/appointments` | Listar citas con permisos |
| GET | `/api/appointments/{id}` | Detalle |
| POST | `/api/appointments/{id}/cancel` | Cancelar (`confirm: true`) |
| POST | `/api/appointments/{id}/reschedule` | Reprogramar (`confirm: true`) |
| POST | `/api/appointments/audit-log` | Auditoría del workflow |

### Autenticación n8n → backend

```
Authorization: Bearer <N8N_SERVICE_TOKEN>
x-automation-user-id: <profileId>
x-automation-company-id: <clinicId>
x-automation-channel: assistant|portal|panel|whatsapp|email
```

## Intenciones

- `check_availability`
- `create_appointment`
- `get_appointments`
- `cancel_appointment`
- `reschedule_appointment`

## Permisos

- **Paciente**: solo sus citas (`patientId` = perfil).
- **Dentista/agente**: citas de su `dentistId` o clínica según `agendaScope`.
- **Admin clínica**: toda la clínica (`companyId`).
- **Aislamiento**: ningún actor accede a otra `companyId`.

## Reglas de negocio (backend)

- Validación de hueco libre antes de crear/reprogramar.
- Comprobación de solapes en BD (anti doble reserva).
- No cancelar citas completadas ni ajenas.
- Zona horaria por defecto: `Europe/Madrid`.
- Auditoría en `audit_logs` (`module: n8n_automation`).

## Automatizaciones adicionales en n8n

Añadir nodos después de crear/cancelar:

- Email confirmación (`/api/notifications/appointment`)
- Recordatorio programado (Cron + GET citas próximas)
- Aviso cancelación a staff
- Calendario externo (Google Calendar node)
- Error workflow → POST audit-log `level: error` + email admin

## Fallback

Si n8n no responde:

- `/api/appointments/intent` → HTTP 502
- `/api/ai/appointments-chat` → fallback a Gemini directo (`handleAppointmentsChat`)

## Pruebas

```bash
npm run check
npm run smoke
node --test scripts/unit/n8n-appointments.mjs
```

Casos manuales: disponibilidad libre/ocupada, doble reserva, cancelación propia/ajena, roles paciente/admin/dentista, fallo n8n (apagar webhook).
