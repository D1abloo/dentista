-- Acceso de personal al portal del paciente (PdP) con token y auditoría

create table if not exists public.patient_portal_access_tokens (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.profiles(id) on delete cascade,
  target_clinic_id uuid references public.clinics(id) on delete set null,
  token_hash text not null unique,
  label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists idx_pdp_tokens_staff on public.patient_portal_access_tokens(staff_profile_id, expires_at);
create index if not exists idx_pdp_tokens_patient on public.patient_portal_access_tokens(patient_id);
create index if not exists idx_pdp_tokens_clinic on public.patient_portal_access_tokens(clinic_id);

create table if not exists public.patient_portal_access_audit (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.patient_portal_access_tokens(id) on delete set null,
  clinic_id uuid references public.clinics(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  staff_profile_id uuid references public.profiles(id) on delete set null,
  patient_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  page_path text,
  resource_label text,
  resource_id text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_pdp_audit_token on public.patient_portal_access_audit(token_id, created_at desc);
create index if not exists idx_pdp_audit_staff on public.patient_portal_access_audit(staff_profile_id, created_at desc);

alter table public.patient_portal_access_tokens enable row level security;
alter table public.patient_portal_access_audit enable row level security;
