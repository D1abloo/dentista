import { useState } from 'react';
import { getPrimaryClinic } from '@/lib/clinic';
import { tryCreateAppointment } from '@/lib/demoStore';
import { createAppointmentLive } from '@/lib/clinicApi';
import { isClientDemoMode } from '@/lib/appMode';
import { todayIso } from '@/lib/format';
import { required } from '@/lib/validation';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { patientsForTenant } from '@/lib/tenant';
import { useNotice } from '@/hooks/useNotice';
import { Button, Field, Input, Modal, Select } from '@/components/ui';

export function NewAppointmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const tenantPatients = state.patients.filter((p) =>
    patientsForTenant(state, scope.tenantId).includes(p.id)
  );
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientId: tenantPatients[0]?.id ?? '',
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
    setLoading(true);
    try {
      const patient = state.patients.find((p) => p.id === form.patientId);
      if (!isClientDemoMode()) {
        const live = await createAppointmentLive({
          clinicId: clinic.id,
          patientId: form.patientId,
          patientName: patient?.fullName ?? 'Paciente',
          patientEmail: patient?.email,
          patientPhone: patient?.phone,
          dentistId: form.dentistId,
          treatmentId: form.treatmentId,
          roomName: clinic.cabinets[0]?.name ?? 'Gabinete 1',
          date: form.date,
          time: form.time
        });
        if (!live.ok) {
          setNotice({ type: 'error', message: live.message });
          return;
        }
        await refresh();
      } else {
        const result = tryCreateAppointment(state, {
          patientId: form.patientId,
          dentistId: form.dentistId,
          treatmentId: form.treatmentId,
          clinicId: clinic.id,
          cabinetId: clinic.cabinets[0]?.id ?? 'g-1',
          date: form.date,
          time: form.time,
          status: 'pendiente'
        });
        if (!result.ok) {
          setNotice({ type: 'error', message: result.message ?? 'No se pudo crear la cita.' });
          return;
        }
        commit(result.state);
      }
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
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Guardando…' : 'Crear cita'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Paciente">
          <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
            {tenantPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </Select>
        </Field>
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
