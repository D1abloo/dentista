-- Agrupar bloqueos multi-día / multi-profesional creados en un mismo acto

alter table public.schedule_blocks
  add column if not exists block_group_id text;

create index if not exists idx_schedule_blocks_group
  on public.schedule_blocks (clinic_id, block_group_id)
  where block_group_id is not null;

comment on column public.schedule_blocks.block_group_id is
  'Identificador compartido para eliminar o listar bloqueos creados juntos desde la agenda.';
