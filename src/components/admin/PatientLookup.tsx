import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DemoState } from '@/types/demo';
import { findPatientsByQuery, findPatientIdByQuery } from '@/lib/patientSearch';
import { patientDisplayCode } from '@/lib/nhc';
import { Field, Input } from '@/components/ui';

type Props = {
  state: DemoState;
  patientId: string;
  onPatientId: (id: string) => void;
  label?: string;
};

/** Búsqueda por NHC, DNI, nombre o ID interno */
export function PatientLookup({ state, patientId, onPatientId, label = 'Buscar paciente' }: Props) {
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

  return (
    <div className="patient-lookup">
      <Field label={label}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="!pl-10"
            placeholder="NHC, DNI o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyQuery())}
          />
        </div>
      </Field>
      {q.trim() && matches.length ? (
        <ul className="patient-lookup__results mt-2 max-h-48 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {matches.slice(0, 8).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-dental-50"
                onClick={() => {
                  onPatientId(p.id);
                  setQ('');
                }}
              >
                <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-900">
                  {p.nhc ? `NHC ${p.nhc}` : p.id}
                </span>
                <span>{p.fullName}</span>
                {p.dni ? <span className="text-xs text-slate-500">DNI {p.dni}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selected ? (
        <p className="mt-2 rounded-xl bg-dental-50 px-3 py-2 text-sm font-bold text-dental-900">
          Seleccionado: {patientDisplayCode(selected)} · {selected.fullName}
          {selected.dni ? ` · DNI ${selected.dni}` : ''}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">Introduce NHC, DNI o nombre y pulsa Enter.</p>
      )}
    </div>
  );
}

export function patientFilterLabel(state: DemoState, patientId: string) {
  const p = state.patients.find((x) => x.id === patientId);
  if (!p) return patientId;
  return `${p.nhc ? `NHC ${p.nhc}` : p.id} · ${p.fullName}${p.dni ? ` · ${p.dni}` : ''}`;
}
