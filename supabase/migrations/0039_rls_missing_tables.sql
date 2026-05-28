-- Cierre crítico RLS (auditoría Supabase 2026-05-28)
-- Tablas: organization_groups, patient_verification_tokens (sin RLS)
-- Tablas: staff_clinic_assignments, staff_clinic_preferences (RLS sin políticas)

-- === organization_groups ===
alter table public.organization_groups enable row level security;

drop policy if exists platform_super_organization_groups on public.organization_groups;
create policy platform_super_organization_groups on public.organization_groups
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists clinic_staff_read_organization_groups on public.organization_groups;
create policy clinic_staff_read_organization_groups on public.organization_groups
  for select
  using (
    public.is_clinic_staff()
    and exists (
      select 1
      from public.clinics c
      where c.organization_id = organization_groups.id
        and c.id = public.current_clinic_id()
    )
  );

-- === patient_verification_tokens (solo service role / backend) ===
alter table public.patient_verification_tokens enable row level security;

drop policy if exists patient_verification_tokens_deny_clients on public.patient_verification_tokens;
create policy patient_verification_tokens_deny_clients on public.patient_verification_tokens
  for all
  using (false)
  with check (false);

-- === staff_clinic_assignments ===
drop policy if exists platform_super_staff_clinic_assignments on public.staff_clinic_assignments;
create policy platform_super_staff_clinic_assignments on public.staff_clinic_assignments
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists staff_read_own_clinic_assignments on public.staff_clinic_assignments;
create policy staff_read_own_clinic_assignments on public.staff_clinic_assignments
  for select
  using (auth_user_id = auth.uid());

drop policy if exists clinic_staff_manage_clinic_assignments on public.staff_clinic_assignments;
create policy clinic_staff_manage_clinic_assignments on public.staff_clinic_assignments
  for all
  using (
    public.is_clinic_staff()
    and clinic_id = public.current_clinic_id()
  )
  with check (
    public.is_clinic_staff()
    and clinic_id = public.current_clinic_id()
  );

-- === staff_clinic_preferences ===
drop policy if exists platform_super_staff_clinic_preferences on public.staff_clinic_preferences;
create policy platform_super_staff_clinic_preferences on public.staff_clinic_preferences
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists staff_own_clinic_preferences on public.staff_clinic_preferences;
create policy staff_own_clinic_preferences on public.staff_clinic_preferences
  for all
  using (
    profile_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid()
    )
  )
  with check (
    profile_id in (
      select p.id from public.profiles p where p.auth_user_id = auth.uid()
    )
  );

comment on policy patient_verification_tokens_deny_clients on public.patient_verification_tokens is
  'Tokens de verificación IA: solo API con service role; nunca expuestos a anon/authenticated.';
