import { useEffect, useRef, useState } from 'react';
import { CalendarRange, ChevronDown, Plus } from 'lucide-react';
import { getActiveClinicId, setActiveClinicId } from '@/lib/activeClinic';
import { getStoredTenantId } from '@/lib/demoStore';
import { isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { NewAppointmentModal } from './NewAppointmentModal';

const WEEK_PRESETS = [
  { id: 'this', label: '19 may – 25 may 2026', start: '2026-05-19', end: '2026-05-25' },
  { id: 'prev', label: '12 may – 18 may 2026', start: '2026-05-12', end: '2026-05-18' },
  { id: 'month', label: '1 may – 31 may 2026', start: '2026-05-01', end: '2026-05-31' }
] as const;

type Props = {
  onRangeChange?: (start: string, end: string) => void;
};

export function AdminDashboardToolbar({ onRangeChange }: Props) {
  const { state, refresh } = useDemoStore();
  const tenantId = getStoredTenantId();
  const branches = state.clinics.filter((c) => c.tenantId === tenantId);
  const activeClinicId = getActiveClinicId(state, tenantId);
  const activeClinic = branches.find((c) => c.id === activeClinicId) ?? branches[0];

  const [rangeOpen, setRangeOpen] = useState(false);
  const [clinicOpen, setClinicOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [range, setRange] = useState<(typeof WEEK_PRESETS)[number]>(WEEK_PRESETS[0]);

  const rangeRef = useRef<HTMLDivElement>(null);
  const clinicRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    onRangeChange?.(range.start, range.end);
  }, [range, onRangeChange]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (!rangeRef.current?.contains(t)) setRangeOpen(false);
      if (!clinicRef.current?.contains(t)) setClinicOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function onClinicChange(clinicId: string) {
    setActiveClinicId(clinicId);
    setClinicOpen(false);
    if (isClientLiveMode()) void refresh();
    else window.location.reload();
  }

  return (
    <>
      <div className="adm-dash-toolbar">
        <div className="adm-dash-toolbar__filters">
          <div className={`adm-dash-dropdown${rangeOpen ? ' is-open' : ''}`} ref={rangeRef}>
            <button
              type="button"
              className="adm-dash-chip"
              aria-expanded={rangeOpen}
              aria-haspopup="listbox"
              onClick={() => setRangeOpen((v) => !v)}
            >
              <CalendarRange className="h-4 w-4" aria-hidden />
              {range.label}
              <ChevronDown className="h-4 w-4 adm-dash-chip__chev" aria-hidden />
            </button>
            {rangeOpen ? (
              <ul className="adm-dash-dropdown__menu" role="listbox">
                {WEEK_PRESETS.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={range.id === p.id}
                      onClick={() => {
                        setRange(p);
                        setRangeOpen(false);
                      }}
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {branches.length ? (
            <div className={`adm-dash-dropdown${clinicOpen ? ' is-open' : ''}`} ref={clinicRef}>
              <button
                type="button"
                className="adm-dash-chip"
                aria-expanded={clinicOpen}
                aria-haspopup="listbox"
                onClick={() => setClinicOpen((v) => !v)}
              >
                {activeClinic?.name ?? 'Clínica Dental Sonrisa'}
                <ChevronDown className="h-4 w-4 adm-dash-chip__chev" aria-hidden />
              </button>
              {clinicOpen ? (
                <ul className="adm-dash-dropdown__menu" role="listbox">
                  {branches.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={b.id === activeClinicId}
                        onClick={() => onClinicChange(b.id)}
                      >
                        {b.name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="adm-dash-toolbar__actions">
          <button type="button" className="adm-dash-btn-primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva cita
          </button>
        </div>
      </div>
      <NewAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
