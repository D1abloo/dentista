import { useMemo, useState } from 'react';
import { Hash, Search } from 'lucide-react';
import type { DemoState } from '@/types/demo';
import { findPatientsByQuery, findPatientIdByQuery } from '@/lib/patientSearch';
import { normalizeNhcQuery, patientDisplayCode } from '@/lib/nhc';
import { Field, Input } from '@/components/ui';

type Props = {
  state: DemoState;
  patientId: string;
  onPatientId: (id: string) => void;
  label?: string;
  placeholder?: string;
  /** Prioriza búsqueda por número NHC (campo numérico). */
  nhcPrimary?: boolean;
};

export function PatientLookup({
  state,
  patientId,
  onPatientId,
  label = 'Buscar paciente',
  placeholder,
  nhcPrimary
}: Props) {
  const [q, setQ] = useState('');
  const matches = useMemo(() => findPatientsByQuery(state, q), [state, q]);
  const selected = state.patients.find((p) => p.id === patientId);

  function applyQuery() {
    const id = findPatientIdByQuery(state, q);
    if (id) {
      onPatientId(id);
      setQ('');
    }
  }

  const isNumeric = /^\d+$/.test(normalizeNhcQuery(q));

  return (
    <div className={`patient-lookup ${nhcPrimary ? 'patient-lookup--nhc' : ''}`}>
      <Field label={label}>
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
            placeholder={placeholder ?? (nhcPrimary ? 'Número NHC (ej. 12)' : 'NHC, DNI o nombre…')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyQuery())}
          />
        </div>
      </Field>
      {q.trim() && matches.length ? (
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
        <p className="patient-lookup__selected">
          <strong>{patientDisplayCode(selected)}</strong> — {selected.fullName}
        </p>
      ) : (
        <p className="patient-lookup__hint">
          {nhcPrimary ? 'Introduce el número NHC y pulsa Enter.' : 'NHC, DNI o nombre + Enter.'}
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
