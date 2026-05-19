-- Seed demo DentalFlow
with clinic as (
  insert into public.clinics (name, slug, timezone, phone, email, address)
  values ('DentalFlow Madrid Centro', 'dentalflow-madrid', 'Europe/Madrid', '+34 900 111 222', 'hola@dentalflow.local', 'Calle Sonrisa 24, Madrid')
  on conflict (slug) do update set name = excluded.name
  returning id
), profiles_seed as (
  insert into public.profiles (clinic_id, role, full_name, email, phone)
  select id, 'patient', 'María González', 'maria@example.com', '+34 600 111 222' from clinic
  union all select id, 'admin', 'Dr. Admin', 'admin@clinic.local', '+34 600 000 000' from clinic
  on conflict (clinic_id, email) do update set full_name = excluded.full_name
  returning id, clinic_id, full_name, email
), dentists_seed as (
  insert into public.dentists (clinic_id, name, specialty, rating, reviews_count)
  select id, 'Dra. Laura Sánchez', 'Ortodoncia', 4.9, 126 from clinic
  union all select id, 'Dr. Carlos Ramírez', 'Implantología', 4.8, 98 from clinic
  union all select id, 'Dra. Ana Torres', 'Estética Dental', 4.9, 74 from clinic
  returning id, clinic_id, name
), treatments_seed as (
  insert into public.treatments (clinic_id, name, category, description, duration_minutes, price_cents)
  select id, 'Limpieza Dental', 'Preventiva', 'Profilaxis completa y pulido.', 45, 80000 from clinic
  union all select id, 'Blanqueamiento', 'Estética', 'Blanqueamiento dental profesional.', 60, 250000 from clinic
  union all select id, 'Ortodoncia Invisible', 'Ortodoncia', 'Valoración de alineadores.', 30, 0 from clinic
  union all select id, 'Implante Dental', 'Cirugía', 'Evaluación de implante.', 90, 0 from clinic
  returning id, clinic_id, name
)
insert into public.rooms (clinic_id, name)
select id, 'Gabinete 1' from clinic
union all select id, 'Gabinete 2' from clinic
union all select id, 'Gabinete 3' from clinic
union all select id, 'Gabinete 4' from clinic
on conflict (clinic_id, name) do nothing;
