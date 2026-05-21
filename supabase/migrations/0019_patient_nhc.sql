-- NHC (número de historia clínica) por clínica: 4 dígitos inicialmente, ampliable

alter table public.profiles
  add column if not exists nhc text;

create unique index if not exists uq_profiles_clinic_nhc
  on public.profiles (clinic_id, nhc)
  where role = 'patient'::public.user_role and nhc is not null;

comment on column public.profiles.nhc is 'Número de historia clínica único por clínica (4+ dígitos)';

-- Asignar NHC a pacientes existentes sin código
with ranked as (
  select
    id,
    row_number() over (partition by clinic_id order by created_at) as rn
  from public.profiles
  where role = 'patient' and nhc is null
)
update public.profiles p
set nhc = ranked.rn::text
from ranked
where p.id = ranked.id;
