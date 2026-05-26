# Documentación Dentista+ / AgendaClinic

Índice actualizado a **mayo 2026**. El código vive en `https://github.com/D1abloo/dentista.git`.

## Empezar aquí

| Documento | Para quién |
|-----------|------------|
| [../README.md](../README.md) | Visión general, stack, inicio rápido |
| [../AGENTS.md](../AGENTS.md) | Agentes IA (Codex, Cursor): reglas obligatorias |
| [../CODEX_START_HERE.md](../CODEX_START_HERE.md) | Checklist Codex |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Desarrollo local con npm |
| [PRODUCTION.md](PRODUCTION.md) | Despliegue LIVE (`PUBLIC_DEMO_MODE=false`) |

## Arquitectura y producto

| Documento | Contenido |
|-----------|-----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Capas, auth, multi-tenant, APIs |
| [FRONTEND.md](FRONTEND.md) | Sitio público, portales, asistente IA |
| [FEATURE_MATRIX.md](FEATURE_MATRIX.md) | Módulos por rol y estado |
| [MULTI_TENANT.md](MULTI_TENANT.md) | Aislamiento por clínica |
| [ROLES.md](ROLES.md) | Permisos por rol |

## Base de datos y seguridad

| Documento | Contenido |
|-----------|-----------|
| [SUPABASE_APPLY.md](SUPABASE_APPLY.md) | Orden de migraciones (`0001`–`0038`) |
| [SECURITY.md](SECURITY.md) | RLS, sesiones, verificación paciente IA |
| [QA_E2E_MATRIX.md](QA_E2E_MATRIX.md) | Matriz QA y scripts |
| [QA_USUARIOS_PRUEBA.md](QA_USUARIOS_PRUEBA.md) | Credenciales de prueba |

## Despliegue e integraciones

| Documento | Contenido |
|-----------|-----------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel y despliegue general |
| [DEPLOY_VPS_LINUX.md](DEPLOY_VPS_LINUX.md) | VPS + nginx + HTTPS |
| [VERCEL_ENV.md](VERCEL_ENV.md) | Variables en Vercel (incl. `GEMINI_API_KEY`) |
| [MCP.md](MCP.md) | MCP + Gemini Pro |
| [EMAIL.md](EMAIL.md) | SMTP / Resend |
| [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) | Flujo git |

## Rutas públicas clave (2026)

| Ruta | Descripción |
|------|-------------|
| `/` | Landing AgendaClinic / Dentista+ |
| `/citas-con-ia` | Asistente IA: reservar, ver, cambiar y cancelar citas |
| `/reservar-con-ia` | Redirección 301 → `/citas-con-ia` |
| `/reserva` | Reserva pública clásica |
| `/login/admin`, `/login/paciente`, `/platform/login` | Accesos autenticados |
| `/admin/*`, `/paciente/*`, `/platform/*` | Paneles |

## Asistente de citas con IA

- **UI:** widget flotante «Citas con IA» + página `/citas-con-ia`
- **Backend:** `POST /api/ai/appointments-chat` (Gemini Pro solo servidor)
- **Gestión citas existentes:** verificación obligatoria (`/api/patient-appointments/*`)
- **Reserva nueva:** huecos reales vía `/api/public-booking/*`
- **Migración:** `0038_patient_verification_ai_appointments.sql`

## Comandos de validación

```bash
npm run dev
npm run smoke
npm run check
npm run qa:db-security
npm run qa:live
npm run git:save -- "docs: actualizar documentación"
```
