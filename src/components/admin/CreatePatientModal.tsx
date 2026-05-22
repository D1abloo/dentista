import { useState } from 'react';
import { getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import { createPatient } from '@/lib/demoStore';
import { email, phone, required } from '@/lib/validation';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { useNotice } from '@/hooks/useNotice';
import { Button, Field, Input, Modal } from '@/components/ui';

export function CreatePatientModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    birthDate: ''
  });

  async function submit() {
    const err =
      required(form.fullName, 'Nombre') ||
      email(form.email) ||
      phone(form.phone);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    setLoading(true);
    try {
      if (!isClientDemoMode()) {
        const res = await fetch('/api/admin/patients', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            full_name: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            dni: form.dni.trim(),
            birth_date: form.birthDate || undefined,
            clinic_id: clinic.id
          })
        });
        const json = (await res.json()) as {
          data?: { profileId?: string };
          error?: { message?: string };
          meta?: { message?: string };
        };
        if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo crear el paciente.');
        await refresh();
        const id = json.data?.profileId ?? '';
        setNotice({ type: 'ok', message: json.meta?.message ?? 'Paciente creado.' });
        if (id) onCreated?.(id);
      } else {
        const next = createPatient(state, {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dni: form.dni.trim() || undefined,
          birthDate: form.birthDate || '1990-01-01',
          allergies: 'Ninguna',
          medication: 'Ninguna',
          reminderChannels: ['email'],
          primaryDentistId: scope.dentists[0]?.id ?? '',
          preferredClinicId: clinic.id,
          emergencyContactName: '',
          emergencyContactPhone: '',
          notes: ''
        });
        commit(next);
        const created = next.patients[next.patients.length - 1];
        setNotice({ type: 'ok', message: 'Paciente creado en la clínica.' });
        if (created) onCreated?.(created.id);
      }
      setForm({ fullName: '', email: '', phone: '', dni: '', birthDate: '' });
      onClose();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Crear paciente"
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={loading}>
            {loading ? 'Guardando…' : 'Crear paciente'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre completo">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Teléfono">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="DNI / NIE">
          <Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
        </Field>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">
        Se asignará NHC automático y se enviará invitación al portal del paciente por email.
      </p>
    </Modal>
  );
}
