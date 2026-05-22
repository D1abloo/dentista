import { useMemo, useState } from 'react';
import { getPrimaryClinic } from '@/lib/clinic';
import { createAdminAppointment } from '@/lib/adminAppointments';
import { todayIso } from '@/lib/format';
import { required } from '@/lib/validation';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { patientsForClinic } from '@/lib/tenant';
import { useNotice } from '@/hooks/useNotice';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { PatientLookup } from './PatientLookup';

export function NewAppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const clinicPatients = useMemo(() => patientsForClinic(state, clinic.id), [state, clinic.id]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: clinicPatients[0]?.id ?? '',
    dentistId: scope.dentists[0]?.id ?? '',
    treatmentId: scope.treatments[0]?.id ?? '',
    date: todayIso(),
    time: '10:00'
  });

  async function submit() {
    const err =
      required(form.patientId, 'Paciente') ||
      required(form.dentistId, 'Profesional') ||
      required(form.treatmentId, 'Tratamiento') ||
      required(form.date, 'Fecha') ||
      required(form.time, 'Hora');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const patient = clinicPatients.find((p) => p.id === form.patientId);
    if (!patient) {
      setNotice({ type: 'error', message: 'Selecciona un paciente registrado.' });
      return;
    }
    setLoading(true);
    try {
      const result = await createAdminAppointment({
        state,
        clinicId: clinic.id,
        cabinetId: clinic.cabinets[0]?.id ?? 'g-1',
        patientId: form.patientId,
        patientName: patient.fullName,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        dentistId: form.dentistId,
        treatmentId: form.treatmentId,
        roomName: clinic.cabinets[0]?.name ?? 'Gabinete 1',
        date: form.date,
        time: form.time,
        status: 'pendiente'
      });
      if (!result.ok) {
        setNotice({ type: 'error', message: result.message });
        return;
      }
      if (result.demoState) commit(result.demoState);
      else await refresh();
      setNotice({ type: 'ok', message: 'Cita creada correctamente.' });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva cita"
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={loading}>
            {loading ? 'Guardando…' : 'Crear cita'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <PatientLookup
            state={state}
            patientId={form.patientId}
            onPatientId={(id) => setForm({ ...form, patientId: id })}
            label="Paciente"
            placeholder="Buscar por NHC, nombre o teléfono…"
            candidates={clinicPatients}
          />
        </div>
        <Field label="Profesional">
          <Select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}>
            {scope.dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tratamiento">
          <Select value={form.treatmentId} onChange={(e) => setForm({ ...form, treatmentId: e.target.value })}>
            {scope.treatments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha">
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Hora">
          <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
