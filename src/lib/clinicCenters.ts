import type { AssignedCenter } from '@/lib/services/clinicSwitch';
import { STORAGE_ACTIVE_CLINIC_ID, STORAGE_TENANT_ID } from '@/lib/storage/keys';
import { setActiveClinicId } from '@/lib/activeClinic';

export type AssignedCentersPayload = {
  centers: AssignedCenter[];
  allClinicsAccess: boolean;
};

export async function fetchAssignedCenters(): Promise<AssignedCentersPayload> {
  const res = await fetch('/api/clinic/assigned-centers', { credentials: 'include', cache: 'no-store' });
  if (!res.ok) return { centers: [], allClinicsAccess: false };
  const json = (await res.json()) as { data?: { centers?: AssignedCenter[]; allClinicsAccess?: boolean } };
  return {
    centers: json.data?.centers ?? [],
    allClinicsAccess: Boolean(json.data?.allClinicsAccess)
  };
}

export async function switchClinicCenter(clinicId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch('/api/auth/switch-clinic', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ clinicId })
  });
  const json = (await res.json()) as {
    data?: { clinicId?: string; tenantId?: string };
    error?: { message?: string };
  };
  if (!res.ok) {
    return { ok: false, message: json.error?.message ?? 'No se pudo cambiar de centro.' };
  }
  if (json.data?.tenantId) localStorage.setItem(STORAGE_TENANT_ID, json.data.tenantId);
  if (json.data?.clinicId) setActiveClinicId(json.data.clinicId);
  return { ok: true };
}

/** Refresca df_admin_gate antes de navegar al panel (login, centro, portal). */
export async function ensureAdminAccessBeforeRedirect(dest: string) {
  if (!dest.startsWith('/admin')) return;
  try {
    await fetch('/api/auth/ensure-admin-access', { method: 'POST', credentials: 'include' });
  } catch {
    /* sesión clínica válida basta para el middleware */
  }
}

export async function resolvePublicEnter(): Promise<void> {
  const res = await fetch('/api/auth/enter-destination', { credentials: 'include' });
  if (!res.ok) {
    window.location.href = '/login';
    return;
  }
  const json = (await res.json()) as { data?: { redirect?: string } };
  const dest = json.data?.redirect ?? '/login';
  await ensureAdminAccessBeforeRedirect(dest);
  window.location.href = dest;
}
