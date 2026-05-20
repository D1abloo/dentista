-- Fase 3: persistencia de panel (informes, documentos, mensajes, consentimientos),
-- pagos Stripe y cola de notificaciones.

alter table if exists public.clinical_reports
  add column if not exists description text,
  add column if not exists file_url text,
  add column if not exists mime_type text,
  add column if not exists uploaded_by text default 'Sistema';

alter table if exists public.patient_documents
  add column if not exists file_url text,
  add column if not exists mime_type text;

alter table if exists public.messages
  add column if not exists channel text not null default 'app',
  add column if not exists type text not null default 'clinica';

create table if not exists public.informed_consents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  treatment_name text not null,
  title text not null,
  body text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'firmado')),
  required_for_portal boolean not null default true,
  file_url text,
  file_name text,
  signature_ref text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_informed_consents_patient on public.informed_consents(patient_id, created_at desc);
create index if not exists idx_informed_consents_tenant on public.informed_consents(tenant_id, created_at desc);

create table if not exists public.notification_jobs (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'sms')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed')),
  provider text,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_notification_jobs_status on public.notification_jobs(status, created_at);

create table if not exists public.stripe_checkout_sessions (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'eur',
  stripe_session_id text unique,
  stripe_url text,
  status text not null default 'created' check (status in ('created', 'paid', 'expired', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_checkout_sessions_invoice on public.stripe_checkout_sessions(invoice_id);
