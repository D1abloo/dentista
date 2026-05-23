-- RLS defensivo: informes clínicos (staff del tenant + lectura paciente visible)

drop policy if exists clinic_staff_clinical_reports on public.clinical_reports;
create policy clinic_staff_clinical_reports on public.clinical_reports
  for all
  using (
    public.is_clinic_staff()
    and tenant_id = (
      select c.tenant_id from public.clinics c where c.id = public.current_clinic_id() limit 1
    )
  )
  with check (
    public.is_clinic_staff()
    and tenant_id = (
      select c.tenant_id from public.clinics c where c.id = public.current_clinic_id() limit 1
    )
  );

drop policy if exists patient_read_clinical_reports on public.clinical_reports;
create policy patient_read_clinical_reports on public.clinical_reports
  for select
  using (
    visible_to_patient = true
    and patient_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid() and p.role = 'patient'
    )
  );

comment on policy clinic_staff_clinical_reports on public.clinical_reports is
  'Personal de clínica: CRUD informes de su tenant';
comment on policy patient_read_clinical_reports on public.clinical_reports is
  'Paciente: solo informes marcados como visibles en portal';
