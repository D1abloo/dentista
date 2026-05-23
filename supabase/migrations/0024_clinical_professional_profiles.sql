-- Perfiles clínicos Dr/Dra (extiende dentists — usado en informes, agenda y PDFs)

alter table if exists public.dentists
  add column if not exists visible_title text,
  add column if not exists professional_college text,
  add column if not exists secondary_specialties text[] default '{}',
  add column if not exists languages text[] default '{}',
  add column if not exists report_bio text,
  add column if not exists agenda_color text default '#14b8a6',
  add column if not exists photo_url text,
  add column if not exists signature_url text,
  add column if not exists profile_completion smallint default 0,
  add column if not exists updated_at timestamptz default now();

comment on column public.dentists.visible_title is 'Cargo visible en informes (ej. Odontólogo)';
comment on column public.dentists.professional_college is 'Colegio profesional';
comment on column public.dentists.secondary_specialties is 'Especialidades secundarias';
comment on column public.dentists.languages is 'Idiomas del profesional';
comment on column public.dentists.report_bio is 'Texto profesional para informes';
comment on column public.dentists.agenda_color is 'Color en agenda (hex)';
comment on column public.dentists.photo_url is 'URL o ref de foto profesional';
comment on column public.dentists.signature_url is 'URL o ref de firma profesional';

create unique index if not exists dentists_clinic_collegiate_uidx
  on public.dentists (clinic_id, collegiate_number)
  where collegiate_number is not null and trim(collegiate_number) <> '';

create unique index if not exists dentists_profile_id_uidx
  on public.dentists (profile_id)
  where profile_id is not null;

create index if not exists dentists_clinic_status_idx
  on public.dentists (clinic_id, active);

create index if not exists dentists_tenant_idx
  on public.dentists (tenant_id);

-- Buckets recomendados (crear en Supabase Storage si no existen):
-- professional-photos, professional-signatures (RLS por clinic_id en metadata)
