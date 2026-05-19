import type { DemoState } from '@/types/demo';
import { patientName } from '@/lib/selectors';
import { Field, Select } from '@/components/ui';

export function PatientSelect({
  state,
  value,
  onChange,
  required: req
}: {
  state: DemoState;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <Field label={req ? 'Paciente *' : 'Paciente'}>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecciona paciente…</option>
        {state.patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.id} · {p.fullName}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function apptLabel(state: DemoState, appointmentId?: string) {
  if (!appointmentId) return '—';
  const a = state.appointments.find((x) => x.id === appointmentId);
  if (!a) return appointmentId;
  return `${a.id} · ${patientName(state, a.patientId)}`;
}
