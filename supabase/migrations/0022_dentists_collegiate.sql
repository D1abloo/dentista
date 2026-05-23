-- Número de colegiado y contacto del profesional (informes clínicos)
alter table if exists public.dentists
  add column if not exists collegiate_number text;

alter table if exists public.dentists
  add column if not exists email text;

alter table if exists public.dentists
  add column if not exists phone text;

comment on column public.dentists.collegiate_number is 'Número de colegiado (pie de informes clínicos)';
comment on column public.dentists.email is 'Email profesional';
comment on column public.dentists.phone is 'Teléfono profesional';
