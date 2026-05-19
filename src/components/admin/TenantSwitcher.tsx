import { useDemoStore } from '@/hooks/useDemoStore';
import { organizationDisplayName } from '@/lib/organization';
import { getStoredTenantId, setDemoSession } from '@/lib/demoStore';

export function TenantSwitcher() {
  const { state } = useDemoStore();
  const tenantId = getStoredTenantId();

  function onChange(nextId: string) {
    if (nextId === tenantId) return;
    setDemoSession({ role: 'admin', tenantId: nextId });
    window.location.href = '/admin';
  }

  return (
    <label className="tenant-switch">
      <span className="tenant-switch__label">Centro clínico</span>
      <select className="tenant-switch__select field-control" value={tenantId} onChange={(e) => onChange(e.target.value)}>
        {state.tenants
          .filter((t) => t.active)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {organizationDisplayName(state, t.id)}
            </option>
          ))}
      </select>
    </label>
  );
}
