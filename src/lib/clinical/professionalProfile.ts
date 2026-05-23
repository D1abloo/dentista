import type { Dentist } from '@/types/demo';
import { isCollegiateNumberValid } from '@/lib/clinical/dentistCollegiate';

export type ProfessionalFilter = 'all' | 'complete' | 'incomplete' | 'no-user' | 'with-collegiate';

export type ProfessionalProfileForm = {
  fullName: string;
  visibleTitle: string;
  collegiateNumber: string;
  professionalCollege: string;
  specialty: string;
  secondarySpecialties: string;
  email: string;
  phone: string;
  languages: string;
  reportBio: string;
  agendaColor: string;
  active: boolean;
};

export type ProfileCheckItem = {
  id: string;
  label: string;
  done: boolean;
  warn?: boolean;
};

export type ProfessionalKpis = {
  total: number;
  complete: number;
  missingCollegiate: number;
  withoutUser: number;
  withSignature: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{8,20}$/;

export function parseListInput(value: string): string[] {
  return value
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinListInput(values?: string[]): string {
  return (values ?? []).join(', ');
}

export function isValidProfessionalEmail(email: string): boolean {
  if (!email.trim()) return true;
  return EMAIL_RE.test(email.trim());
}

export function isValidProfessionalPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  return PHONE_RE.test(phone.trim());
}

export function dentistToForm(d: Dentist): ProfessionalProfileForm {
  return {
    fullName: d.fullName,
    visibleTitle: d.visibleTitle ?? '',
    collegiateNumber: d.collegiateNumber ?? '',
    professionalCollege: d.professionalCollege ?? '',
    specialty: d.specialty,
    secondarySpecialties: joinListInput(d.secondarySpecialties),
    email: d.email,
    phone: d.phone,
    languages: joinListInput(d.languages),
    reportBio: d.reportBio ?? '',
    agendaColor: d.agendaColor ?? '#14b8a6',
    active: d.active
  };
}

export function formToDentistPatch(form: ProfessionalProfileForm, base: Dentist): Dentist {
  return {
    ...base,
    fullName: form.fullName.trim(),
    visibleTitle: form.visibleTitle.trim() || undefined,
    collegiateNumber: form.collegiateNumber.trim() || undefined,
    professionalCollege: form.professionalCollege.trim() || undefined,
    specialty: form.specialty.trim() || 'Odontología general',
    secondarySpecialties: parseListInput(form.secondarySpecialties),
    email: form.email.trim(),
    phone: form.phone.trim(),
    languages: parseListInput(form.languages),
    reportBio: form.reportBio.trim() || undefined,
    agendaColor: form.agendaColor.trim() || '#14b8a6',
    active: form.active,
    updatedAt: new Date().toISOString()
  };
}

export function profileChecklist(d: Dentist): ProfileCheckItem[] {
  return [
    { id: 'name', label: 'Nombre completo', done: Boolean(d.fullName?.trim()) },
    { id: 'specialty', label: 'Especialidad', done: Boolean(d.specialty?.trim()) },
    {
      id: 'collegiate',
      label: 'Nº colegiado',
      done: isCollegiateNumberValid(d.collegiateNumber),
      warn: !isCollegiateNumberValid(d.collegiateNumber)
    },
    { id: 'user', label: 'Usuario vinculado', done: Boolean(d.profileId) },
    { id: 'signature', label: 'Firma profesional', done: Boolean(d.signatureRef) },
    {
      id: 'email',
      label: 'Email profesional',
      done: Boolean(d.email?.trim()) && isValidProfessionalEmail(d.email)
    }
  ];
}

export function profileCompletionPercent(d: Dentist): number {
  const items = profileChecklist(d);
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export function isProfileComplete(d: Dentist): boolean {
  return profileCompletionPercent(d) >= 100;
}

export function profileReadyForReports(d: Dentist): boolean {
  return (
    Boolean(d.fullName?.trim()) &&
    Boolean(d.specialty?.trim()) &&
    isCollegiateNumberValid(d.collegiateNumber) &&
    d.active
  );
}

export function computeProfessionalKpis(dentists: Dentist[]): ProfessionalKpis {
  return {
    total: dentists.length,
    complete: dentists.filter(isProfileComplete).length,
    missingCollegiate: dentists.filter((d) => !isCollegiateNumberValid(d.collegiateNumber)).length,
    withoutUser: dentists.filter((d) => !d.profileId).length,
    withSignature: dentists.filter((d) => Boolean(d.signatureRef)).length
  };
}

export function matchesProfessionalFilter(d: Dentist, filter: ProfessionalFilter): boolean {
  switch (filter) {
    case 'complete':
      return isProfileComplete(d);
    case 'incomplete':
      return !isProfileComplete(d);
    case 'no-user':
      return !d.profileId;
    case 'with-collegiate':
      return isCollegiateNumberValid(d.collegiateNumber);
    default:
      return true;
  }
}

export function filterProfessionals(
  dentists: Dentist[],
  query: string,
  filter: ProfessionalFilter
): Dentist[] {
  const q = query.trim().toLowerCase();
  return dentists.filter((d) => {
    if (!matchesProfessionalFilter(d, filter)) return false;
    if (!q) return true;
    return (
      d.fullName.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      (d.collegiateNumber ?? '').toLowerCase().includes(q)
    );
  });
}

export function validateProfessionalForm(
  form: ProfessionalProfileForm,
  opts?: { requireCollegiate?: boolean }
): string | null {
  if (!form.fullName.trim()) return 'El nombre completo es obligatorio.';
  if (!form.specialty.trim()) return 'La especialidad es obligatoria.';
  if (!isValidProfessionalEmail(form.email)) return 'Introduce un email válido.';
  if (!isValidProfessionalPhone(form.phone)) return 'Introduce un teléfono válido.';
  if (opts?.requireCollegiate && !isCollegiateNumberValid(form.collegiateNumber)) {
    return 'El nº de colegiado es obligatorio para firmar informes.';
  }
  return null;
}

export function professionalBadges(d: Dentist): { id: string; label: string; tone: 'ok' | 'warn' | 'muted' }[] {
  const badges: { id: string; label: string; tone: 'ok' | 'warn' | 'muted' }[] = [];
  if (isProfileComplete(d)) badges.push({ id: 'complete', label: 'Completo', tone: 'ok' });
  if (!isCollegiateNumberValid(d.collegiateNumber)) {
    badges.push({ id: 'collegiate', label: 'Falta nº colegiado', tone: 'warn' });
  }
  if (!d.profileId) badges.push({ id: 'user', label: 'Sin usuario', tone: 'muted' });
  if (d.signatureRef) badges.push({ id: 'signature', label: 'Con firma', tone: 'ok' });
  return badges;
}
