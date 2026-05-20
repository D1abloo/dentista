-- Organización multi-sede: un tenant (organización) con varias clínicas (sedes)

alter table public.clinics
  add column if not exists city text,
  add column if not exists is_main_branch boolean not null default false;

create index if not exists idx_clinics_tenant_branch on public.clinics(tenant_id, is_main_branch);

comment on column public.clinics.is_main_branch is 'Sede principal de la organización (tenant)';
comment on column public.clinics.city is 'Ciudad de la sede';
