-- Registro público de pacientes y activación por correo

alter table public.profiles
  add column if not exists dni text,
  add column if not exists birth_date date,
  add column if not exists activated_at timestamptz,
  add column if not exists activation_token_hash text,
  add column if not exists activation_token_expires_at timestamptz;

create index if not exists idx_profiles_patient_email on public.profiles(lower(email))
  where role = 'patient'::public.user_role;

create index if not exists idx_profiles_activation_token on public.profiles(activation_token_hash)
  where activation_token_hash is not null;

comment on column public.profiles.activated_at is 'Fecha de activación tras confirmar el enlace del correo';
comment on column public.profiles.activation_token_hash is 'Hash SHA-256 del token de activación (un solo uso)';

-- Pacientes ya existentes: considerados activados
update public.profiles
set activated_at = coalesce(activated_at, created_at)
where role = 'patient'::public.user_role and activated_at is null;
