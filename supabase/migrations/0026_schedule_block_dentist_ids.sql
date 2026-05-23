-- Varios profesionales por bloqueo (además de applies_to_all_professionals)

alter table public.schedule_blocks
  add column if not exists dentist_ids uuid[] default null;

comment on column public.schedule_blocks.dentist_ids is
  'Lista de dentistas afectados cuando el bloqueo no es global.';
