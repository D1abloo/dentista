-- Columna opcional para bloqueos multi-profesional (0026); idempotente en entornos sin aplicar 0026.

alter table public.schedule_blocks
  add column if not exists dentist_ids uuid[] default null;

comment on column public.schedule_blocks.dentist_ids is
  'Lista de dentistas afectados cuando el bloqueo no es global.';
