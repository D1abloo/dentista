import { getAdminEntrySlug } from '@/lib/auth/adminPanelGate';

/** Ruta de entrada al panel (solo para emails/API; no enlazar en UI pública). */
export function adminPanelEntryPath(): string {
  return `/entrada/${getAdminEntrySlug()}`;
}
