# Matriz funcional — Mayo 2026

| Módulo | Paciente | Admin | Público | Estado |
|--------|:--------:|:-----:|:-------:|--------|
| Login / Auth (LIVE) | Sí | Sí | — | Supabase + `df_session` |
| Dashboard | Sí | Sí | — | LIVE + bootstrap |
| Reserva de citas (portal) | Sí | Gestión | Sí (`/reserva`) | API + UI |
| **Asistente IA citas** | Sí* | — | **Sí** | Gemini + verificación + huecos reales |
| Reprogramación / cancelación (portal) | Sí | Sí | Sí (IA verificado) | API + política horaria |
| Tratamientos | Consulta | CRUD | Catálogo IA | Supabase |
| Dentistas / profesionales | Consulta | CRUD | Catálogo IA | Supabase |
| Agenda / bloqueos | — | Sí | — | UI + `schedule_blocks` |
| Disponibilidad | Consulta | Gestión | IA reserva | API real |
| Informes clínicos | Sí (visor) | CRUD | — | RLS + PDF |
| Documentos | Sí | CRUD | — | Visibilidad paciente |
| Facturas / pagos | Sí | Sí | — | Billing |
| Mensajes | Sí | Sí | — | Bidireccional (`0033`) |
| Recordatorios | Consulta | Envío | — | Mock / cola |
| Reportes / métricas | — | Sí | — | Cache opcional |
| Super Admin plataforma | — | — | — | `/platform` |
| Registro clínicas | — | — | Sí | Aprobación manual |
| Auditoría / monitorización | — | Sí | — | `0030`/`0031` |
| SEO técnico | — | — | Sí | Sitemap, meta, FAQ schema |
| Redis cache | — | Métricas | — | Fallback memoria |

\* Gestión de citas vía asistente IA requiere **verificación** (sesión paciente o email+teléfono); no expone datos sin identificar.

## Asistente IA — criterios de aceptación

- [x] Reserva nueva con huecos solo del backend
- [x] Consulta de citas propias tras verificación
- [x] Próxima cita, listado, cancelar, reprogramar (con política online)
- [x] Gemini solo servidor (`GEMINI_API_KEY`)
- [x] Widget + página `/citas-con-ia`
- [x] UI español, responsive, progreso visible
- [x] `source = public_ai_assistant` en citas creadas por IA

## Modo demo vs LIVE

| | `PUBLIC_DEMO_MODE=true` | `PUBLIC_DEMO_MODE=false` |
|--|-------------------------|---------------------------|
| Uso | Solo dev local | Producción |
| Datos | `localStorage` / semillas | Supabase |
| Asistente IA | Requiere Supabase para huecos reales | Completo |
