-- Logo de clínica para sidebar y facturas
alter table public.clinics
  add column if not exists logo_url text;

comment on column public.clinics.logo_url is 'URL pública o data URL del logo de la sede/organización';
