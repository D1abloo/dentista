-- Política de contraseñas: cambio obligatorio al primer acceso y caducidad (3 meses, excepto administradores)

alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists password_set_at timestamptz,
  add column if not exists password_expires_at timestamptz;

create index if not exists idx_profiles_password_expires on public.profiles(password_expires_at)
  where password_expires_at is not null;
