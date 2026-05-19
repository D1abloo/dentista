import type { Appointment, AppointmentStatus } from '@/types/demo';

export const statusLabels: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
  reprogramada: 'Reprogramada'
};

export const statusStyles: Record<AppointmentStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-100',
  confirmada: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  completada: 'bg-blue-50 text-blue-700 ring-blue-100',
  cancelada: 'bg-rose-50 text-rose-700 ring-rose-100',
  no_asistio: 'bg-slate-100 text-slate-700 ring-slate-200',
  reprogramada: 'bg-cyan-50 text-cyan-700 ring-cyan-100'
};

export function isFutureAppointment(appointment: Appointment) {
  return !['completada', 'cancelada', 'no_asistio'].includes(appointment.status);
}

export function activeAppointment(appointment: Appointment) {
  return !['cancelada', 'completada', 'no_asistio'].includes(appointment.status);
}

export const interactiveCard = 'transition duration-300 motion-safe:hover:-translate-y-1 hover:shadow-premium hover:ring-dental-100';
