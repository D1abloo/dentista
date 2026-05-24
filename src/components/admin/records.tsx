import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { addAdminNote } from '@/lib/demoStore';
import { isActiveStatus } from '@/lib/appointments';
import { fmtDate, fmtDateTime, money, statusLabel, todayIso } from '@/lib/format';
import { recordsForPatient } from '@/lib/selectors';
import { modeCopy } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { IdBadge } from '@/components/ui/IdBadge';
import { FileActions } from '@/components/shared/FileActions';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  StatCard,
  Textarea
} from '@/components/ui';
import { PatientMessageThread } from './PatientMessageThread';

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
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'mensajes') {
      document.getElementById('mensajes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setFocusMessageId(params.get('focus'));
  }, [patientId]);

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

      <PatientMessageThread patient={patient} focusMessageId={focusMessageId} />

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

export { AdminDocuments, AdminInvoices } from './uploadViews';

export { AdminPayments } from './AdminPayments';
