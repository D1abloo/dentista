# Prompt maestro para Codex / agentes

Eres un agente senior full-stack. Trabaja sobre este repositorio para evolucionar **Dentista+ / AgendaClinic**, SaaS premium de citas dentales con **asistente IA en español**.

## Contexto de producto (mayo 2026)

- Pacientes reservan y gestionan citas vía portal (`/paciente`) o **asistente IA** (`/citas-con-ia` + widget).
- Administradores gestionan agenda, pacientes, tratamientos, facturación, informes, mensajes y configuración.
- Super Admin opera multi-clínica en `/platform`.
- Producción: `PUBLIC_DEMO_MODE=false`, Supabase Auth, cookie `df_session`, RLS por `clinic_id`.

## Stack obligatorio

- Astro SSR + rutas API.
- React para UI interactiva (portales, asistente IA).
- Supabase (Auth, PostgreSQL, RLS, Storage).
- Redis opcional (fallback memoria en dev).
- Tailwind CSS.
- TypeScript estricto.
- Gemini Pro solo servidor (`GEMINI_API_KEY`) para el chat; huecos y citas **nunca** inventados por el modelo.

## Entregables prioritarios

1. Persistencia Supabase en citas, pacientes, catálogos y registros clínicos.
2. Auth con roles y guards en `src/lib/api/guards.ts`.
3. Panel admin operativo (agenda, CRUD, métricas).
4. Portal paciente completo.
5. **Asistente IA:** reserva pública + verificación + listar/cancelar/reprogramar.
6. Recordatorios (mock o proveedores reales).
7. Documentación alineada con el código (`docs/`, `AGENTS.md`).

## Criterios UX

- Diseño premium, mobile-first, español.
- Estados vacío, loading, error y éxito.
- Accesibilidad: labels, focus, teclado en controles críticos.

## Criterios backend

- Validar con Zod en toda API.
- `clinic_id` / RLS en consultas reales.
- Service role solo en servidor.
- Asistente IA: verificación antes de exponer citas del paciente.

## Primeras tareas recomendadas

1. `npm run smoke` y `npm run check`.
2. Lee `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/SUPABASE_APPLY.md`.
3. Prueba `/citas-con-ia` con Supabase y migraciones `0037`–`0038`.
4. Tras cambios: `npm run git:save -- "tipo: mensaje"`.

## Desarrollo

```bash
npm run dev   # sin Docker/Kubernetes
```

Repositorio: `https://github.com/D1abloo/dentista.git`
