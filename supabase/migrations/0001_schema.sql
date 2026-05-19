-- DentalFlow schema base para Supabase
create extension if not exists "uuid-ossp";

create type public.user_role as enum ('patient', 'receptionist', 'dentist', 'admin', 'owner');
create type public.appointment_status as enum ('confirmed', 'pending', 'completed', 'cancelled', 'no_show');

create table if not exists public.clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Europe/Madrid',
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  role public.user_role not null default 'patient',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (clinic_id, email)
);

create table if not exists public.dentists (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  specialty text not null,
  rating numeric(2,1) not null default 5.0,
  reviews_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.treatments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  duration_minutes int not null check (duration_minutes > 0),
  price_cents int not null default 0 check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, name)
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.profiles(id) on delete set null,
  dentist_id uuid not null references public.dentists(id) on delete restrict,
  treatment_id uuid not null references public.treatments(id) on delete restrict,
  room_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_appointments_clinic_starts on public.appointments(clinic_id, starts_at);
create index if not exists idx_appointments_dentist_starts on public.appointments(dentist_id, starts_at);

create table if not exists public.appointment_events (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.profiles(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  status text not null default 'draft',
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  provider text not null default 'manual',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.profiles(id) on delete cascade,
  sender_role public.user_role not null,
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'sms')),
  status text not null default 'queued',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.appointments_view as
select
  a.id,
  a.clinic_id,
  a.patient_id,
  coalesce(p.full_name, 'Paciente invitado') as patient_name,
  a.dentist_id,
  d.name as dentist_name,
  a.treatment_id,
  t.name as treatment_name,
  a.room_name,
  a.starts_at,
  a.ends_at,
  a.status,
  a.notes
from public.appointments a
join public.dentists d on d.id = a.dentist_id
join public.treatments t on t.id = a.treatment_id
left join public.profiles p on p.id = a.patient_id;

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.dentists enable row level security;
alter table public.treatments enable row level security;
alter table public.rooms enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.reminders enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_profile_clinic_id()
returns uuid
language sql
stable
as $$
  select clinic_id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

-- Políticas base: ajustar antes de producción según cada flujo exacto.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_same_clinic') then
    create policy profiles_select_same_clinic on public.profiles for select using (clinic_id = public.current_profile_clinic_id() or auth_user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_select_same_clinic') then
    create policy appointments_select_same_clinic on public.appointments for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'appointments' and policyname = 'appointments_insert_same_clinic') then
    create policy appointments_insert_same_clinic on public.appointments for insert with check (clinic_id = public.current_profile_clinic_id());
  end if;
end $$;
