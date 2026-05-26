# CODEX_START_HERE

## Qué hacer primero

```bash
cp .env.example .env
npm install
npm run smoke
npm run dev
```

## Rutas a verificar

### Público y asistente IA

- `/` — landing AgendaClinic
- `/citas-con-ia` — asistente IA (reserva + mis citas + cambiar + ayuda)
- Widget «Citas con IA» (esquina inferior derecha en páginas públicas)

### Auth y paneles

- `/login/admin`, `/admin`, `/admin/agenda`
- `/login/paciente`, `/paciente`, `/paciente/citas`
- `/platform/login`, `/platform`

### APIs de muestra

- `/api/auth/me`
- `/api/cache/health`
- `POST /api/ai/appointments-chat` (con Supabase + opcional Gemini)

## Restricciones del proyecto

- Desarrollo: `npm run dev` — **sin Docker/Kubernetes**.
- Producción: `PUBLIC_DEMO_MODE=false`, Supabase real, cookie `df_session`.
- Redis opcional (fallback en memoria).
- Toda API: validación **Zod**, respuesta `{ data, error, meta }`.
- **Gemini:** clave solo en servidor; no inventar disponibilidad ni citas.
- Citas de paciente en IA: **verificación obligatoria** antes de listar.
- Multi-tenant: siempre filtrar por `clinic_id` / RLS.

## Documentación clave

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Reglas obligatorias agente |
| `docs/README.md` | Índice de docs |
| `docs/ARCHITECTURE.md` | Capas y APIs |
| `docs/SUPABASE_APPLY.md` | Migraciones hasta `0038` |
| `docs/MCP.md` | MCP + Gemini |

## Verificación LIVE

```bash
npm run check
npm run qa:db-security
npm run qa:live
```

## GitHub

```bash
npm run git:save -- "tipo: mensaje claro"
```

Remoto: `https://github.com/D1abloo/dentista.git`
