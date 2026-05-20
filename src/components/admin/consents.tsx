import { useMemo, useState } from 'react';
import { createInformedConsent, getStoredTenantId } from '@/lib/demoStore';
import { patientName } from '@/lib/selectors';
import { recordMatchesPatientQuery } from '@/lib/patientSearch';
import { fmtDate } from '@/lib/format';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { required } from '@/lib/validation';
import { saveDemoFile } from '@/lib/demoFiles';
import { isClientDemoMode } from '@/lib/appMode';
import { PatientLookup } from './PatientLookup';
import { AppointmentOptions } from './records';
import { Badge, Button, Card, Empty, Field, Input, SearchInput, Select, Textarea } from '@/components/ui';
import { IdBadge } from '@/components/ui/IdBadge';
import { FileActions } from '@/components/shared/FileActions';

export function AdminConsents() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    patientId: state.patients[0]?.id ?? '',
    appointmentId: '',
    treatmentName: '',
    title: '',
    body: '',
    requiredForPortal: true
  });

  const list = useMemo(() => {
    let rows = [...state.informedConsents];
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.id.toLowerCase().includes(s) ||
          c.title.toLowerCase().includes(s) ||
          recordMatchesPatientQuery(state, c.patientId, q)
      );
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, q]);

  async function create() {
    const err =
      required(form.patientId, 'Paciente') ||
      required(form.treatmentName, 'Tratamiento') ||
      required(form.title, 'Título') ||
      required(form.body, 'Texto del consentimiento');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    let fileRef: string | undefined;
    let fileName: string | undefined;
    if (uploadFile) {
      fileRef = await saveDemoFile(uploadFile);
      fileName = uploadFile.name;
    }
    if (!isClientDemoMode()) {
      const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
      if (clinicId) {
        await fetch('/api/records/consent', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId,
            patientId: form.patientId,
            appointmentId: form.appointmentId || undefined,
            treatmentName: form.treatmentName,
            title: form.title,
            body: form.body,
            requiredForPortal: form.requiredForPortal,
            fileRef,
            fileName
          })
        });
      }
    }
    commit(
      createInformedConsent(state, {
        patientId: form.patientId,
        appointmentId: form.appointmentId || undefined,
        treatmentName: form.treatmentName,
        title: form.title,
        body: form.body,
        requiredForPortal: form.requiredForPortal,
        fileRef,
        fileName,
        tenantId: getStoredTenantId()
      })
    );
    if (!isClientDemoMode()) await refresh();
    setNotice({ type: 'ok', message: 'Consentimiento publicado. El paciente debe firmarlo en su perfil.' });
    setForm({ ...form, title: '', body: '', treatmentName: '', appointmentId: '' });
    setUploadFile(null);
  }

  return (
    <div className="space-y-4">
      <div className="admin-search-bar">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar consentimiento o paciente…" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card title={`Consentimientos (${list.length})`}>
          <ul className="data-rows">
            {list.map((c) => (
              <li key={c.id} className="data-row">
                <div className="data-row__main">
                  <p className="data-row__title">
                    <IdBadge id={c.id} kind="documento" /> {c.title}
                  </p>
                  <p className="data-row__meta">
                    {patientName(state, c.patientId)} · {c.treatmentName} · {fmtDate(c.createdAt)}
                  </p>
                </div>
                <div className="data-row__aside">
                  <Badge
                    status={c.status === 'firmado' ? 'completada' : 'pendiente'}
                    label={c.status === 'firmado' ? 'Firmado' : 'Pendiente'}
                  />
                  {c.fileRef ? (
                    <FileActions fileRef={c.fileRef} fileName={c.fileName} mimeType="application/pdf" />
                  ) : null}
                  {c.signatureRef ? (
                    <a href={c.signatureRef} target="_blank" rel="noreferrer" className="text-xs font-bold text-[var(--blue)]">
                      Ver firma
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {!list.length ? <Empty title="Sin consentimientos" text="Crea el primero desde el formulario." /> : null}
        </Card>
        <Card title="Nuevo consentimiento">
          <div className="grid gap-3">
            <PatientLookup
              state={state}
              patientId={form.patientId}
              onPatientId={(id) => setForm({ ...form, patientId: id, appointmentId: '' })}
            />
            <Field label="Cita vinculada (opcional)">
              <Select
                value={form.appointmentId}
                onChange={(e) => {
                  const appointmentId = e.target.value;
                  const appt = state.appointments.find((a) => a.id === appointmentId);
                  const treatment = appt ? state.treatments.find((t) => t.id === appt.treatmentId) : null;
                  setForm({
                    ...form,
                    appointmentId,
                    treatmentName: treatment?.name ?? form.treatmentName,
                    title: appointmentId
                      ? `Consentimiento informado · ${treatment?.name ?? 'Tratamiento'}`
                      : form.title
                  });
                }}
              >
                <AppointmentOptions state={state} patientId={form.patientId} />
              </Select>
            </Field>
            <Field label="Tratamiento / prueba *">
              <Input
                value={form.treatmentName}
                onChange={(e) => setForm({ ...form, treatmentName: e.target.value })}
                placeholder="Ortodoncia, blanqueamiento…"
              />
            </Field>
            <Field label="Título *">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Texto legal *">
              <Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </Field>
            <Field label="PDF plantilla (opcional)">
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="field-control"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.requiredForPortal}
                onChange={(e) => setForm({ ...form, requiredForPortal: e.target.checked })}
              />
              Obligatorio en portal paciente
            </label>
            <Button onClick={() => void create()}>Publicar consentimiento</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
