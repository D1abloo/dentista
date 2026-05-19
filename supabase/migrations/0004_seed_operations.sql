-- Seed demo de módulos operativos. No incluye secretos reales ni credenciales de proveedores.

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
), first_dentist as (
  select id, clinic_id from public.dentists where clinic_id = (select id from clinic) order by created_at limit 1
), first_room as (
  select id, clinic_id from public.rooms where clinic_id = (select id from clinic) order by created_at limit 1
), first_patient as (
  select id, clinic_id from public.profiles where clinic_id = (select id from clinic) and role = 'patient' order by created_at limit 1
)
insert into public.availability_rules (clinic_id, dentist_id, room_id, weekday, starts_at, ends_at, slot_minutes)
select clinic.id, first_dentist.id, first_room.id, weekday.value, '09:00'::time, '14:00'::time, 30
from clinic, first_dentist, first_room, (values (1), (2), (3), (4), (5)) as weekday(value)
on conflict do nothing;

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
), first_patient as (
  select id, clinic_id from public.profiles where clinic_id = (select id from clinic) and role = 'patient' order by created_at limit 1
), first_dentist as (
  select id, clinic_id from public.dentists where clinic_id = (select id from clinic) order by created_at limit 1
)
insert into public.reviews (clinic_id, patient_id, dentist_id, rating, comment, source, published)
select clinic.id, first_patient.id, first_dentist.id, 5, 'Proceso rápido y trato excelente.', 'Google', true
from clinic, first_patient, first_dentist
on conflict do nothing;

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
)
insert into public.campaigns (clinic_id, name, channel, audience, status, scheduled_at)
select id, 'Recall limpiezas semestrales', 'whatsapp', 'Pacientes activos', 'scheduled', '2026-05-21T09:00:00+02:00'::timestamptz from clinic
union all select id, 'Promoción blanqueamiento mayo', 'email', 'Interesados estética', 'draft', '2026-05-22T10:00:00+02:00'::timestamptz from clinic
on conflict do nothing;

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
)
insert into public.role_permissions (clinic_id, role, permission, enabled)
select id, 'owner', 'admin:*', true from clinic
union all select id, 'admin', 'clinic:manage', true from clinic
union all select id, 'receptionist', 'appointments:write', true from clinic
union all select id, 'dentist', 'clinical_notes:write', true from clinic
union all select id, 'patient', 'portal:read', true from clinic
on conflict (clinic_id, role, permission) do update set enabled = excluded.enabled;

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
)
insert into public.integrations (clinic_id, provider, category, status, config)
select id, 'Supabase', 'storage', 'mock', '{"mode":"demo"}'::jsonb from clinic
union all select id, 'Redis', 'analytics', 'mock', '{"fallback":"memory"}'::jsonb from clinic
union all select id, 'WhatsApp Business', 'notifications', 'mock', '{"provider":"mock"}'::jsonb from clinic
union all select id, 'Stripe', 'payments', 'disabled', '{}'::jsonb from clinic
on conflict (clinic_id, provider) do update set status = excluded.status, config = excluded.config;

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
)
insert into public.clinic_settings (clinic_id, booking_policy, billing_policy, notification_policy)
select
  id,
  '{"min_notice_hours":4,"allow_patient_reschedule":true}'::jsonb,
  '{"currency":"EUR","payment_due_days":7}'::jsonb,
  '{"channels":["whatsapp","email"],"reminder_hours":[48,24]}'::jsonb
from clinic
on conflict (clinic_id) do update
set booking_policy = excluded.booking_policy,
    billing_policy = excluded.billing_policy,
    notification_policy = excluded.notification_policy,
    updated_at = now();

with clinic as (
  select id from public.clinics where slug = 'dentalflow-madrid' limit 1
)
insert into public.system_logs (clinic_id, level, source, message, metadata)
select id, 'info', 'seed', 'Módulos operativos demo preparados.', '{"migration":"0004_seed_operations"}'::jsonb from clinic
on conflict do nothing;
