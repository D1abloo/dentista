-- Bloqueos de agenda (comida, mantenimiento, etc.) por clínica y dentista

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  dentist_id uuid not null references public.dentists(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (char_length(trim(reason)) > 0)
);

create index if not exists idx_schedule_blocks_clinic_starts
  on public.schedule_blocks (clinic_id, starts_at);

alter table public.schedule_blocks enable row level security;

drop policy if exists schedule_blocks_staff on public.schedule_blocks;
create policy schedule_blocks_staff on public.schedule_blocks
  for all
  using (clinic_id = public.current_profile_clinic_id())
  with check (clinic_id = public.current_profile_clinic_id());
