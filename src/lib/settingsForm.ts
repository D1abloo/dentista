import type { AppSettings } from '@/types/demo';

export const MSG_LIMIT = 200;

export const SETTINGS_TABS = [
  { id: 'general', label: 'General' },
  { id: 'marca', label: 'Marca' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'portal', label: 'Portal paciente' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'integraciones', label: 'Integraciones' },
  { id: 'backup', label: 'Copia de seguridad' },
  { id: 'avanzado', label: 'Avanzado' }
] as const;

export type SettingsTabId = (typeof SETTINGS_TABS)[number]['id'];

export const BRAND_PRESETS = [
  { id: 'teal', label: 'Teal', color: '#2d8b7d' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'purple', label: 'Purple', color: '#7c3aed' }
] as const;

export const WEEKDAYS = [
  { iso: 1, label: 'Lun' },
  { iso: 2, label: 'Mar' },
  { iso: 3, label: 'Mié' },
  { iso: 4, label: 'Jue' },
  { iso: 5, label: 'Vie' },
  { iso: 6, label: 'Sáb' },
  { iso: 7, label: 'Dom' }
] as const;

export const INTERVAL_OPTIONS = [10, 15, 20, 30, 45, 60];

export function settingsToForm(s: AppSettings): AppSettings {
  return {
    ...s,
    workDays: s.workDays?.length ? [...s.workDays] : [1, 2, 3, 4, 5],
    openTime: s.openTime ?? '08:30',
    closeTime: s.closeTime ?? '20:00',
    primaryColor: s.primaryColor ?? '#2d8b7d',
    vatRate: s.vatRate ?? 21,
    invoiceSeries: s.invoiceSeries ?? 'FAC',
    nif: s.nif ?? '',
    website: s.website ?? '',
    instagram: s.instagram ?? '',
    facebook: s.facebook ?? '',
    notificationPrefs: s.notificationPrefs
  };
}

export function validateSettings(form: AppSettings): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.clinicName?.trim()) errors.clinicName = 'El nombre de la clínica es obligatorio.';
  const phoneDigits = form.phone?.replace(/\D/g, '') ?? '';
  if (!phoneDigits || phoneDigits.length < 9) errors.phone = 'Introduce un teléfono válido.';
  if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'El email no es válido.';
  }
  if (!form.slotIntervalMinutes || form.slotIntervalMinutes <= 0) {
    errors.slotIntervalMinutes = 'El intervalo debe ser mayor que 0.';
  }
  if ((form.welcomeMessage?.length ?? 0) > MSG_LIMIT) errors.welcomeMessage = 'Has superado el límite de caracteres.';
  if ((form.appointmentConfirmMessage?.length ?? 0) > MSG_LIMIT) {
    errors.appointmentConfirmMessage = 'Has superado el límite de caracteres.';
  }
  return errors;
}

export function settingsSignature(form: AppSettings): string {
  return JSON.stringify(form);
}

export function maskPortalToken(raw = 'demo-portal-aB12xK9m'): string {
  const tail = raw.slice(-4);
  return `•••••••••• ${tail}`;
}
