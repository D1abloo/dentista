-- NHC sin ceros a la izquierda (1, 2, 3 en lugar de 0001)

update public.profiles
set nhc = (regexp_replace(nhc, '^0+', ''))::text
where role = 'patient'
  and nhc is not null
  and nhc ~ '^0+[1-9][0-9]*$';

update public.profiles set nhc = '0' where role = 'patient' and nhc = '';

comment on column public.profiles.nhc is 'NHC numérico secuencial por clínica (1, 2, 3…)';
