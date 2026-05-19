# Skill: DentalFlow Full-Stack Builder

## Cuándo usar esta skill

Usa esta skill para cualquier tarea relacionada con la app DentalFlow: reserva de citas, panel admin, Supabase, Redis, UI dental premium, notificaciones, roles, auditoría o despliegue.

## Flujo recomendado

1. Lee `AGENTS.md`.
2. Lee `docs/PROMPT.md`.
3. Revisa `docs/ARCHITECTURE.md`.
4. Ejecuta `npm run smoke`.
5. Identifica si el cambio afecta frontend, API, schema o docs.
6. Implementa en pasos pequeños.
7. Actualiza docs y migraciones si corresponde.

## Estándares de UI

- UI en español.
- Diseño premium dental: azul, blanco, turquesa, sombras suaves.
- Componentes responsive.
- Las tablas deben tener filtros o buscador cuando superen 10 filas.
- Las acciones críticas deben tener confirmación visual.

## Estándares backend

- Valida inputs con Zod.
- Usa helpers de `src/lib/cache.ts` para métricas cacheadas.
- Mantén fallback demo.
- No exponer service role al cliente.
- Diseña multi-tenant con `clinic_id`.

## Tests mínimos por cambio

- Smoke de estructura.
- Render manual de páginas clave.
- API endpoint con payload válido e inválido.
- Revisión responsive mobile/desktop.

## Prompts rápidos

### Completar un endpoint

> Implementa el endpoint real de [nombre] usando Supabase. Mantén fallback demo, validación Zod, manejo de errores y actualización de docs.

### Añadir una pantalla admin

> Crea pantalla admin premium para [módulo], con tabla, filtros, estados vacíos, acciones CRUD preparadas y datos demo conectados a API.

### Revisar seguridad

> Audita esta feature contra RLS, secrets, validación, multi-tenant, cache y exposición accidental de datos clínicos.
