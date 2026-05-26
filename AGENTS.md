# AGENTS.md — Instrucciones para Codex

## Objetivo del repositorio

Construir DentalFlow/Dentista, una app SaaS premium para gestión de citas dentales. Debe ser responsive 100%, operar en modo producción (Supabase, sesión real, persistencia de cada acción) y escalar con Astro, React, Supabase y Redis cache opcional.

## Regla operativa obligatoria

- El entorno de desarrollo usa **npm**.
- Comando principal: `npm run dev`.
- No usar Docker.
- No usar Kubernetes.
- No introducir `docker-compose.yml`, `Dockerfile`, manifiestos K8s ni dependencias de contenedores para el flujo dev.
- Cada cambio relevante debe terminar con commit y push al repositorio `https://github.com/D1abloo/dentista.git`.

## Reglas de trabajo

1. Mantén TypeScript estricto.
2. Modo demo desactivado: no usar `localStorage` ni semillas ficticias como fuente de verdad; datos y acciones vía Supabase y APIs autenticadas.
3. Toda ruta API debe validar entrada con Zod.
4. Toda consulta real a Supabase debe respetar `clinic_id` y políticas RLS.
5. No hardcodees secretos; usa `.env`.
6. Mantén UX premium: cards redondeadas, estados visibles, responsive mobile-first.
7. Antes de terminar una tarea, ejecuta o deja preparado:
  - `npm run smoke`
  - `npm run check`
  - pruebas manuales de `/`, `/paciente`, `/reserva`, `/admin`
8. Después de validar, sube cambios:
  - `npm run git:save -- "tipo: mensaje claro"`
9. Si agregas tablas, actualiza `supabase/migrations`, `docs/ARCHITECTURE.md` y tipos de dominio.
10. Si agregas MCP o integraciones, documenta configuración en `docs/MCP.md`.
11. Para cambios grandes, divide en commits lógicos: schema, API, UI, tests, docs.

## Arquitectura esperada

- Astro SSR para páginas y endpoints.
- React para dashboards y componentes dinámicos.
- Supabase Auth + PostgreSQL + RLS + Storage.
- Redis cache opcional para métricas, disponibilidad y queries frecuentes.
- Fallback de cache en memoria para desarrollo sin Redis.
- Provider de notificaciones intercambiable: mock, WhatsApp, email, SMS.

## Definición de terminado

- La app compila o queda el motivo exacto documentado.
- Las páginas principales son responsive.
- Los endpoints devuelven JSON consistente.
- No hay secretos en el repo.
- La documentación refleja lo implementado.
- Los errores del usuario se muestran con mensajes accionables.
- El cambio está commiteado y subido a GitHub cuando hay credenciales disponibles.
- Cada cambio que realices debe quedar commiteado y subido a GitHub.

