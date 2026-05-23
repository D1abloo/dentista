import type { DemoState, Patient, ReminderChannel } from '@/types/demo';
import { effectiveConsentStatus } from '@/lib/demoStore';
import { email, phone, required } from '@/lib/validation';
import { fmtDate } from '@/lib/format';

export type ProfileTab = 'personal' | 'contact' | 'health' | 'preferences' | 'consents' | 'security';

export type ProfileFormErrors = Partial<Record<string, string>>;

export function patientInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function displayNhc(nhc?: string): string {
  if (!nhc) return '—';
  const n = nhc.replace(/\D/g, '');
  if (n.length <= 4) return `NHC ${n.padStart(4, '0')}`;
  return `NHC ${nhc}`;
}

export function clinicNameForPatient(state: DemoState, clinicId?: string): string {
  return state.clinics.find((c) => c.id === clinicId)?.name ?? 'Clínica';
}

export function computeProfileCompleteness(p: Patient): number {
  const checks = [
    Boolean(p.fullName?.trim()),
    Boolean(p.dni?.trim()),
    Boolean(p.birthDate),
    Boolean(p.preferredClinicId),
    Boolean(p.email?.trim()),
    Boolean(p.phone?.trim()),
    Boolean(p.address?.trim()),
    Boolean(p.city?.trim()),
    Boolean(p.postalCode?.trim()),
    Boolean(p.allergies?.trim()),
    Boolean(p.medication?.trim()),
    Boolean(p.emergencyContactName?.trim()),
    Boolean(p.emergencyContactPhone?.trim()),
    (p.reminderChannels?.length ?? 0) > 0
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function formatLastProfileUpdate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso.length > 10 ? iso : `${iso}T12:00:00`);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `Hoy, ${time}`;
  }
  return fmtDate(iso.slice(0, 10));
}

export function consentSummaryForPatient(state: DemoState, patientId: string) {
  const list = state.informedConsents.filter((c) => c.patientId === patientId);
  const signed = list.filter((c) => c.status === 'firmado').length;
  const pending = list.filter((c) => effectiveConsentStatus(c) === 'pendiente').length;
  const dates = list.flatMap((c) => [c.signedAt?.slice(0, 10), c.createdAt].filter(Boolean) as string[]);
  dates.sort((a, b) => b.localeCompare(a));
  return {
    signed,
    pending,
    last: dates[0] ? fmtDate(dates[0]) : '—'
  };
}

export function validateProfileForm(form: Patient): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  const nameErr = required(form.fullName, 'El nombre');
  if (nameErr) errors.fullName = 'El nombre es obligatorio.';
  const emailErr = email(form.email);
  if (emailErr) errors.email = emailErr === 'El email es obligatorio.' ? 'Introduce un email válido.' : emailErr;
  if (form.phone?.trim()) {
    const phoneErr = phone(form.phone);
    if (phoneErr && phoneErr !== 'El teléfono es obligatorio.') errors.phone = 'Introduce un teléfono válido.';
  }
  if (form.birthDate) {
    const d = new Date(form.birthDate);
    if (Number.isNaN(d.getTime()) || d > new Date()) errors.birthDate = 'La fecha de nacimiento no es válida.';
  }
  return errors;
}

export function profileSnapshot(p: Patient): string {
  return JSON.stringify({
    fullName: p.fullName,
    dni: p.dni ?? '',
    birthDate: p.birthDate ?? '',
    preferredClinicId: p.preferredClinicId ?? '',
    email: p.email,
    phone: p.phone,
    address: p.address ?? '',
    city: p.city ?? '',
    postalCode: p.postalCode ?? '',
    allergies: p.allergies ?? '',
    medication: p.medication ?? '',
    emergencyContactName: p.emergencyContactName ?? '',
    emergencyContactPhone: p.emergencyContactPhone ?? '',
    notes: p.notes ?? '',
    reminderChannels: [...(p.reminderChannels ?? [])].sort()
  });
}

export function reminderChannelActive(channels: ReminderChannel[] | undefined, ch: ReminderChannel) {
  return (channels ?? []).includes(ch);
}

export function toggleReminderChannel(channels: ReminderChannel[] | undefined, ch: ReminderChannel): ReminderChannel[] {
  const list = channels ?? [];
  return list.includes(ch) ? list.filter((c) => c !== ch) : [...list, ch];
}

export const NOTES_MAX = 500;

export function formatLastAccess(): string {
  const now = new Date();
  return `Hoy, ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
}
