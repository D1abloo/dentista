import { useMemo, useState } from 'react';
import {
  createInvoice,
  exportCsv,
  getStoredTenantId,
  saveInvoice
} from '@/lib/demoStore';
import { isPdfMime, saveDemoFile } from '@/lib/demoFiles';
import { nextInvoiceId } from '@/lib/ids';
import { invoiceConceptFromAppointment } from '@/lib/clinical';
import { generateInvoicePdfFile } from '@/lib/pdfInvoice';
import { settingsFor } from '@/lib/demoStore';
import { recordMatchesPatientQuery } from '@/lib/patientSearch';
import { fmtDate, money, todayIso } from '@/lib/format';
import { getPatientById, patientName } from '@/lib/selectors';
import { positiveAmount, required } from '@/lib/validation';
import { modeCopy } from '@/lib/appMode';
import { isClientDemoMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { useNotice } from '@/hooks/useNotice';
import type { Invoice } from '@/types/demo';
import { IdBadge } from '@/components/ui/IdBadge';
import { FileActions } from '@/components/shared/FileActions';
import { PatientLookup } from './PatientLookup';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  FileUpload,
  Input,
  SearchInput,
  Select,
  Textarea
} from '@/components/ui';

function AppointmentOptions({
  appointments,
  patientId
}: {
  appointments: ReturnType<typeof useDemoStore>['state']['appointments'];
  patientId: string;
}) {
  const appts = appointments.filter((a) => a.patientId === patientId);
  return (
    <>
      <option value="">Sin cita vinculada</option>
      {appts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.id} · {fmtDate(a.date)} {a.time}
        </option>
      ))}
    </>
  );
}

export { AdminDocuments } from './AdminDocuments';

export function AdminInvoices() {
  const { state, commit, refresh } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const [q, setQ] = useState('');
  const [patientQ, setPatientQ] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [autoPdf, setAutoPdf] = useState(true);
  const tenantId = getStoredTenantId();
  const clinicSettings = settingsFor(state, tenantId);
  const [form, setForm] = useState({
    patientId: state.patients[0]?.id ?? '',
    appointmentId: '',
    concept: clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos',
    amount: 80,
    status: 'pendiente' as Invoice['status'],
    issuedAt: todayIso(),
    dueDate: ''
  });

  const list = useMemo(() => {
    let inv = [...scope.invoices];
    if (patientQ.trim()) inv = inv.filter((x) => recordMatchesPatientQuery(state, x.patientId, patientQ));
    if (q.trim()) {
      const s = q.toLowerCase();
      inv = inv.filter(
        (x) =>
          x.id.toLowerCase().includes(s) ||
          patientName(state, x.patientId).toLowerCase().includes(s) ||
          recordMatchesPatientQuery(state, x.patientId, q)
      );
    }
    return inv.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [state, scope.invoices, q, patientQ]);

  async function save() {
    const err =
      required(form.patientId, 'Paciente') ||
      required(form.concept, 'Concepto') ||
      positiveAmount(form.amount);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const patient = getPatientById(state, form.patientId);
    if (!patient) {
      setNotice({ type: 'error', message: 'Paciente no encontrado.' });
      return;
    }
    const id = nextInvoiceId(state);
    let fileRef: string | undefined;
    let fileName: string | undefined;
    let mimeType = 'application/pdf';

    if (pdfFile) {
      if (!isPdfMime(pdfFile.type, pdfFile.name)) {
        setNotice({ type: 'error', message: 'La factura debe ser PDF.' });
        return;
      }
      try {
        fileRef = await saveDemoFile(pdfFile);
        fileName = pdfFile.name.toLowerCase().endsWith('.pdf') ? pdfFile.name : `${pdfFile.name}.pdf`;
      } catch (e) {
        setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al subir PDF.' });
        return;
      }
    } else if (autoPdf) {
      try {
        const draft: Invoice = {
          id,
          tenantId: getStoredTenantId(),
          patientId: form.patientId,
          appointmentId: form.appointmentId || undefined,
          amount: form.amount,
          concept: form.concept,
          status: form.status,
          issuedAt: form.issuedAt,
          dueDate: form.dueDate || undefined
        };
        const gen = await generateInvoicePdfFile(draft, patient, clinicSettings);
        fileRef = gen.fileRef;
        fileName = gen.fileName;
      } catch (e) {
        setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo generar PDF.' });
        return;
      }
    } else {
      setNotice({ type: 'error', message: 'Sube un PDF o activa generación automática.' });
      return;
    }

    const payload = {
      id,
      patientId: form.patientId,
      appointmentId: form.appointmentId || undefined,
      amount: form.amount,
      concept: form.concept,
      status: form.status,
      issuedAt: form.issuedAt,
      dueDate: form.dueDate || undefined,
      fileRef,
      fileName,
      mimeType
    };
    if (!isClientDemoMode()) {
      const clinicId = state.patients.find((p) => p.id === form.patientId)?.preferredClinicId;
      if (clinicId) {
        await fetch('/api/billing/invoice', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            clinicId,
            patientId: form.patientId,
            appointmentId: form.appointmentId || undefined,
            amount: form.amount,
            concept: form.concept,
            status: form.status,
            dueDate: form.dueDate || undefined
          })
        });
      }
      await refresh();
      setNotice({ type: 'ok', message: 'Factura guardada en Supabase.' });
      setForm({ ...form, concept: clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos' });
      setPdfFile(null);
      return;
    }
    commit(createInvoice(state, payload));
    setNotice({ type: 'ok', message: 'Factura PDF creada.' });
    setForm({ ...form, concept: '' });
    setPdfFile(null);
  }

  return (
    <div className="space-y-4">
      <div className="admin-search-bar">
        <SearchInput value={patientQ} onChange={setPatientQ} placeholder="Buscar por DNI o PAT-XXXX…" />
        <SearchInput value={q} onChange={setQ} placeholder="ID factura o concepto…" />
      </div>
      <Button
        tone="secondary"
        onClick={() =>
          exportCsv(
            list.map((i) => ({
              id: i.id,
              paciente: patientName(state, i.patientId),
              concepto: i.concept,
              importe: i.amount,
              estado: i.status,
              pdf: i.fileName ?? ''
            })),
            'facturas.csv'
          )
        }
      >
        {modeCopy('Exportar CSV demo', 'Exportar CSV')}
      </Button>
      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <Card title="Listado">
          {list.map((i) => (
            <div key={i.id} className="table-cards__row mb-2">
              <IdBadge id={i.id} kind="factura" />
              <div>
                <p className="font-bold">{i.concept}</p>
                <p className="text-sm text-slate-600">{patientName(state, i.patientId)} · {money(i.amount)}</p>
                {i.fileName ? <p className="text-xs text-slate-500">{i.fileName}</p> : null}
              </div>
              <Badge status={i.status === 'pagada' ? 'completada' : 'pendiente'} label={i.status} />
              <div className="flex flex-wrap gap-1">
                <FileActions fileRef={i.fileRef} fileName={i.fileName ?? `${i.id}.pdf`} mimeType={i.mimeType} />
                <Button
                  tone="ghost"
                  className="!text-xs"
                  onClick={() => {
                    commit(saveInvoice(state, { ...i, status: 'pagada' }));
                    setNotice({ type: 'ok', message: 'Factura marcada como pagada.' });
                  }}
                >
                  Marcar pagada
                </Button>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Nueva factura (PDF)">
          <div className="grid gap-3">
            <PatientLookup state={state} patientId={form.patientId} onPatientId={(id) => setForm({ ...form, patientId: id, appointmentId: '' })} />
            <Field label="Cita (opcional)">
              <Select
                value={form.appointmentId}
                onChange={(e) => {
                  const appointmentId = e.target.value;
                  const concept = appointmentId
                    ? invoiceConceptFromAppointment(
                        state,
                        appointmentId,
                        clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos'
                      )
                    : clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos';
                  const appt = state.appointments.find((a) => a.id === appointmentId);
                  setForm({
                    ...form,
                    appointmentId,
                    concept,
                    amount: appt
                      ? state.treatments.find((t) => t.id === appt.treatmentId)?.price ?? form.amount
                      : form.amount
                  });
                }}
              >
                <AppointmentOptions appointments={scope.appointments} patientId={form.patientId} />
              </Select>
            </Field>
            <Field label="Concepto factura *">
              <Input value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Nombre por defecto: {clinicSettings.defaultInvoiceConcept ?? 'Servicios odontológicos'}
              </p>
            </Field>
            <Field label="Importe *"><Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
            <Field label="Emisión"><Input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} /></Field>
            <Field label="Vencimiento"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
            <Field label="Estado">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Invoice['status'] })}>
                <option value="pendiente">pendiente</option>
                <option value="pagada">pagada</option>
                <option value="vencida">vencida</option>
                <option value="cancelada">cancelada</option>
              </Select>
            </Field>
            <FileUpload
              label="Subir factura PDF"
              hint="O deja vacío para generar PDF automático."
              accept="application/pdf,.pdf"
              file={pdfFile}
              onChange={(f) => {
                setPdfFile(f);
                if (f) setAutoPdf(false);
              }}
            />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={autoPdf}
                onChange={(e) => {
                  setAutoPdf(e.target.checked);
                  if (e.target.checked) setPdfFile(null);
                }}
              />
              Generar PDF automático si no subes archivo
            </label>
            <Button onClick={() => void save()}>Crear factura PDF</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
