-- Mensajes bidireccionales paciente ↔ clínica
alter table if exists public.messages
  add column if not exists from_patient boolean not null default false;

comment on column public.messages.from_patient is 'true si lo envió el paciente desde el portal; false si lo envió la clínica';

create index if not exists idx_messages_clinic_unread_patient
  on public.messages (tenant_id, created_at desc)
  where from_patient = true and read = false;
