-- Auditoría de inspección por super administrador (panel clínica y PdP)

alter table public.patient_portal_access_audit
  add column if not exists access_role text,
  add column if not exists actor_email text;

alter table public.patient_portal_access_tokens
  alter column staff_profile_id drop not null;

create table if not exists public.platform_inspect_audit (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_name text,
  access_role text not null default 'super_admin',
  inspect_mode text not null check (inspect_mode in ('clinic_admin', 'patient_portal')),
  clinic_id uuid references public.clinics(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  patient_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  page_path text,
  resource_label text,
  resource_id text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_inspect_created on public.platform_inspect_audit(created_at desc);
create index if not exists idx_platform_inspect_clinic on public.platform_inspect_audit(clinic_id, created_at desc);
