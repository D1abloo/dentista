import { MapPin } from 'lucide-react';
import { isClientLiveMode } from '@/lib/appMode';
import { switchClinicCenter, fetchAssignedCenters } from '@/lib/clinicCenters';
import { useEffect, useState } from 'react';
import type { AssignedCenter } from '@/lib/services/clinicSwitch';

export function ClinicBranchSwitcher() {
  const [centers, setCenters] = useState<AssignedCenter[]>([]);
  const [activeId, setActiveId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchAssignedCenters().then((list) => {
      setCenters(list);
      const current = list.find((c) => c.isCurrent)?.clinicId ?? list[0]?.clinicId ?? '';
      setActiveId(current);
    });
  }, []);

  if (centers.length < 2) return null;

  async function onChange(clinicId: string) {
    if (clinicId === activeId || busy) return;
    setBusy(true);
    const result = await switchClinicCenter(clinicId);
    if (!result.ok) {
      setBusy(false);
      return;
    }
    if (isClientLiveMode()) window.location.href = '/admin';
    else window.location.reload();
  }

  return (
    <label className="tenant-switch clinic-branch-switch">
      <span className="tenant-switch__label">
        <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        Centro activo
      </span>
      <select
        className="tenant-switch__select field-control"
        value={activeId}
        disabled={busy}
        onChange={(e) => void onChange(e.target.value)}
        aria-label="Seleccionar centro clínico"
      >
        {centers.map((b) => (
          <option key={b.clinicId} value={b.clinicId}>
            {b.name}
            {b.city ? ` · ${b.city}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
