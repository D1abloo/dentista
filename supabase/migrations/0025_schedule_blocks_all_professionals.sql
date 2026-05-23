-- Bloqueos globales (todos los profesionales) y notas opcionales

alter table public.schedule_blocks
  add column if not exists applies_to_all_professionals boolean not null default false;

alter table public.schedule_blocks
  add column if not exists notes text;

comment on column public.schedule_blocks.applies_to_all_professionals is
  'Si true, el bloqueo afecta a todos los dentistas de la clínica en el tramo indicado.';
