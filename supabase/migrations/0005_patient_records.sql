-- Registros clínicos vinculados por patient_id (producción + RLS)

create table if not exists public.clinical_reports (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  appointment_id text references public.appointments(id) on delete set null,
  title text not null,
  description text not null,
  diagnosis text,
  recommendations text,
  file_name text,
  file_url text,
  uploaded_by text not null,
  visible_to_patient boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  appointment_id text references public.appointments(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  concept text not null,
  status text not null check (status in ('pendiente','pagada','vencida','cancelada')),
  due_date date,
  issued_at date not null
);

create table if not exists public.payments (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  invoice_id text references public.invoices(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  status text not null,
  paid_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_documents (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  appointment_id text references public.appointments(id) on delete set null,
  type text not null,
  title text not null,
  description text,
  file_name text,
  file_url text,
  visibility text not null check (visibility in ('paciente','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.patient_messages (
  id text primary key,
  patient_id text not null references public.patients(id) on delete cascade,
  subject text not null,
  body text not null,
  channel text not null,
  type text not null,
  read boolean not null default false,
  sent_at timestamptz not null default now()
);

-- RLS: cada paciente solo lee sus filas (ejemplo; ajustar auth.uid() ↔ patients.user_id)
alter table public.clinical_reports enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.patient_documents enable row level security;
alter table public.patient_messages enable row level security;
