import { MapPin } from 'lucide-react';
import { getActiveClinicId, setActiveClinicId } from '@/lib/activeClinic';
import { getStoredTenantId } from '@/lib/demoStore';
import { isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';

export function ClinicBranchSwitcher() {
  const { state, refresh } = useDemoStore();
  const tenantId = getStoredTenantId();
  const branches = state.clinics.filter((c) => c.tenantId === tenantId);
  if (branches.length < 2) return null;

  const activeId = getActiveClinicId(state, tenantId);

  function onChange(clinicId: string) {
    setActiveClinicId(clinicId);
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
