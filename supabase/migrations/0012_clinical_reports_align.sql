-- Alinea clinical_reports con la API multi-tenant (tablas creadas antes en 0005 sin tenant_id)

alter table if exists public.clinical_reports
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade,
  add column if not exists diagnosis text,
  add column if not exists recommendations text,
  add column if not exists visible_to_patient boolean not null default true,
  add column if not exists file_name text,
  add column if not exists file_url text,
  add column if not exists mime_type text,
  add column if not exists uploaded_by text default 'Sistema',
  add column if not exists description text;

-- Rellena tenant_id en filas legacy
update public.clinical_reports
set tenant_id = (select tenant_id from public.clinics where tenant_id is not null limit 1)
where tenant_id is null;

comment on column public.clinical_reports.tenant_id is 'Tenant propietario del informe (requerido por API)';
