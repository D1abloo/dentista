-- Dentista+ production: Super Admin, registros de clínicas, suscripciones, soporte y RLS

-- Roles de plataforma (extensión del enum existente)
do $$
begin
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'user_role' and e.enumlabel = 'super_admin') then
    alter type public.user_role add value 'super_admin';
  end if;
  if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid where t.typname = 'user_role' and e.enumlabel = 'clinic_admin') then
    alter type public.user_role add value 'clinic_admin';
  end if;
end $$;

-- Estado operativo de la clínica
alter table public.clinics
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'rejected')),
  add column if not exists subscription_plan text not null default 'essential'
    check (subscription_plan in ('essential', 'professional', 'enterprise')),
  add column if not exists approved_at timestamptz,
  add column if not exists suspended_at timestamptz;

create index if not exists idx_clinics_status on public.clinics(status);

-- Administradores globales Dentista+
create table if not exists public.platform_admins (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Solicitudes de alta (antes de crear clínica)
create table if not exists public.clinic_registrations (
  id uuid primary key default uuid_generate_v4(),
  clinic_name text not null,
  owner_name text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  clinic_id uuid references public.clinics(id) on delete set null,
  reviewed_by uuid references public.platform_admins(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_clinic_registrations_status on public.clinic_registrations(status, created_at desc);
create unique index if not exists idx_clinic_registrations_email_pending
  on public.clinic_registrations(lower(email))
  where status = 'pending';

-- Suscripciones SaaS por clínica
create table if not exists public.clinic_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null unique references public.clinics(id) on delete cascade,
  plan text not null default 'essential'
    check (plan in ('essential', 'professional', 'enterprise')),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'canceled')),
  seats int not null default 5 check (seats > 0),
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tickets de soporte
create table if not exists public.support_requests (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references public.clinics(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  subject text not null,
  body text not null,
  category text not null default 'general'
    check (category in ('general', 'billing', 'technical', 'patient', 'clinic')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_requests_status on public.support_requests(status, created_at desc);

-- Configuración global de plataforma
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value)
values
  ('branding', '{"appName":"Dentista+","supportEmail":"soporte@dentista.app"}'::jsonb),
  ('registration', '{"autoApprove":false,"requireEmailVerification":true}'::jsonb)
on conflict (key) do nothing;

-- Métricas agregadas (sin datos clínicos sensibles)
create table if not exists public.clinic_usage_daily (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  day date not null,
  appointments_count int not null default 0,
  patients_count int not null default 0,
  invoices_count int not null default 0,
  unique (clinic_id, day)
);

-- Helpers JWT / sesión (app_metadata en Supabase Auth)
create or replace function public.current_clinic_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'clinic_id', '')::uuid;
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin', false);
$$;

create or replace function public.is_clinic_staff()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in (
    'clinic_admin', 'admin', 'owner', 'dentist', 'receptionist'
  ), false);
$$;

-- RLS en tablas operativas
alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.dentists enable row level security;
alter table public.treatments enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.clinic_registrations enable row level security;
alter table public.clinic_subscriptions enable row level security;
alter table public.support_requests enable row level security;
alter table public.platform_admins enable row level security;
alter table public.platform_settings enable row level security;

-- Super admin: acceso total a clínicas y registros
drop policy if exists platform_super_clinics on public.clinics;
create policy platform_super_clinics on public.clinics
  for all using (public.is_super_admin());

drop policy if exists platform_super_registrations on public.clinic_registrations;
create policy platform_super_registrations on public.clinic_registrations
  for all using (public.is_super_admin());

drop policy if exists platform_super_support on public.support_requests;
create policy platform_super_support on public.support_requests
  for all using (public.is_super_admin());

drop policy if exists platform_super_settings on public.platform_settings;
create policy platform_super_settings on public.platform_settings
  for all using (public.is_super_admin());

drop policy if exists platform_super_admins on public.platform_admins;
create policy platform_super_admins on public.platform_admins
  for select using (public.is_super_admin());

-- Staff: solo su clínica
drop policy if exists clinic_staff_profiles on public.profiles;
create policy clinic_staff_profiles on public.profiles
  for all using (clinic_id = public.current_clinic_id() and public.is_clinic_staff());

drop policy if exists clinic_staff_appointments on public.appointments;
create policy clinic_staff_appointments on public.appointments
  for all using (clinic_id = public.current_clinic_id() and public.is_clinic_staff());

drop policy if exists clinic_staff_dentists on public.dentists;
create policy clinic_staff_dentists on public.dentists
  for all using (clinic_id = public.current_clinic_id() and public.is_clinic_staff());

drop policy if exists clinic_staff_treatments on public.treatments;
create policy clinic_staff_treatments on public.treatments
  for all using (clinic_id = public.current_clinic_id() and public.is_clinic_staff());

drop policy if exists clinic_staff_invoices on public.invoices;
create policy clinic_staff_invoices on public.invoices
  for all using (clinic_id = public.current_clinic_id() and public.is_clinic_staff());

-- Registro público: insertar solicitud pendiente (anon)
drop policy if exists public_insert_registration on public.clinic_registrations;
create policy public_insert_registration on public.clinic_registrations
  for insert with check (status = 'pending');

comment on table public.clinic_registrations is 'Alta de nuevas clínicas; Super Admin aprueba o rechaza';
comment on table public.platform_admins is 'Administradores globales Dentista+';
comment on table public.clinic_subscriptions is 'Plan SaaS por clínica';
