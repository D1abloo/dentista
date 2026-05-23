-- Cada clínica es un tenant independiente (1:1). Sin sedes compartiendo tenant_id.

comment on column public.clinics.tenant_id is 'Tenant exclusivo de esta clínica (máximo una clínica por tenant).';

-- Separa tenants legacy que agrupan varias clínicas.
do $$
declare
  g record;
  cid uuid;
  new_tid uuid;
  cname text;
  t_row public.tenants%rowtype;
begin
  for g in
    select tenant_id as tid
    from public.clinics
    where tenant_id is not null
    group by tenant_id
    having count(*) > 1
  loop
    select * into t_row from public.tenants where id = g.tid;

    for cid in
      select id from public.clinics where tenant_id = g.tid order by is_main_branch desc, created_at
    loop
      select name into cname from public.clinics where id = cid;

      insert into public.tenants (code, name, type, owner_name, email, phone, address, active)
      values (
        coalesce(t_row.code, 'TEN') || '-' || substr(replace(cid::text, '-', ''), 1, 8),
        coalesce(cname, t_row.name),
        coalesce(t_row.type, 'clinica'),
        coalesce(t_row.owner_name, cname),
        t_row.email,
        t_row.phone,
        coalesce((select address from public.clinics where id = cid), t_row.address),
        coalesce(t_row.active, true)
      )
      returning id into new_tid;

      update public.clinics set tenant_id = new_tid, is_main_branch = true where id = cid;

      update public.profiles set tenant_id = new_tid where clinic_id = cid;
      update public.dentists set tenant_id = new_tid where clinic_id = cid;
      update public.treatments set tenant_id = new_tid where clinic_id = cid;
      update public.appointments set tenant_id = new_tid where clinic_id = cid;
      update public.invoices set tenant_id = new_tid where clinic_id = cid;
      update public.payments set tenant_id = new_tid where clinic_id = cid;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'schedule_blocks' and column_name = 'tenant_id'
      ) then
        execute format('update public.schedule_blocks set tenant_id = %L where clinic_id = %L', new_tid, cid);
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'clinical_reports' and column_name = 'clinic_id'
      ) then
        execute format(
          'update public.clinical_reports set tenant_id = %L where clinic_id = %L',
          new_tid,
          cid
        );
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'messages' and column_name = 'clinic_id'
      ) then
        execute format('update public.messages set tenant_id = %L where clinic_id = %L', new_tid, cid);
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'patient_documents' and column_name = 'clinic_id'
      ) then
        execute format(
          'update public.patient_documents set tenant_id = %L where clinic_id = %L',
          new_tid,
          cid
        );
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'informed_consents' and column_name = 'clinic_id'
      ) then
        execute format(
          'update public.informed_consents set tenant_id = %L where clinic_id = %L',
          new_tid,
          cid
        );
      end if;
    end loop;

    delete from public.tenants where id = g.tid;
  end loop;
end $$;

create or replace function public.enforce_one_clinic_per_tenant()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is null then
    return new;
  end if;
  if exists (
    select 1 from public.clinics c
    where c.tenant_id = new.tenant_id
      and c.id is distinct from new.id
  ) then
    raise exception 'Cada clínica debe ser independiente: un tenant no puede tener más de una clínica.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clinics_one_per_tenant on public.clinics;
create trigger trg_clinics_one_per_tenant
  before insert or update of tenant_id on public.clinics
  for each row
  execute function public.enforce_one_clinic_per_tenant();
