-- Reserva pública asistida por IA: metadatos de origen, settings y protección anti-doble-reserva.

alter table public.appointments
  add column if not exists source text;

comment on column public.appointments.source is
  'Origen de la cita (ej: panel_admin, portal_paciente, public_ai_assistant).';

create unique index if not exists idx_appointments_unique_active_dentist_start
  on public.appointments (clinic_id, dentist_id, starts_at)
  where status in ('pending', 'confirmed');

alter table public.clinic_settings
  add column if not exists allow_public_ai_booking boolean not null default true;

alter table public.clinic_settings
  add column if not exists public_booking_requires_account boolean not null default false;

alter table public.clinic_settings
  add column if not exists public_booking_requires_email_verification boolean not null default false;

alter table public.clinic_settings
  add column if not exists public_booking_auto_confirm boolean not null default true;

alter table public.clinic_settings
  add column if not exists public_booking_min_notice_hours int not null default 2;

alter table public.clinic_settings
  add column if not exists public_booking_max_days_ahead int not null default 60;

alter table public.clinic_settings
  add column if not exists public_booking_allowed_treatments uuid[] default null;
