import { resolveDemoFileUrl } from '@/lib/demoFiles';
import type { Dentist } from '@/types/demo';

export type AgendaDentistColumn = {
  id: string;
  fullName: string;
  visibleTitle?: string;
  photoUrl?: string | null;
  agendaColor?: string;
  initials: string;
};

export function dentistInitials(name: string): string {
  return name
    .replace(/^(dr\.?|dra\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function resolveDentistPhotoUrl(dentist: Pick<Dentist, 'photoRef'> | undefined | null): string | null {
  if (!dentist?.photoRef) return null;
  return resolveDemoFileUrl(dentist.photoRef);
}

export function toAgendaDentistColumn(d: Dentist): AgendaDentistColumn {
  return {
    id: d.id,
    fullName: d.fullName,
    visibleTitle: d.visibleTitle,
    photoUrl: resolveDentistPhotoUrl(d),
    agendaColor: d.agendaColor ?? '#14b8a6',
    initials: dentistInitials(d.fullName)
  };
}

export function toAgendaDentistColumns(dentists: Dentist[]): AgendaDentistColumn[] {
  return dentists.map(toAgendaDentistColumn);
}
