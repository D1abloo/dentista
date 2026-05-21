-- Mismo email puede ser staff y paciente en la misma clínica (roles distintos)

alter table public.profiles drop constraint if exists profiles_clinic_id_email_key;

drop index if exists public.uq_profiles_clinic_email_role;

create unique index if not exists uq_profiles_clinic_email_role
  on public.profiles (clinic_id, lower(email), role);

comment on index public.uq_profiles_clinic_email_role is
  'Un email puede tener perfil staff y paciente en la misma clínica (roles distintos).';
