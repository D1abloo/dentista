import { addMinutes } from 'date-fns';
import { appointments, dentists, treatments } from '../data';
import { invalidateCache } from '../cache';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '../supabaseServer';
import type { Appointment, AppointmentStatus } from '../types';
import type { AppointmentActionInput, AppointmentInput } from '../validators';

const demoAppointments = appointments.map((appointment) => ({ ...appointment }));

export async function listAppointments(clinicId: string): Promise<Appointment[]> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return demoAppointments.filter((item) => item.clinicId === clinicId);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('appointments_view')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    clinicId: row.clinic_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    dentistId: row.dentist_id,
    dentistName: row.dentist_name,
    treatmentId: row.treatment_id,
    treatmentName: row.treatment_name,
    roomName: row.room_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    notes: row.notes ?? undefined
  }));
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const treatment = treatments.find((item) => item.id === input.treatmentId) ?? treatments[0];
    const dentist = dentists.find((item) => item.id === input.dentistId) ?? dentists[0];
    const startsAt = new Date(input.startsAt);
    const endsAt = addMinutes(startsAt, treatment.durationMinutes).toISOString();
    const appointment: Appointment = {
      id: `demo-${Date.now()}`,
      clinicId: input.clinicId,
      patientId: input.patientId,
      patientName: input.patientName,
      dentistId: input.dentistId,
      dentistName: dentist.name,
      treatmentId: input.treatmentId,
      treatmentName: treatment.name,
      roomName: input.roomName,
      startsAt: input.startsAt,
      endsAt,
      status: 'pending',
      notes: input.notes
    };
    demoAppointments.unshift(appointment);
    await invalidateCache(`clinic:${input.clinicId}:`);
    return appointment;
  }

  const supabase = getSupabaseAdmin();
  const [{ data: treatment, error: treatmentError }, { data: dentist, error: dentistError }] = await Promise.all([
    supabase
      .from('treatments')
      .select('id, clinic_id, name, duration_minutes')
      .eq('clinic_id', input.clinicId)
      .eq('id', input.treatmentId)
      .eq('active', true)
      .single(),
    supabase
      .from('dentists')
      .select('id, clinic_id, name, active')
      .eq('clinic_id', input.clinicId)
      .eq('id', input.dentistId)
      .eq('active', true)
      .single()
  ]);

  if (treatmentError || !treatment) throw treatmentError ?? new Error('Tratamiento no encontrado para esta clínica.');
  if (dentistError || !dentist) throw dentistError ?? new Error('Dentista no encontrado para esta clínica.');

  const startsAt = new Date(input.startsAt);
  const endsAt = addMinutes(startsAt, treatment.duration_minutes).toISOString();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: input.clinicId,
      patient_id: input.patientId,
      dentist_id: input.dentistId,
      treatment_id: input.treatmentId,
      room_name: input.roomName,
      starts_at: input.startsAt,
      ends_at: endsAt,
      status: 'pending',
      notes: input.notes ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  await invalidateCache(`clinic:${input.clinicId}:`);

  return {
    id: data.id,
    clinicId: data.clinic_id,
    patientId: input.patientId,
    patientName: input.patientName,
    dentistId: input.dentistId,
    dentistName: dentist.name,
    treatmentId: input.treatmentId,
    treatmentName: treatment.name,
    roomName: data.room_name,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    status: data.status,
    notes: data.notes ?? undefined
  };
}

export async function updateAppointment(input: AppointmentActionInput): Promise<Appointment> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const index = demoAppointments.findIndex((item) => item.id === input.appointmentId && item.clinicId === input.clinicId);
    if (index === -1) throw new Error('Cita no encontrada.');

    const appointment = { ...demoAppointments[index] };
    if (input.action === 'reschedule') {
      const treatment = treatments.find((item) => item.id === appointment.treatmentId) ?? treatments[0];
      appointment.startsAt = input.startsAt ?? appointment.startsAt;
      appointment.endsAt = addMinutes(new Date(appointment.startsAt), treatment.durationMinutes).toISOString();
      appointment.status = 'pending';
    } else {
      const statusMap: Record<Exclude<AppointmentActionInput['action'], 'reschedule'>, AppointmentStatus> = {
        confirm: 'confirmed',
        complete: 'completed',
        cancel: 'cancelled',
        no_show: 'no_show'
      };
      appointment.status = statusMap[input.action];
    }

    appointment.roomName = input.roomName ?? appointment.roomName;
    appointment.notes = input.notes ?? appointment.notes;
    demoAppointments[index] = appointment;
    await invalidateCache(`clinic:${input.clinicId}:`);
    return appointment;
  }

  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    notes: input.notes ?? null
  };

  if (input.roomName) updatePayload.room_name = input.roomName;

  if (input.action === 'reschedule') {
    const { data: current, error: currentError } = await supabase
      .from('appointments')
      .select('id, treatment_id')
      .eq('clinic_id', input.clinicId)
      .eq('id', input.appointmentId)
      .single();
    if (currentError || !current) throw currentError ?? new Error('Cita no encontrada.');

    const { data: treatment, error: treatmentError } = await supabase
      .from('treatments')
      .select('duration_minutes')
      .eq('clinic_id', input.clinicId)
      .eq('id', current.treatment_id)
      .single();
    if (treatmentError || !treatment) throw treatmentError ?? new Error('Tratamiento no encontrado.');

    updatePayload.starts_at = input.startsAt;
    updatePayload.ends_at = addMinutes(new Date(input.startsAt ?? ''), treatment.duration_minutes).toISOString();
    updatePayload.status = 'pending';
  } else {
    const statusMap: Record<Exclude<AppointmentActionInput['action'], 'reschedule'>, AppointmentStatus> = {
      confirm: 'confirmed',
      complete: 'completed',
      cancel: 'cancelled',
      no_show: 'no_show'
    };
    updatePayload.status = statusMap[input.action];
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('clinic_id', input.clinicId)
    .eq('id', input.appointmentId)
    .select('*')
    .single();
  if (error) throw error;

  await invalidateCache(`clinic:${input.clinicId}:`);
  const [appointment] = await listAppointments(input.clinicId);
  return appointment.id === data.id ? appointment : {
    id: data.id,
    clinicId: data.clinic_id,
    patientId: data.patient_id,
    patientName: 'Paciente',
    dentistId: data.dentist_id,
    dentistName: 'Odontólogo',
    treatmentId: data.treatment_id,
    treatmentName: 'Tratamiento',
    roomName: data.room_name,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    status: data.status,
    notes: data.notes ?? undefined
  };
}
