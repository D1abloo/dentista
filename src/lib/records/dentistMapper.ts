import type { Dentist } from '@/types/demo';
import { profileCompletionPercent } from '@/lib/clinical/professionalProfile';

export type DentistRow = {
  id: string;
  clinic_id: string;
  tenant_id?: string | null;
  profile_id?: string | null;
  name: string;
  specialty: string;
  collegiate_number?: string | null;
  visible_title?: string | null;
  professional_college?: string | null;
  secondary_specialties?: string[] | null;
  languages?: string[] | null;
  report_bio?: string | null;
  agenda_color?: string | null;
  photo_url?: string | null;
  signature_url?: string | null;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  profile_completion?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function mapDentistRow(row: DentistRow, tenantId: string): Dentist {
  const dentist: Dentist = {
    id: row.id,
    clinicId: row.clinic_id,
    profileId: row.profile_id ?? undefined,
    tenantId,
    fullName: row.name,
    specialty: row.specialty,
    visibleTitle: row.visible_title ?? undefined,
    collegiateNumber: row.collegiate_number ?? undefined,
    professionalCollege: row.professional_college ?? undefined,
    secondarySpecialties: row.secondary_specialties ?? [],
    languages: row.languages ?? [],
    reportBio: row.report_bio ?? undefined,
    agendaColor: row.agenda_color ?? '#14b8a6',
    photoRef: row.photo_url ?? undefined,
    signatureRef: row.signature_url ?? undefined,
    email: row.email?.trim() || '',
    phone: row.phone?.trim() || '',
    schedule: 'Lun–Vie 09:00–17:00',
    active: row.active,
    updatedAt: row.updated_at ?? undefined
  };
  dentist.profileCompletion = row.profile_completion ?? profileCompletionPercent(dentist);
  return dentist;
}

export function dentistToRowPatch(d: Dentist, tenantId: string): Record<string, unknown> {
  return {
    tenant_id: tenantId,
    name: d.fullName.trim(),
    specialty: d.specialty.trim(),
    visible_title: d.visibleTitle?.trim() || null,
    collegiate_number: d.collegiateNumber?.trim() || null,
    professional_college: d.professionalCollege?.trim() || null,
    secondary_specialties: d.secondarySpecialties ?? [],
    languages: d.languages ?? [],
    report_bio: d.reportBio?.trim() || null,
    agenda_color: d.agendaColor ?? '#14b8a6',
    photo_url: d.photoRef ?? null,
    signature_url: d.signatureRef ?? null,
    email: d.email?.trim() || null,
    phone: d.phone?.trim() || null,
    active: d.active,
    profile_completion: profileCompletionPercent(d),
    updated_at: new Date().toISOString()
  };
}
