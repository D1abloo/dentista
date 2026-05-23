-- Cierre de huecos RLS: consentimientos, documentos, mensajes, pagos, bloqueos

create or replace function public.current_clinic_tenant_id()
returns uuid
language sql
stable
as $$
  select c.tenant_id
  from public.clinics c
  where c.id = public.current_clinic_id()
  limit 1;
$$;

-- informed_consents
alter table public.informed_consents enable row level security;

drop policy if exists clinic_staff_informed_consents on public.informed_consents;
create policy clinic_staff_informed_consents on public.informed_consents
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  );

drop policy if exists patient_read_informed_consents on public.informed_consents;
create policy patient_read_informed_consents on public.informed_consents
  for select
  using (
    patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

drop policy if exists patient_sign_informed_consents on public.informed_consents;
create policy patient_sign_informed_consents on public.informed_consents
  for update
  using (
    status = 'pendiente'
    and patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  )
  with check (
    patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

-- patient_documents
drop policy if exists clinic_staff_patient_documents on public.patient_documents;
create policy clinic_staff_patient_documents on public.patient_documents
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  );

drop policy if exists patient_read_patient_documents on public.patient_documents;
create policy patient_read_patient_documents on public.patient_documents
  for select
  using (
    visibility = 'paciente'
    and patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

-- messages
drop policy if exists clinic_staff_messages on public.messages;
create policy clinic_staff_messages on public.messages
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and tenant_id = public.current_clinic_tenant_id())
  );

drop policy if exists patient_read_messages on public.messages;
create policy patient_read_messages on public.messages
  for select
  using (
    patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

-- payments
drop policy if exists clinic_staff_payments on public.payments;
create policy clinic_staff_payments on public.payments
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );

drop policy if exists patient_read_payments on public.payments;
create policy patient_read_payments on public.payments
  for select
  using (
    patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

-- invoices: lectura paciente
drop policy if exists patient_read_invoices on public.invoices;
create policy patient_read_invoices on public.invoices
  for select
  using (
    patient_id in (
      select p.id from public.profiles p
      where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

-- schedule_blocks
drop policy if exists schedule_blocks_staff on public.schedule_blocks;
create policy schedule_blocks_staff on public.schedule_blocks
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );

-- clinical_reports: super admin
drop policy if exists platform_super_clinical_reports on public.clinical_reports;
create policy platform_super_clinical_reports on public.clinical_reports
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- notification_jobs / stripe_checkout_sessions
alter table public.notification_jobs enable row level security;
drop policy if exists clinic_staff_notification_jobs on public.notification_jobs;
create policy clinic_staff_notification_jobs on public.notification_jobs
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );

alter table public.stripe_checkout_sessions enable row level security;
drop policy if exists clinic_staff_stripe_sessions on public.stripe_checkout_sessions;
create policy clinic_staff_stripe_sessions on public.stripe_checkout_sessions
  for all
  using (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  )
  with check (
    public.is_super_admin()
    or (public.is_clinic_staff() and clinic_id = public.current_clinic_id())
  );
