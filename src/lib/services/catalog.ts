import { addMinutes, formatISO, parseISO } from 'date-fns';
import { adminModules, availabilitySlots, clinicLocations, dentists, integrations, patients, rolePermissions, rooms, systemLogs, treatments } from '../data';
import { getCached, invalidateCache } from '../cache';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '../supabaseServer';
import type { AdminModule, AvailabilitySlot, ClinicLocation, Dentist, Integration, Patient, RolePermission, Room, SystemLog, Treatment } from '../types';
import type { AvailabilityQuery, PatientQuery } from '../validators';

const ttl = () => Number(import.meta.env.CACHE_TTL_SECONDS ?? 60);

export async function createTreatmentRecord(input: {
  clinicId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  active?: boolean;
}): Promise<Treatment> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const row: Treatment = {
      id: `t-${Date.now()}`,
      clinicId: input.clinicId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      category: 'general',
      color: 'sky',
      description: input.description ?? ''
    };
    treatments.push(row);
    return row;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('treatments')
    .insert({
      clinic_id: input.clinicId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      duration_minutes: input.durationMinutes,
      price_cents: input.priceCents,
      active: input.active ?? true
    })
    .select('id, clinic_id, name, duration_minutes, price_cents, category, description')
    .single();

  if (error) throw error;
  await invalidateCache(`clinic:${input.clinicId}:`);

  return {
    id: data.id,
    clinicId: data.clinic_id,
    name: data.name,
    durationMinutes: data.duration_minutes,
    priceCents: data.price_cents,
    category: data.category,
    color: 'sky',
    description: data.description ?? ''
  };
}

export async function listTreatments(clinicId: string): Promise<Treatment[]> {
  return getCached(`clinic:${clinicId}:treatments`, ttl(), async () => {
    if (isDemoMode() || !hasSupabaseConfig()) return treatments.filter((item) => item.clinicId === clinicId);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('treatments')
      .select('id, clinic_id, name, duration_minutes, price_cents, category, description')
      .eq('clinic_id', clinicId)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      durationMinutes: row.duration_minutes,
      priceCents: row.price_cents,
      category: row.category,
      color: 'sky',
      description: row.description ?? ''
    }));
  });
}

export async function listDentists(clinicId: string): Promise<Dentist[]> {
  return getCached(`clinic:${clinicId}:dentists`, ttl(), async () => {
    if (isDemoMode() || !hasSupabaseConfig()) return dentists.filter((item) => item.clinicId === clinicId);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dentists')
      .select('id, clinic_id, name, specialty, rating, reviews_count, active')
      .eq('clinic_id', clinicId)
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      specialty: row.specialty,
      rating: Number(row.rating),
      reviews: row.reviews_count,
      avatar: row.name.split(' ').slice(0, 2).map((part: string) => part[0]).join('').toUpperCase(),
      nextAvailable: 'Consultar disponibilidad',
      active: row.active
    }));
  });
}

export async function listRooms(clinicId: string): Promise<Room[]> {
  if (isDemoMode() || !hasSupabaseConfig()) return rooms.filter((item) => item.clinicId === clinicId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('rooms').select('id, clinic_id, name, active').eq('clinic_id', clinicId).order('name');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    equipment: row.active ? 'Equipo activo' : 'Sin equipamiento activo',
    status: row.active ? 'available' : 'maintenance'
  }));
}

export async function listLocations(clinicId: string): Promise<ClinicLocation[]> {
  return getCached(`clinic:${clinicId}:locations`, ttl(), async () => {
    if (isDemoMode() || !hasSupabaseConfig()) return clinicLocations.filter((item) => item.clinicId === clinicId);

    const rooms = await listRooms(clinicId);
    return rooms.map((room, index) => ({
      id: room.id,
      clinicId,
      name: `Clínica ${index + 1}`,
      shortName: (['Centro', 'Norte', 'Sur'][index] ?? 'Centro') as ClinicLocation['shortName'],
      address: 'Configura la dirección en ajustes de clínica',
      phone: 'Configura el teléfono en ajustes de clínica',
      openingHours: 'Configura el horario de atención',
      imageUrl: clinicLocations[index % clinicLocations.length].imageUrl,
      roomName: room.name
    }));
  });
}

export async function listPatients(input: PatientQuery): Promise<Patient[]> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const q = input.q.toLowerCase();
    return patients
      .filter((patient) => patient.clinicId === input.clinicId)
      .filter((patient) => !input.dentistId || (patient as { primaryDentistId?: string }).primaryDentistId === input.dentistId)
      .filter((patient) => !q || patient.name.toLowerCase().includes(q) || patient.email.toLowerCase().includes(q));
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('profiles')
    .select('id, clinic_id, full_name, email, phone')
    .eq('clinic_id', input.clinicId)
    .eq('role', 'patient')
    .order('full_name');

  if (input.q) query = query.or(`full_name.ilike.%${input.q}%,email.ilike.%${input.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    clinicId: row.clinic_id,
    name: row.full_name,
    email: row.email,
    phone: row.phone ?? '',
    status: 'active',
    outstandingBalanceCents: 0
  }));
}

export async function listAvailability(input: AvailabilityQuery): Promise<AvailabilitySlot[]> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return availabilitySlots
      .filter((slot) => slot.clinicId === input.clinicId)
      .filter((slot) => slot.startsAt.startsWith(input.date))
      .filter((slot) => !input.dentistId || slot.dentistId === input.dentistId)
      .filter((slot) => !input.treatmentId || !slot.treatmentId || slot.treatmentId === input.treatmentId);
  }

  const supabase = getSupabaseAdmin();
  const weekday = new Date(`${input.date}T12:00:00+02:00`).getDay();
  let query = supabase
    .from('availability_rules')
    .select('id, clinic_id, dentist_id, starts_at, ends_at, slot_minutes')
    .eq('clinic_id', input.clinicId)
    .eq('weekday', weekday)
    .eq('active', true);

  if (input.dentistId) query = query.eq('dentist_id', input.dentistId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).flatMap((rule) => {
    const generated: AvailabilitySlot[] = [];
    let cursor = parseISO(`${input.date}T${rule.starts_at}+02:00`);
    const end = parseISO(`${input.date}T${rule.ends_at}+02:00`);
    while (addMinutes(cursor, rule.slot_minutes) <= end) {
      const slotEnd = addMinutes(cursor, rule.slot_minutes);
      generated.push({
        id: `${rule.id}-${formatISO(cursor)}`,
        clinicId: rule.clinic_id,
        dentistId: rule.dentist_id ?? input.dentistId ?? 'any',
        treatmentId: input.treatmentId,
        roomName: 'Asignación automática',
        startsAt: formatISO(cursor),
        endsAt: formatISO(slotEnd),
        available: true
      });
      cursor = slotEnd;
    }
    return generated;
  });
}

export function listAdminModules(clinicId: string): AdminModule[] {
  void clinicId;
  return adminModules;
}

export function listSystemLogs(clinicId: string): SystemLog[] {
  return systemLogs.filter((item) => item.clinicId === clinicId);
}

export function listRolePermissions(clinicId: string): RolePermission[] {
  return rolePermissions.filter((item) => item.clinicId === clinicId);
}

export function listIntegrations(clinicId: string): Integration[] {
  return integrations.filter((item) => item.clinicId === clinicId);
}
