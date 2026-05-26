# Skill: DentalFlow / AgendaClinic Full-Stack Builder

## Cuándo usar esta skill

Usa esta skill para cualquier tarea de Dentista+ / AgendaClinic: reserva de citas, **asistente IA** (`/citas-con-ia`), panel admin, Supabase, Redis, UI dental premium, notificaciones, roles, auditoría o despliegue.

## Flujo recomendado

1. Lee `AGENTS.md`.
2. Lee `docs/README.md` y `docs/ARCHITECTURE.md`.
3. Ejecuta `npm run smoke`.
4. Identifica si el cambio afecta frontend, API, schema o docs.
5. Implementa en pasos pequeños.
6. Actualiza docs y migraciones si corresponde.
7. Valida con `npm run check` y `npm run git:save`.

## Asistente IA (reglas críticas)

- Endpoint principal: `POST /api/ai/appointments-chat`.
- `GEMINI_API_KEY` solo servidor; sin clave → fallback de intención, **no** inventar huecos ni citas.
- Huecos: `publicAiBooking` / `POST /api/public-booking/*`.
- Citas del paciente: verificación obligatoria (`patient-appointments/*`, migración `0038`).
- UI: `src/components/public/ai-booking/`, widget `AiAppointmentsWidget.tsx`.

## Estándares de UI

- UI en español.
- Diseño premium dental: azul, blanco, turquesa, sombras suaves.
- Componentes responsive; mobile-first.
- Tablas con filtros o buscador si superan 10 filas.
- Acciones críticas con confirmación visual.

## Estándares backend

- Valida inputs con Zod.
- Usa `src/lib/cache.ts` para métricas cacheadas.
- Producción: `PUBLIC_DEMO_MODE=false`, sin `localStorage` como fuente de verdad.
- No exponer service role al cliente.
- Multi-tenant con `clinic_id` y RLS.

## Tests mínimos por cambio

- `npm run smoke` y `npm run check`.
- Render manual: `/`, `/citas-con-ia`, `/paciente`, `/admin`.
- API con payload válido e inválido.
- Revisión responsive mobile/desktop.

## Prompts rápidos

### Completar un endpoint

> Implementa el endpoint real de [nombre] usando Supabase. Validación Zod, guards por clínica, manejo de errores y actualización de `docs/ARCHITECTURE.md`.

### Asistente IA

> Extiende el flujo en `appointmentsChatHandler` sin inventar datos. Huecos y citas solo desde servicios existentes. Actualiza UI en `ai-booking/` si cambia el flujo.

### Revisar seguridad

> Audita contra RLS, verificación paciente IA, secrets, multi-tenant y exposición de datos clínicos.
