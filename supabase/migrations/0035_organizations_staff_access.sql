-- Grupos multi-sede (varias clínicas bajo una organización lógica) y asignaciones explícitas de acceso staff.

create table if not exists public.organization_groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind text not null default 'multi_sede' check (kind in ('multi_sede', 'independent')),
  created_at timestamptz not null default now()
);

alter table public.clinics
  add column if not exists organization_id uuid references public.organization_groups(id) on delete set null;

create index if not exists idx_clinics_organization on public.clinics(organization_id);

comment on table public.organization_groups is 'Agrupación lógica multi-sede (varios tenants/clínicas vinculadas).';
comment on column public.clinics.organization_id is 'Organización multi-sede a la que pertenece la clínica (opcional).';

create table if not exists public.staff_clinic_assignments (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role text not null default 'dentist',
  granted_by uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (auth_user_id, clinic_id)
);

create index if not exists idx_staff_clinic_assignments_auth on public.staff_clinic_assignments(auth_user_id);
create index if not exists idx_staff_clinic_assignments_clinic on public.staff_clinic_assignments(clinic_id);

alter table public.staff_clinic_assignments enable row level security;

comment on table public.staff_clinic_assignments is 'Acceso de personal a centros clínicos (complementa profiles por sede).';
