import { useMemo, useState } from 'react';
import { Hash, Search } from 'lucide-react';
import type { DemoState, Patient } from '@/types/demo';
import { findPatientsByQuery, findPatientIdByQuery } from '@/lib/patientSearch';
import { normalizeNhcQuery, patientDisplayCode } from '@/lib/nhc';
import { Field, Input } from '@/components/ui';

type Props = {
  state: DemoState;
  patientId: string;
  onPatientId: (id: string) => void;
  label?: string;
  placeholder?: string;
  /** Limita la búsqueda a pacientes de la sede (agenda / citas). */
  candidates?: Patient[];
  /** Prioriza búsqueda por número NHC (campo numérico). */
  nhcPrimary?: boolean;
  /** Tarjeta con lista desplazable (informes clínicos). */
  variant?: 'default' | 'card';
};

export function PatientLookup({
  state,
  patientId,
  onPatientId,
  label = 'Buscar paciente',
  placeholder,
  candidates,
  nhcPrimary,
  variant = 'default'
}: Props) {
  const [q, setQ] = useState('');
  const pool = candidates ?? state.patients;
  const scopedState = useMemo(() => ({ ...state, patients: pool }), [state, pool]);
  const matches = useMemo(() => {
    const list = findPatientsByQuery(scopedState, q);
    return q.trim() ? list.slice(0, 10) : pool.slice(0, 10);
  }, [scopedState, pool, q]);
  const selected = pool.find((p) => p.id === patientId);

  function applyQuery() {
    const id = findPatientIdByQuery(scopedState, q);
    if (id) {
      onPatientId(id);
      setQ('');
    }
  }

  const isNumeric = /^\d+$/.test(normalizeNhcQuery(q));

  const isCard = variant === 'card';

  return (
    <div
      className={`patient-lookup${nhcPrimary ? ' patient-lookup--nhc' : ''}${isCard ? ' patient-lookup--card' : ''}`}
    >
      <Field label={isCard ? 'Buscar' : label}>
        <div className="relative">
          {nhcPrimary ? (
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <Input
            className="!pl-10"
            type={nhcPrimary && isNumeric ? 'number' : 'search'}
            inputMode={nhcPrimary ? 'numeric' : 'search'}
            placeholder={placeholder ?? (nhcPrimary ? 'NHC, DNI o nombre…' : 'NHC, DNI o nombre…')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyQuery())}
          />
        </div>
      </Field>

      {isCard ? (
        <div className="patient-lookup__card-list" role="listbox" aria-label="Pacientes">
          {matches.length ? (
            matches.slice(0, 12).map((p) => {
              const active = p.id === patientId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`patient-lookup__card-item${active ? ' patient-lookup__card-item--active' : ''}`}
                  onClick={() => {
                    onPatientId(p.id);
                    setQ('');
                  }}
                >
                  {p.nhc ? <span className="patient-lookup__nhc">NHC {p.nhc}</span> : null}
                  <span className="patient-lookup__name">{p.fullName}</span>
                </button>
              );
            })
          ) : (
            <p className="patient-lookup__card-empty">Sin coincidencias. Prueba otro término.</p>
          )}
        </div>
      ) : matches.length ? (
        <ul className="patient-lookup__results">
          {matches.slice(0, 8).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="patient-lookup__result-btn"
                onClick={() => {
                  onPatientId(p.id);
                  setQ(p.nhc ?? '');
                }}
              >
                {p.nhc ? <span className="patient-lookup__nhc">NHC {p.nhc}</span> : null}
                <span className="patient-lookup__name">{p.fullName}</span>
                {p.dni ? <span className="patient-lookup__meta">DNI {p.dni}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <div className={`patient-lookup__selected${isCard ? ' patient-lookup__selected--card' : ''}`}>
          <span className="patient-lookup__selected-label">Seleccionado</span>
          <p className="patient-lookup__selected-body">
            <strong>{patientDisplayCode(selected)}</strong>
            <span>{selected.fullName}</span>
            {selected.dni ? <span className="patient-lookup__meta">DNI {selected.dni}</span> : null}
          </p>
        </div>
      ) : (
        <p className="patient-lookup__hint">
          {pool.length
            ? nhcPrimary
              ? 'Busca por NHC, DNI o nombre y elige de la lista.'
              : 'Busca por NHC, DNI o nombre, o elige de la lista.'
            : 'No hay pacientes registrados en esta clínica.'}
        </p>
      )}
    </div>
  );
}

export function patientFilterLabel(state: DemoState, patientId: string) {
  const p = state.patients.find((x) => x.id === patientId);
  if (!p) return patientId;
  return `${p.nhc ? `NHC ${p.nhc}` : p.id} · ${p.fullName}${p.dni ? ` · ${p.dni}` : ''}`;
}
