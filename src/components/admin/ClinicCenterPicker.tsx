import { useEffect, useState } from 'react';
import { Building2, ChevronRight, Loader2, MapPin } from 'lucide-react';
import type { AssignedCenter } from '@/lib/services/clinicSwitch';
import { fetchAssignedCenters, switchClinicCenter } from '@/lib/clinicCenters';

const PLATFORM_ADMIN_LEAD =
  'Como administrador de la plataforma puedes acceder a cualquier clínica activa. Elige el centro al que quieres entrar.';

type Props = {
  /** Tras login: si hay un solo centro, entrar automáticamente. */
  autoSingle?: boolean;
  title?: string;
  lead?: string;
};

export function ClinicCenterPicker({ autoSingle = false, title, lead }: Props) {
  const [centers, setCenters] = useState<AssignedCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAssignedCenters()
      .then(async ({ centers: list, allClinicsAccess }) => {
        if (cancelled) return;
        setCenters(list);
        setPlatformAdmin(allClinicsAccess);
        if (autoSingle && list.length === 1) {
          setSwitching(list[0]!.clinicId);
          const result = await switchClinicCenter(list[0]!.clinicId);
          if (result.ok) {
            try {
              await fetch('/api/auth/ensure-admin-access', { method: 'POST', credentials: 'include' });
            } catch {
              /* gate aplicada en switch-clinic */
            }
            window.location.href = '/admin';
            return;
          }
          setError(result.message);
          setSwitching(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar tus centros clínicos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autoSingle]);

  async function pickCenter(center: AssignedCenter) {
    if (switching) return;
    setSwitching(center.clinicId);
    setError(null);
    const result = await switchClinicCenter(center.clinicId);
    if (!result.ok) {
      setError(result.message);
      setSwitching(null);
      return;
    }
    try {
      await fetch('/api/auth/ensure-admin-access', { method: 'POST', credentials: 'include' });
    } catch {
      /* gate aplicada en switch-clinic */
    }
    window.location.href = '/admin';
  }

  return (
    <div className="clinic-center-picker">
      <header className="clinic-center-picker__head">
        <span className="clinic-center-picker__eyebrow">
          <Building2 className="h-4 w-4" aria-hidden />
          Acceso clínica
        </span>
        <h1>{title ?? 'Elige tu centro clínico'}</h1>
        <p>{lead ?? (platformAdmin ? PLATFORM_ADMIN_LEAD : 'Cada clínica tiene su espacio aislado. Selecciona el centro al que quieres acceder; tus datos y configuración son independientes por sede.')}</p>
      </header>

      {loading ? (
        <p className="clinic-center-picker__status" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando centros…
        </p>
      ) : null}

      {error ? (
        <p className="clinic-center-picker__error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && centers.length === 0 ? (
        <p className="clinic-center-picker__empty">No tienes centros clínicos asignados.</p>
      ) : null}

      <ul className="clinic-center-picker__list">
        {centers.map((center) => {
          const busy = switching === center.clinicId;
          return (
            <li key={center.clinicId}>
              <button
                type="button"
                className={`clinic-center-picker__card${center.isCurrent ? ' clinic-center-picker__card--current' : ''}`}
                disabled={Boolean(switching)}
                onClick={() => void pickCenter(center)}
              >
                <span className="clinic-center-picker__icon" aria-hidden>
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="clinic-center-picker__meta">
                  <strong>{center.name}</strong>
                  {center.city || center.address ? (
                    <small>
                      <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
                      {[center.city, center.address].filter(Boolean).join(' · ')}
                    </small>
                  ) : (
                    <small>Centro independiente · tenant aislado</small>
                  )}
                  {center.isCurrent ? <span className="clinic-center-picker__badge">Activo ahora</span> : null}
                  {center.staffRole === 'super_admin' ? (
                    <span className="clinic-center-picker__badge clinic-center-picker__badge--platform">Admin plataforma</span>
                  ) : null}
                </span>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
