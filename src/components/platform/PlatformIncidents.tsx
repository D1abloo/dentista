import { useEffect, useState } from 'react';
import { Stethoscope, UserRound } from 'lucide-react';
import { Button, Card, Empty, Field, PageHeader, Select } from '@/components/ui';
import type { PlatformClinic } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

type AuditRow = {
  id: string;
  actor_email: string;
  actor_name: string | null;
  access_role: string;
  inspect_mode: string;
  clinic_id: string | null;
  event_type: string;
  page_path: string | null;
  resource_label: string | null;
  created_at: string;
};

type PatientRow = { id: string; full_name: string; email: string };

export function PlatformIncidents() {
  const [clinics, setClinics] = useState<PlatformClinic[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [clinicId, setClinicId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void api<PlatformClinic[]>('/api/platform/clinics').then(setClinics).catch(() => undefined);
    void api<{ audit: AuditRow[] }>('/api/platform/inspect')
      .then((d) => setAudit(d.audit ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!clinicId) {
      setPatients([]);
      return;
    }
    void api<import('@/lib/platform/types').PlatformClinicUser[]>(`/api/platform/users?clinicId=${clinicId}`)
      .then((users) => setPatients(users.filter((u) => u.role === 'patient').map((u) => ({ id: u.id, full_name: u.full_name, email: u.email }))))
      .catch(() => setPatients([]));
  }, [clinicId]);

  async function inspectClinic() {
    if (!clinicId) return;
    setLoading(true);
    setMsg('');
    try {
      const data = await api<{ redirect: string }>('/api/platform/inspect', {
        method: 'POST',
        body: JSON.stringify({ action: 'clinic', clinicId })
      });
      window.location.href = data.redirect;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
      setLoading(false);
    }
  }

  async function inspectPdp() {
    if (!clinicId || !patientId) return;
    setLoading(true);
    setMsg('');
    try {
      const data = await api<{ redirect: string }>('/api/platform/inspect', {
        method: 'POST',
        body: JSON.stringify({ action: 'patient_portal', clinicId, patientId })
      });
      window.location.href = data.redirect;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
      setLoading(false);
    }
  }

  return (
    <PlatformShell
      title="Revisión de incidencias"
      subtitle="Acceso oculto a panel clínica y PdP con registro de usuario, rol, fecha/hora y clics"
    >
      <Card className="mb-4">
        <PageHeader title="Iniciar revisión" subtitle="Solo super administrador. Toda actividad queda auditada." />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Clínica">
            <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
              <option value="">Selecciona clínica</option>
              {clinics.filter((c) => c.status === 'active').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Paciente (solo para PdP)">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} disabled={!patients.length}>
              <option value="">Selecciona paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} · {p.email}
                </option>
              ))}
            </Select>
          </Field>
          <Button className="md:col-span-1" onClick={() => void inspectClinic()} disabled={!clinicId || loading}>
            <Stethoscope className="h-4 w-4" /> Revisar panel clínica
          </Button>
          <Button className="md:col-span-1" onClick={() => void inspectPdp()} disabled={!patientId || loading}>
            <UserRound className="h-4 w-4" /> Revisar portal paciente
          </Button>
        </div>
        {msg ? <p className="mt-3 text-sm text-red-600">{msg}</p> : null}
      </Card>

      <Card title="Registro de inspecciones">
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Modo</th>
                <th>Evento</th>
                <th>Ruta / recurso</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
                  <td>{row.actor_email}</td>
                  <td>{row.access_role}</td>
                  <td>{row.inspect_mode}</td>
                  <td>{row.event_type}</td>
                  <td>
                    {row.page_path ?? '—'}
                    {row.resource_label ? ` · ${row.resource_label}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!audit.length ? <Empty title="Sin registros" text="Las inspecciones aparecerán aquí." /> : null}
      </Card>
    </PlatformShell>
  );
}
