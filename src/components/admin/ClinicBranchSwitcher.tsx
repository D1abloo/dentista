import { MapPin } from 'lucide-react';
import { getStoredTenantId } from '@/lib/demoStore';
import { isClientLiveMode } from '@/lib/appMode';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useStaffContext } from '@/hooks/useStaffContext';

export function ClinicBranchSwitcher() {
  const { state, refresh } = useDemoStore();
  const { staff } = useStaffContext();
  const tenantId = getStoredTenantId();
  const tenantBranches = state.clinics.filter((c) => c.tenantId === tenantId);
  const branches =
    staff?.assignedClinicIds?.length
      ? tenantBranches.filter((c) => staff.assignedClinicIds.includes(c.id))
      : tenantBranches;
  if (branches.length < 2) return null;

  const { clinicId: activeId, setClinicId } = useActiveClinic(tenantId, branches);

  function onChange(clinicId: string) {
    setClinicId(clinicId);
    if (isClientLiveMode()) void refresh();
    else window.location.reload();
  }

  return (
    <label className="tenant-switch clinic-branch-switch">
      <span className="tenant-switch__label">
        <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Sede activa
      </span>
      <select
        className="tenant-switch__select field-control"
        value={activeId}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Seleccionar sede de la organización"
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
            {b.isMainBranch ? ' (principal)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
