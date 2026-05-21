import { useState } from 'react';
import { ExternalLink, LayoutDashboard, UserRound } from 'lucide-react';
import { useNotice } from '@/hooks/useNotice';
import { usePortalAccess } from '@/hooks/usePortalAccess';
import { useStaffContext } from '@/hooks/useStaffContext';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';

export function AdminQuickAccess() {
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const { staff, loading: staffLoading } = useStaffContext();
  const [busy, setBusy] = useState<'pdp' | null>(null);

  const portalBlocked = Boolean(
    !staffLoading && staff && staff.role === 'dentist' && !staff.hasLinkedDentist
  );

  async function enterPatientPortal() {
    if (portalBlocked) {
      setNotice({
        type: 'error',
        message: 'Tu usuario no tiene perfil de dentista vinculado. Pide asociación en Usuarios de clínica.'
      });
      return;
    }
    if (portalAccess.active) {
      window.location.href = '/paciente';
      return;
    }
    setBusy('pdp');
    try {
      const res = await fetch('/api/admin/portal-access/enter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const json = (await res.json()) as {
        data?: { redirectTo?: string; patientId?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo abrir el portal del paciente.');
      if (json.data?.patientId) {
        localStorage.setItem(STORAGE_PATIENT_ID, json.data.patientId);
      }
      window.location.href = json.data?.redirectTo ?? '/paciente';
    } catch (e) {
      setNotice({
        type: 'error',
        message: e instanceof Error ? e.message : 'Error al acceder al portal del paciente.'
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-quick-access" role="navigation" aria-label="Accesos rápidos">
      <a href="/admin" className="admin-quick-access__btn">
        <LayoutDashboard className="h-4 w-4" aria-hidden />
        <span>Panel admin</span>
      </a>
      <button
        type="button"
        className="admin-quick-access__btn admin-quick-access__btn--primary"
        disabled={busy === 'pdp' || portalBlocked}
        onClick={() => void enterPatientPortal()}
      >
        <UserRound className="h-4 w-4" aria-hidden />
        <span>{busy === 'pdp' ? 'Abriendo…' : 'Portal paciente'}</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </button>
    </div>
  );
}
