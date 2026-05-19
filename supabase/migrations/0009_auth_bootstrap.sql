-- Auth + perfiles: índices y metadatos para login producción

create index if not exists idx_profiles_auth_user on public.profiles(auth_user_id);
create index if not exists idx_profiles_clinic_role on public.profiles(clinic_id, role);

alter table public.profiles
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

-- Sincronizar tenant_id desde clínica cuando falte
update public.profiles p
set tenant_id = c.tenant_id
from public.clinics c
where p.clinic_id = c.id and p.tenant_id is null and c.tenant_id is not null;

comment on column public.profiles.tenant_id is 'Tenant aislado; debe coincidir con clinics.tenant_id';
