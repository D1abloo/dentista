import { useState } from 'react';
import { getPrimaryClinic } from '@/lib/clinic';
import { isClientDemoMode } from '@/lib/appMode';
import { createPatient } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { useNotice } from '@/hooks/useNotice';
import { Button, Field, Modal, Textarea } from '@/components/ui';

function parseLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[;\t,]/).map((p) => p.trim());
      return {
        fullName: parts[0] ?? '',
        email: parts[1] ?? '',
        phone: parts[2] ?? '',
        dni: parts[3] ?? ''
      };
    })
    .filter((r) => r.fullName && r.email);
}

export function ImportPatientsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const clinic = getPrimaryClinic(state, scope.tenantId);
  const [raw, setRaw] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const rows = parseLines(raw);
    if (!rows.length) {
      setNotice({ type: 'error', message: 'Añade al menos una línea: nombre;email;teléfono' });
      return;
    }
    setLoading(true);
    let ok = 0;
    let fail = 0;
    try {
      if (!isClientDemoMode()) {
        for (const row of rows) {
          const res = await fetch('/api/admin/patients', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              full_name: row.fullName,
              email: row.email,
              phone: row.phone || '+34 600 000 000',
              dni: row.dni,
              clinic_id: clinic.id
            })
          });
          if (res.ok) ok++;
          else fail++;
        }
        await refresh();
      } else {
        let next = state;
        for (const row of rows) {
          next = createPatient(next, {
            fullName: row.fullName,
            email: row.email,
            phone: row.phone || '+34 600 000 000',
            birthDate: '1990-01-01',
            allergies: 'Ninguna',
            medication: 'Ninguna',
            reminderChannels: ['email'],
            primaryDentistId: scope.dentists[0]?.id ?? '',
            preferredClinicId: clinic.id,
            emergencyContactName: '',
            emergencyContactPhone: '',
            notes: '',
            dni: row.dni
          });
          ok++;
        }
        commit(next);
      }
      setNotice({
        type: fail ? 'error' : 'ok',
        message: `Importación: ${ok} creados${fail ? `, ${fail} con error` : ''}.`
      });
      setRaw('');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Importar pacientes"
      onClose={onClose}
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={loading}>
            {loading ? 'Importando…' : 'Importar'}
          </Button>
        </>
      }
    >
      <Field label="Datos (una línea por paciente)">
        <Textarea
          className="min-h-[10rem] font-mono text-sm"
          placeholder={'María González;maria@clinic.es;+34 612 340 101\nCarlos Ruiz;carlos@clinic.es;+34 612 340 102'}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </Field>
      <p className="text-xs font-semibold text-slate-500">Formato: nombre;email;teléfono;dni (opcional)</p>
    </Modal>
  );
}
