-- Endurecimiento RLS: migración 0030 (auditoría) + cierre de huecos detectados en auditoría 2026-05-24

-- === 0030 audit / login events (idempotente) ===
alter table public.audit_logs
  add column if not exists event_type text,
  add column if not exists module text,
  add column if not exists severity text default 'info',
  add column if not exists result text default 'ok',
  add column if not exists message text,
  add column if not exists user_id uuid,
  add column if not exists user_email text,
  add column if not exists user_role text,
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists patient_id uuid,
  add column if not exists professional_id uuid,
  add column if not exists resource_type text,
  add column if not exists route text,
  add column if not exists ip_address text,
  add column if not exists user_agent text;

update public.audit_logs
set
  event_type = coalesce(event_type, action),
  module = coalesce(module, coalesce(metadata->>'module', 'platform')),
  message = coalesce(message, action)
where event_type is null;

create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_clinic on public.audit_logs(clinic_id, created_at desc);
create index if not exists idx_audit_logs_event_type on public.audit_logs(event_type, created_at desc);
create index if not exists idx_audit_logs_tenant on public.audit_logs(tenant_id, created_at desc);

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  user_role text,
  tenant_id uuid references public.tenants(id) on delete set null,
  clinic_id uuid references public.clinics(id) on delete set null,
  patient_id uuid,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  ip_address text,
  user_agent text,
  device text,
  status text not null check (status in ('success', 'failed', 'denied', 'logout')),
  failure_reason text,
  route text,
  created_at timestamptz not null default now()
);

create index if not exists idx_login_events_email on public.login_events(email, login_at desc);
create index if not exists idx_login_events_clinic on public.login_events(clinic_id, login_at desc);

alter table public.login_events enable row level security;

drop policy if exists audit_logs_deny_all on public.audit_logs;
create policy audit_logs_deny_all on public.audit_logs
  for all
  using (false)
  with check (false);

drop policy if exists login_events_deny_all on public.login_events;
create policy login_events_deny_all on public.login_events
  for all
  using (false)
  with check (false);

-- === Tablas sin RLS (fuga anon confirmada en tenants) ===
alter table public.tenants enable row level security;
alter table public.patients enable row level security;
alter table public.clinic_usage_daily enable row level security;

drop policy if exists platform_super_tenants on public.tenants;
create policy platform_super_tenants on public.tenants
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists clinic_staff_read_tenant on public.tenants;
create policy clinic_staff_read_tenant on public.tenants
  for select
  using (
    public.is_clinic_staff()
    and id = public.current_clinic_tenant_id()
  );

drop policy if exists patients_deny_clients on public.patients;
create policy patients_deny_clients on public.patients
  for all
  using (false)
  with check (false);

drop policy if exists platform_super_clinic_usage on public.clinic_usage_daily;
create policy platform_super_clinic_usage on public.clinic_usage_daily
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists clinic_staff_read_usage on public.clinic_usage_daily;
create policy clinic_staff_read_usage on public.clinic_usage_daily
  for select
  using (
    public.is_clinic_staff()
    and clinic_id = public.current_clinic_id()
  );

-- === Tablas con RLS pero sin políticas ===
alter table public.platform_inspect_audit enable row level security;

drop policy if exists platform_inspect_audit_deny_clients on public.platform_inspect_audit;
create policy platform_inspect_audit_deny_clients on public.platform_inspect_audit
  for all
  using (false)
  with check (false);

drop policy if exists patient_portal_access_audit_deny_clients on public.patient_portal_access_audit;
create policy patient_portal_access_audit_deny_clients on public.patient_portal_access_audit
  for all
  using (false)
  with check (false);

drop policy if exists patient_portal_access_tokens_staff on public.patient_portal_access_tokens;
create policy patient_portal_access_tokens_staff on public.patient_portal_access_tokens
  for all
  using (
    public.is_super_admin()
    or (
      public.is_clinic_staff()
      and clinic_id = public.current_clinic_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_clinic_staff()
      and clinic_id = public.current_clinic_id()
    )
  );

drop policy if exists platform_super_clinic_subscriptions on public.clinic_subscriptions;
create policy platform_super_clinic_subscriptions on public.clinic_subscriptions
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists clinic_staff_read_subscription on public.clinic_subscriptions;
create policy clinic_staff_read_subscription on public.clinic_subscriptions
  for select
  using (
    public.is_clinic_staff()
    and clinic_id = public.current_clinic_id()
  );

drop policy if exists clinic_staff_rooms on public.rooms;
create policy clinic_staff_rooms on public.rooms
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );

drop policy if exists clinic_staff_reminders on public.reminders;
create policy clinic_staff_reminders on public.reminders
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );

drop policy if exists clinic_staff_appointment_events on public.appointment_events;
create policy clinic_staff_appointment_events on public.appointment_events
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );
