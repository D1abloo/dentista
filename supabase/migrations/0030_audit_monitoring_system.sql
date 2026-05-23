-- Sistema centralizado de auditoría, monitorización y sesiones

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

-- Backfill mínimo para filas legacy
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

-- Sin políticas de escritura/lectura para clientes: solo service role vía API

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
