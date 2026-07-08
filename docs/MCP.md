# MCP.md — Guía de Model Context Protocol para DentalFlow

Este documento define cómo conectar herramientas externas al agente de desarrollo sin introducir secretos en el repositorio.

## Objetivo

Permitir que Codex u otros agentes puedan consultar documentación, Supabase, GitHub, logs y/o entornos locales con permisos controlados.

## Servidores MCP recomendados

### 1. Filesystem del proyecto

Permisos: lectura/escritura dentro del workspace del repo.

Uso:

- Leer `AGENTS.md`.
- Editar componentes Astro/React.
- Actualizar migraciones SQL.
- Ejecutar scripts de validación.

### 2. Supabase MCP

Permisos recomendados:

- Desarrollo: lectura de schema, ejecución de migraciones en proyecto dev.
- Producción: solo lectura, salvo operaciones aprobadas.

Variables requeridas fuera del repo:

```bash
SUPABASE_ACCESS_TOKEN="..."
SUPABASE_PROJECT_REF="..."
SUPABASE_DB_PASSWORD="..."
```

Tareas útiles:

- Inspeccionar schema.
- Aplicar migraciones.
- Revisar políticas RLS.
- Depurar datos de demo.

### 3. GitHub MCP

Permisos:

- Issues y pull requests.
- Lectura/escritura de ramas de feature.
- Nunca escribir directamente en `main` sin revisión.

Tareas útiles:

- Crear issues por módulos.
- Abrir PRs por feature.
- Leer errores de CI.

### 4. Browser / documentación

Uso:

- Validar documentación actual de Astro, Supabase, Redis y proveedores de notificación.
- Comprobar breaking changes antes de actualizar dependencias.

## Ejemplo conceptual de configuración MCP

No copies este bloque sin adaptar los nombres de servidores a tu cliente MCP:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
        "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}"
      }
    }
  }
}
```

## Gemini Pro (asistente de citas)

Variables (solo servidor):

```bash
GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-1.5-pro"
```

Endpoint principal: `POST /api/ai/appointments-chat` (`POST /api/ai/booking-chat` es alias legacy). La clave nunca debe exponerse al cliente. Sin `GEMINI_API_KEY`, el servidor usa clasificación local de intención; huecos y citas siempre salen de Supabase.

Con n8n configurado (`N8N_APPOINTMENTS_WEBHOOK_URL`), el asistente puede delegar el flujo conversacional al workflow **Appointment Automation**; ver `docs/N8N.md`.

## Política de secretos

- Nunca commitear `.env`.
- Nunca pegar service role keys en issues/prompts.
- Las credenciales deben vivir en el gestor secreto del entorno.
- En local, usar `.env` ignorado por Git.

## Prompt de arranque MCP

> Lee AGENTS.md, docs/PROMPT.md y docs/ARCHITECTURE.md. Verifica el proyecto con `npm run smoke`. Si tienes acceso a Supabase MCP, inspecciona el schema actual y compara con `supabase/migrations`. Propón una lista de tareas pequeñas y ejecuta la primera sin romper modo demo.
