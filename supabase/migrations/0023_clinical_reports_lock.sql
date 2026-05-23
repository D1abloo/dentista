-- Bloqueo de informes publicados en PDP; reapertura solo vía BBDD (reopened_for_edit)

alter table if exists public.clinical_reports
  add column if not exists locked_at timestamptz,
  add column if not exists reopened_for_edit boolean not null default false;

comment on column public.clinical_reports.locked_at is
  'Fecha de bloqueo tras publicar en portal paciente; impide edición en admin salvo reopened_for_edit';
comment on column public.clinical_reports.reopened_for_edit is
  'true solo si se desbloquea manualmente en BBDD para que el Dr modifique el informe';

update public.clinical_reports
set locked_at = coalesce(locked_at, created_at)
where visible_to_patient = true and locked_at is null;
