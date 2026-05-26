-- Verificación de paciente para asistente IA y metadatos de cancelación/reprogramación.

create table if not exists public.patient_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  phone text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_verification_tokens_hash
  on public.patient_verification_tokens (token_hash)
  where used_at is null;

create index if not exists idx_patient_verification_tokens_patient
  on public.patient_verification_tokens (patient_id, expires_at desc);

alter table public.appointments
  add column if not exists cancelled_at timestamptz;

alter table public.appointments
  add column if not exists cancellation_reason text;

alter table public.appointments
  add column if not exists cancelled_by text;

alter table public.appointments
  add column if not exists rescheduled_from_id uuid references public.appointments(id) on delete set null;

alter table public.appointments
  add column if not exists rescheduled_at timestamptz;

alter table public.appointments
  add column if not exists visible_to_patient boolean not null default true;

comment on table public.patient_verification_tokens is
  'Tokens de verificación de identidad para consulta de citas vía asistente público.';
