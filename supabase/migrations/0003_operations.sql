-- DentalFlow módulos operativos: disponibilidad, marketing, reviews, roles, logs e integraciones.

create table if not exists public.availability_rules (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  dentist_id uuid references public.dentists(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  weekday int not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  slot_minutes int not null default 30 check (slot_minutes between 10 and 240),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_availability_rules_clinic_weekday on public.availability_rules(clinic_id, weekday);
create unique index if not exists idx_availability_rules_unique_demo on public.availability_rules(clinic_id, weekday, starts_at, ends_at, slot_minutes);

create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'sms')),
  audience text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_campaigns_clinic_name on public.campaigns(clinic_id, name);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.profiles(id) on delete set null,
  dentist_id uuid references public.dentists(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  source text not null default 'manual',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references public.clinics(id) on delete set null,
  level text not null check (level in ('info', 'warning', 'error')),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_logs_clinic_created on public.system_logs(clinic_id, created_at desc);

create table if not exists public.role_permissions (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  role public.user_role not null,
  permission text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (clinic_id, role, permission)
);

create table if not exists public.clinic_settings (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  booking_policy jsonb not null default '{}'::jsonb,
  billing_policy jsonb not null default '{}'::jsonb,
  notification_policy jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  provider text not null,
  category text not null check (category in ('calendar', 'payments', 'notifications', 'analytics', 'storage')),
  status text not null default 'disabled' check (status in ('connected', 'mock', 'disabled')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (clinic_id, provider)
);

alter table public.availability_rules enable row level security;
alter table public.campaigns enable row level security;
alter table public.reviews enable row level security;
alter table public.system_logs enable row level security;
alter table public.role_permissions enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.integrations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'availability_rules' and policyname = 'availability_rules_select_same_clinic') then
    create policy availability_rules_select_same_clinic on public.availability_rules for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'campaigns' and policyname = 'campaigns_select_same_clinic') then
    create policy campaigns_select_same_clinic on public.campaigns for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'reviews_select_same_clinic') then
    create policy reviews_select_same_clinic on public.reviews for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'system_logs' and policyname = 'system_logs_select_same_clinic') then
    create policy system_logs_select_same_clinic on public.system_logs for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'role_permissions' and policyname = 'role_permissions_select_same_clinic') then
    create policy role_permissions_select_same_clinic on public.role_permissions for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'clinic_settings' and policyname = 'clinic_settings_select_same_clinic') then
    create policy clinic_settings_select_same_clinic on public.clinic_settings for select using (clinic_id = public.current_profile_clinic_id());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'integrations' and policyname = 'integrations_select_same_clinic') then
    create policy integrations_select_same_clinic on public.integrations for select using (clinic_id = public.current_profile_clinic_id());
  end if;
end $$;
