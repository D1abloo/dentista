-- Fase 4: FK paciente en registros, columnas de facturación y webhook Stripe

alter table if exists public.informed_consents
  drop constraint if exists informed_consents_patient_id_fkey;

alter table if exists public.informed_consents
  add constraint informed_consents_patient_id_fkey
  foreign key (patient_id) references public.profiles(id) on delete cascade;

alter table if exists public.clinical_reports
  drop constraint if exists clinical_reports_patient_id_fkey;

alter table if exists public.clinical_reports
  add constraint clinical_reports_patient_id_fkey
  foreign key (patient_id) references public.profiles(id) on delete cascade;

alter table if exists public.patient_documents
  drop constraint if exists patient_documents_patient_id_fkey;

alter table if exists public.patient_documents
  add constraint patient_documents_patient_id_fkey
  foreign key (patient_id) references public.profiles(id) on delete cascade;

alter table if exists public.messages
  drop constraint if exists messages_patient_id_fkey;

alter table if exists public.messages
  add constraint messages_patient_id_fkey
  foreign key (patient_id) references public.profiles(id) on delete cascade;

alter table if exists public.invoices
  add column if not exists concept text default 'Servicios odontológicos';

alter table if exists public.payments
  add column if not exists patient_id uuid references public.profiles(id) on delete set null;

alter table if exists public.stripe_checkout_sessions
  add column if not exists stripe_event_id text;

create index if not exists idx_stripe_checkout_event on public.stripe_checkout_sessions(stripe_event_id);
