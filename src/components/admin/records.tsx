import { useMemo, useState, type ReactNode } from 'react';
import {
  addAdminNote,
  addMessage,
  createClinicalReport,
  createPayment,
  exportCsv,
  saveClinicalReport
} from '@/lib/demoStore';
import { MessageSquare } from 'lucide-react';
import { isActiveStatus } from '@/lib/appointments';
import { isPdfMime, saveDemoFile } from '@/lib/demoFiles';
import { recordMatchesPatientQuery } from '@/lib/patientSearch';
import { fmtDate, fmtDateTime, money, statusLabel, todayIso } from '@/lib/format';
import { reportTitleFromAppointment } from '@/lib/clinical';
import { patientName, recordsForPatient } from '@/lib/selectors';
import { positiveAmount, required } from '@/lib/validation';
import { isClientDemoMode, modeCopy } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { ClinicalReport, Payment } from '@/types/demo';
import { IdBadge } from '@/components/ui/IdBadge';
import { FileActions } from '@/components/shared/FileActions';
import { PatientLookup } from './PatientLookup';
import { PatientSelect } from './shared';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  FileUpload,
  FilterTabs,
  Input,
  SearchInput,
  Select,
  StatCard,
  Textarea
} from '@/components/ui';

export function AppointmentOptions({ state, patientId }: { state: ReturnType<typeof useDemoStore>['state']; patientId: string }) {
  const appts = state.appointments.filter((a) => a.patientId === patientId);
  return (
    <>
      <option value="">Sin cita vinculada</option>
      {appts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.id} · {fmtDateTime(a.date, a.time)}
        </option>
      ))}
    </>
  );
}

function RecordSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const has = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card title={title}>
      {has ? <ul className="data-rows">{children}</ul> : <Empty title={empty} text="" />}
    </Card>
  );
}

export function AdminPatientDetail({ patientId }: { patientId: string }) {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const patient = state.patients.find((p) => p.id === patientId);
  const rec = patient ? recordsForPatient(state, patientId) : null;
  const [note, setNote] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  const timeline = useMemo(() => {
    if (!rec) return [];
    const items: Array<{ at: string; id: string; kind: 'cita' | 'informe' | 'factura' | 'pago' | 'documento'; label: string }> = [];
    for (const a of rec.appointments) items.push({ at: `${a.date}T${a.time}`, id: a.id, kind: 'cita', label: `Cita ${statusLabel(a.status)}` });
    for (const r of rec.reports) items.push({ at: r.createdAt, id: r.id, kind: 'informe', label: r.title });
    for (const i of rec.invoices) items.push({ at: i.issuedAt, id: i.id, kind: 'factura', label: `${i.concept} · ${money(i.amount)}` });
    for (const p of rec.payments) items.push({ at: p.paidAt ?? p.createdAt, id: p.id, kind: 'pago', label: `${money(p.amount)} · ${p.method}` });
    for (const d of rec.documents) items.push({ at: d.createdAt, id: d.id, kind: 'documento', label: `${d.title} (${d.visibility})` });
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [rec]);

  if (!patient || !rec) {
    return (
      <Empty
        title="Paciente no encontrado"
        text={modeCopy(`No existe ${patientId} en el modo demo.`, `No existe ${patientId} en la clínica.`)}
      />
    );
  }

  const nextAppt = [...rec.appointments]
    .filter((a) => isActiveStatus(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const pendingInv = rec.invoices.filter((i) => i.status === 'pendiente' || i.status === 'vencida');

  return (
    <div className="space-y-5">
      <div className="ficha-hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Ficha clínica</p>
            <h1 className="mt-1 font-display text-2xl md:text-3xl">{patient.fullName}</h1>
            <p className="mt-2 text-sm text-white/85">
              {patient.email} · {patient.phone}
              {patient.dni ? ` · DNI ${patient.dni}` : ''}
            </p>
          </div>
          <IdBadge id={patient.id} kind="paciente" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/admin/citas" className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Nueva cita</a>
          <a href="/admin/informes" className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Nuevo informe</a>
          <a href="/admin/facturas" className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Nueva factura</a>
          <a href="/admin/pagos" className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Registrar pago</a>
          <a href="/admin/documentos" className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25">Subir documento</a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Próxima cita" value={nextAppt ? fmtDateTime(nextAppt.date, nextAppt.time) : '—'} />
        <StatCard label="Facturas pendientes" value={pendingInv.length} tone="warn" />
        <StatCard label="Informes" value={rec.reports.length} />
        <StatCard label="Documentos" value={rec.documents.length} />
      </div>


      <Card title="Timeline de actividad">
        <ul className="timeline">
          {timeline.map((t) => (
            <li key={`${t.kind}-${t.id}`} className="timeline__item">
              <div className="flex flex-wrap items-center gap-2">
                <IdBadge id={t.id} kind={t.kind} />
                <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                <span className="text-xs text-slate-500">{fmtDate(t.at.slice(0, 10))}</span>
              </div>
            </li>
          ))}
        </ul>
        {!timeline.length ? <Empty title="Sin actividad" text="" /> : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Datos personales">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">DNI</dt><dd className="font-semibold">{patient.dni ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Nacimiento</dt><dd className="font-semibold">{patient.birthDate ? fmtDate(patient.birthDate) : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Alergias</dt><dd className="font-semibold">{patient.allergies ?? '—'}</dd></div>
          </dl>
        </Card>
        <Card title="Nota administrativa">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una nota interna…" />
          <Button
            className="mt-2"
            onClick={() => {
              if (!note.trim()) return;
              commit(addAdminNote(state, { patientId, body: note, createdAt: todayIso(), createdBy: 'Admin' }));
              setNote('');
              setNotice({ type: 'ok', message: 'Nota guardada.' });
            }}
          >
            Guardar nota
          </Button>
          <ul className="mt-3 space-y-2 text-sm">
            {rec.notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2">{n.body}</li>
            ))}
          </ul>
        </Card>
      </div>

      <RecordSection title="Historial de citas" empty="Sin citas">
        {rec.appointments.map((a) => (
          <li key={a.id} className="data-row">
            <IdBadge id={a.id} kind="cita" />
            <span className="text-sm font-semibold">{fmtDateTime(a.date, a.time)}</span>
            <Badge status={a.status} label={statusLabel(a.status)} />
          </li>
        ))}
      </RecordSection>

      <RecordSection title="Informes clínicos" empty="Sin informes">
        {rec.reports.map((r) => (
          <li key={r.id} className="data-row">
            <IdBadge id={r.id} kind="informe" />
            <span className="font-semibold">{r.title}</span>
            <span className="text-xs text-slate-500">{r.visibleToPatient ? 'Visible paciente' : 'Solo clínica'}</span>
            <FileActions fileRef={r.fileRef} fileName={r.fileName} mimeType={r.mimeType} />
          </li>
        ))}
      </RecordSection>

      <RecordSection title="Documentos" empty="Sin documentos">
        {rec.documents.map((d) => (
          <li key={d.id} className="data-row">
            <IdBadge id={d.id} kind="documento" />
            <span className="font-semibold">{d.title}</span>
            <span className="doc-file-badge">{d.type}</span>
            <FileActions fileRef={d.fileRef} fileName={d.fileName} mimeType={d.mimeType} />
          </li>
        ))}
      </RecordSection>

      <Card title={modeCopy('Mensajes al paciente (demo)', 'Mensajes al paciente')}>
        <div className="grid gap-3">
          <Field label="Asunto"><Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Recordatorio de cita…" /></Field>
          <Field label="Mensaje"><Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} /></Field>
          <Button
            onClick={async () => {
              if (!msgSubject.trim() || !msgBody.trim()) {
                setNotice({ type: 'error', message: 'Completa asunto y mensaje.' });
                return;
              }
              if (!isClientDemoMode()) {
                await fetch('/api/records/message', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    clinicId: patient.preferredClinicId,
                    patientId,
                    subject: msgSubject,
                    body: msgBody,
                    type: 'clinica',
                    channel: 'app'
                  })
                });
              }
              commit(
                addMessage(state, {
                  patientId,
                  subject: msgSubject,
                  body: msgBody,
                  type: 'clinica',
                  channel: 'app',
                  read: false,
                  sentAt: todayIso()
                })
              );
              if (!isClientDemoMode()) await refresh();
              setMsgSubject('');
              setMsgBody('');
              setNotice({
                type: 'ok',
                message: modeCopy('Mensaje demo enviado al portal del paciente.', 'Mensaje enviado al portal del paciente.')
              });
            }}
          >
            {modeCopy('Enviar mensaje demo', 'Enviar mensaje')}
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {rec.messages.map((m) => (
            <li key={m.id} className="rounded-xl bg-slate-50 px-3 py-2">
              <strong>{m.subject}</strong>
              <p className="text-slate-600">{m.body}</p>
            </li>
          ))}
        </ul>
      </Card>

      <RecordSection title="Facturas y pagos" empty="Sin movimientos">
        {rec.invoices.map((i) => (
          <li key={i.id} className="data-row">
            <IdBadge id={i.id} kind="factura" />
            <span>{i.concept} · {money(i.amount)}</span>
            <Badge status={i.status === 'pagada' ? 'completada' : 'pendiente'} label={i.status} />
            <FileActions fileRef={i.fileRef} fileName={i.fileName ?? `${i.id}.pdf`} mimeType={i.mimeType} />
          </li>
        ))}
        {rec.payments.map((p) => (
          <li key={p.id} className="data-row">
            <IdBadge id={p.id} kind="pago" />
            <span>{money(p.amount)} · {p.method}</span>
            <Badge status={p.status === 'completado' ? 'completada' : 'pendiente'} label={p.status} />
          </li>
        ))}
      </RecordSection>

    </div>
  );
}

export function AdminClinicalReports() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    patientId: state.patients[0]?.id ?? '',
    appointmentId: '',
    title: '',
    description: '',
    diagnosis: '',
    recommendations: '',
    fileName: '',
    visibleToPatient: true,
    uploadedBy: 'Admin clínica'
  });

  const list = useMemo(() => {
    let r = [...state.clinicalReports];
    if (patientQ.trim()) r = r.filter((x) => recordMatchesPatientQuery(state, x.patientId, patientQ));
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter(
        (x) =>
          x.id.toLowerCase().includes(s) ||
          patientName(state, x.patientId).toLowerCase().includes(s) ||
          x.title.toLowerCase().includes(s)
      );
    }
    return r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, q, patientQ]);

  async function save() {
    const err = required(form.patientId, 'Paciente') || required(form.title, 'Título') || required(form.description, 'Descripción');
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    let fileRef: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    if (reportFile) {
      if (!isPdfMime(reportFile.type, reportFile.name)) {
        setNotice({ type: 'error', message: 'El informe debe ser PDF.' });
        return;
      }
      try {
        fileRef = await saveDemoFile(reportFile);
        fileName = reportFile.name;
        mimeType = reportFile.type;
      } catch (e) {
        setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al subir.' });
        return;
      }
    }
    const reportInput = {
      patientId: form.patientId,
      appointmentId: form.appointmentId || undefined,
      title: form.title,
      description: form.description,
      diagnosis: form.diagnosis || undefined,
      recommendations: form.recommendations || undefined,
      fileName,
      fileRef,
      mimeType,
      uploadedBy: form.uploadedBy,
      visibleToPatient: form.visibleToPatient
    };
    if (!isClientDemoMode()) {
      const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
      if (clinicId) {
        await fetch('/api/records/report', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ clinicId, ...reportInput })
        });
      }
    }
    commit(createClinicalReport(state, reportInput));
    if (!isClientDemoMode()) await refresh();
    setNotice({ type: 'ok', message: 'Informe creado y vinculado al paciente.' });
    setForm({ ...form, title: '', description: '', diagnosis: '', recommendations: '' });
    setReportFile(null);
  }

  return (
    <div className="space-y-4">
      <div className="admin-search-bar">
        <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Filtrar por DNI o ID paciente…" />
        <SearchInput value={q} onChange={setQ} placeholder="Buscar informe por ID o título…" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card title={`Informes (${list.length})`}>
          <div className="table-cards">
            {list.map((r) => (
              <ReportRow key={r.id} r={r} />
            ))}
          </div>
          {!list.length ? <Empty title="Sin informes" text="Crea el primero desde el formulario." /> : null}
        </Card>
        <Card title="Nuevo informe">
          <div className="grid gap-3">
            <PatientLookup state={state} patientId={form.patientId} onPatientId={(id) => setForm({ ...form, patientId: id, appointmentId: '' })} />
            <Field label="Cita (motivo del informe)">
              <Select
                value={form.appointmentId}
                onChange={(e) => {
                  const appointmentId = e.target.value;
                  const autoTitle = appointmentId ? reportTitleFromAppointment(state, appointmentId) : '';
                  setForm({
                    ...form,
                    appointmentId,
                    title: autoTitle || form.title
                  });
                }}
              >
                <AppointmentOptions state={state} patientId={form.patientId} />
              </Select>
              <p className="mt-1 text-xs text-[var(--muted)]">El título se rellena según el tratamiento de la cita (ortodoncia, blanqueamiento…).</p>
            </Field>
            <Field label="Título *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Descripción *"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Diagnóstico"><Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></Field>
            <Field label="Recomendaciones"><Textarea value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></Field>
            <FileUpload
              label="Adjuntar informe (PDF)"
              hint="Opcional. Visible en portal si está marcado abajo."
              accept="application/pdf,.pdf"
              file={reportFile}
              onChange={setReportFile}
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form.visibleToPatient} onChange={(e) => setForm({ ...form, visibleToPatient: e.target.checked })} />
              Visible en portal del paciente
            </label>
            <Button onClick={() => void save()}>Guardar informe</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportRow({ r }: { r: ClinicalReport }) {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  return (
    <div className="data-row">
      <IdBadge id={r.id} kind="informe" />
      <div>
        <p className="font-bold">{r.title}</p>
        <p className="text-sm text-slate-600">{patientName(state, r.patientId)} · {fmtDate(r.createdAt)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <FileActions fileRef={r.fileRef} fileName={r.fileName} mimeType={r.mimeType} />
        <Button
          tone="ghost"
          className="!text-xs"
          onClick={() => {
            if (!isClientDemoMode()) {
              const clinicId = state.patients.find((p) => p.id === r.patientId)?.preferredClinicId;
              if (clinicId) {
                void fetch('/api/records/report', {
                  method: 'PATCH',
                  credentials: 'include',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ clinicId, id: r.id, visibleToPatient: !r.visibleToPatient })
                });
              }
            }
            commit(saveClinicalReport(state, { ...r, visibleToPatient: !r.visibleToPatient }));
            setNotice({ type: 'ok', message: 'Visibilidad actualizada.' });
          }}
        >
          {r.visibleToPatient ? 'Ocultar paciente' : 'Mostrar paciente'}
        </Button>
      </div>
    </div>
  );
}

export { AdminDocuments, AdminInvoices } from './uploadViews';

export function AdminPayments() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const [filter, setFilter] = useState('todos');
  const [q, setQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [form, setForm] = useState({
    patientId: state.patients[0]?.id ?? '',
    invoiceId: '',
    amount: 50,
    method: 'tarjeta' as Payment['method'],
    status: 'completado' as Payment['status'],
    paidAt: todayIso()
  });

  const list = useMemo(() => {
    let p = [...state.payments];
    if (filter !== 'todos') p = p.filter((x) => x.status === filter);
    if (patientQ.trim()) p = p.filter((x) => recordMatchesPatientQuery(state, x.patientId, patientQ));
    if (q.trim()) {
      const s = q.toLowerCase();
      p = p.filter(
        (x) =>
          x.id.toLowerCase().includes(s) ||
          patientName(state, x.patientId).toLowerCase().includes(s) ||
          (x.invoiceId?.toLowerCase().includes(s) ?? false)
      );
    }
    return p.sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
  }, [state, filter, q, patientQ]);

  async function save() {
    const err = required(form.patientId, 'Paciente') || positiveAmount(form.amount);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    if (!isClientDemoMode()) {
      const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
      if (clinicId) {
        await fetch('/api/billing/payment', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId,
            patientId: form.patientId,
            invoiceId: form.invoiceId || undefined,
            amount: form.amount,
            provider: form.method,
            status: form.status
          })
        });
      }
      await refresh();
      setNotice({ type: 'ok', message: 'Pago registrado en Supabase.' });
      return;
    }
    commit(
      createPayment(state, {
        patientId: form.patientId,
        invoiceId: form.invoiceId || undefined,
        amount: form.amount,
        method: form.method,
        status: form.status,
        paidAt: form.paidAt
      })
    );
    setNotice({ type: 'ok', message: 'Pago registrado.' });
  }

  const patientInvoices = state.invoices.filter((i) => i.patientId === form.patientId);

  return (
    <div className="space-y-4">
      <div className="admin-search-bar">
        <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Filtrar por DNI o PAT-XXXX…" />
        <SearchInput value={q} onChange={setQ} placeholder="ID pago, factura…" />
      </div>
      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { id: 'todos', label: 'Todos' },
          { id: 'completado', label: 'Completados' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'fallido', label: 'Fallidos' }
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card title="Pagos registrados">
          <Button tone="secondary" onClick={() => exportCsv(list.map((p) => ({
            id: p.id,
            paciente: patientName(state, p.patientId),
            factura: p.invoiceId ?? '',
            importe: p.amount,
            estado: p.status
          })), 'pagos.csv')}>Exportar CSV</Button>
          {list.map((p) => (
            <div key={p.id} className="table-cards__row mt-2">
              <IdBadge id={p.id} kind="pago" />
              <div>
                <p className="font-bold">{patientName(state, p.patientId)}</p>
                <p className="text-sm text-slate-600">{p.invoiceId ? `Factura ${p.invoiceId}` : 'Sin factura'} · {money(p.amount)}</p>
              </div>
              <Badge status={p.status === 'completado' ? 'completada' : 'pendiente'} label={p.status} />
            </div>
          ))}
        </Card>
        <Card title="Registrar pago">
          <div className="grid gap-3">
            <PatientLookup state={state} patientId={form.patientId} onPatientId={(id) => setForm({ ...form, patientId: id, invoiceId: '' })} />
            <Field label="Factura (opcional)">
              <Select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
                <option value="">Sin factura</option>
                {patientInvoices.map((i) => (
                  <option key={i.id} value={i.id}>{i.id} · {money(i.amount)} · {i.status}</option>
                ))}
              </Select>
            </Field>
            <Field label="Importe *"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
            <Field label="Método">
              <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as Payment['method'] })}>
                {(['efectivo', 'tarjeta', 'transferencia', 'seguro', 'otro'] as const).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Payment['status'] })}>
                <option value="completado">completado</option>
                <option value="pendiente">pendiente</option>
                <option value="fallido">fallido</option>
                <option value="reembolsado">reembolsado</option>
              </Select>
            </Field>
            <Field label="Fecha pago"><Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} /></Field>
            <Button onClick={save}>Registrar pago</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
