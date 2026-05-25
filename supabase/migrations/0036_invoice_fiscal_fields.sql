-- Campos fiscales de clínica y vínculo profesional en facturas (AgendaClinic)

alter table public.clinics
  add column if not exists legal_name text,
  add column if not exists commercial_name text,
  add column if not exists tax_id text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text default 'España',
  add column if not exists website text,
  add column if not exists tagline text;

-- logo_url ya existe en 0015_clinic_logo.sql

alter table public.invoices
  add column if not exists professional_id uuid references public.dentists(id) on delete set null;

comment on column public.clinics.tax_id is 'CIF/NIF de la clínica';
comment on column public.invoices.professional_id is 'Profesional responsable de la factura';
