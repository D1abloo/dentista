-- Multi-tenant: tenants + columnas tenant_id + políticas RLS de referencia
-- Alineado con el modelo demo del frontend (TEN-/PAT-/CIT- en texto en demo; UUID en producción)

create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  code text unique,
  name text not null,
  type text not null check (type in ('dentista', 'clinica')),
  owner_name text,
  email text,
  phone text,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Vincular clínicas existentes a un tenant
alter table public.clinics
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create index if not exists idx_clinics_tenant on public.clinics(tenant_id);

-- Pacientes globales (portal unificado)
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  code text unique,
  full_name text not null,
  email text not null,
  phone text,
  dni text,
  birth_date date,
  created_at timestamptz not null default now()
);

-- Mensajes clínica ↔ paciente (reemplaza modelo de 0001_schema con clinic_id)
drop table if exists public.messages cascade;

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  subject text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_patient on public.messages(patient_id, created_at desc);
create index if not exists idx_messages_tenant on public.messages(tenant_id, created_at desc);

-- Informes clínicos
create table if not exists public.clinical_reports (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  title text not null,
  diagnosis text,
  recommendations text,
  visible_to_patient boolean not null default false,
  created_at timestamptz not null default now()
);

-- Documentos del paciente
create table if not exists public.patient_documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  file_name text,
  visibility text not null default 'admin' check (visibility in ('paciente', 'admin')),
  created_at timestamptz not null default now()
);

-- tenant_id en tablas operativas (si no existen)
alter table public.dentists add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.treatments add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.appointments add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.invoices add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.payments add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- RLS: habilitar en tablas sensibles
alter table public.clinical_reports enable row level security;
alter table public.patient_documents enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

-- Ejemplo: staff solo su tenant (requiere claim tenant_id en JWT)
-- create policy tenant_staff_reports on public.clinical_reports
--   for all using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Ejemplo: paciente solo sus filas visibles
-- create policy patient_read_reports on public.clinical_reports
--   for select using (
--     patient_id = (auth.jwt() ->> 'patient_id')::uuid
--     and visible_to_patient = true
--   );

-- create policy patient_read_documents on public.patient_documents
--   for select using (
--     patient_id = (auth.jwt() ->> 'patient_id')::uuid
--     and visibility = 'paciente'
--   );

comment on table public.tenants is 'Clínica o dentista aislado; base del multi-tenant Dentista+';
comment on column public.clinical_reports.visible_to_patient is 'Si true, el paciente lo ve en su portal';
comment on column public.patient_documents.visibility is 'admin = solo panel clínica; paciente = visible en portal';
