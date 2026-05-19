-- Estado completo de la demo Dentista+ (modelo TEN-/PAT-/CIT- en JSON)
-- Usado con PUBLIC_DEMO_MODE=true y credenciales Supabase en el servidor.

create table if not exists public.demo_app_state (
  scope text primary key default 'global',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.demo_app_state is 'Snapshot JSON del modo demo multi-tenant; una fila scope=global para todos los entornos demo';

alter table public.demo_app_state enable row level security;

-- Sin políticas para anon/authenticated: solo service_role vía API del servidor.
-- En producción con auth real, migrar a tablas normalizadas (tenants, patients, etc.).

create index if not exists idx_demo_app_state_updated on public.demo_app_state (updated_at desc);
