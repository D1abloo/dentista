import { useMemo, useState } from 'react';
import { createPayment } from '@/lib/demoStore';
import { downloadDemoFileRef, getDemoFile, isImageMime, isPdfMime, openDemoFilePreview } from '@/lib/demoFiles';
import { generateInvoicePdfFile } from '@/lib/pdfInvoice';
import { fmtDate, money } from '@/lib/format';
import {
  getPatientById,
  pendingInvoicesForPatient,
  visibleDocumentsForPatient,
  visibleReportsForPatient
} from '@/lib/selectors';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import type { Invoice } from '@/types/demo';
import { IdBadge } from '@/components/ui/IdBadge';
import { FileActions } from '@/components/shared/FileActions';
import { Badge, Button, Empty, PageHeader, SearchInput } from '@/components/ui';

async function downloadInvoicePdf(state: ReturnType<typeof useDemoStore>['state'], invoice: Invoice) {
  if (invoice.fileRef && downloadDemoFileRef(invoice.fileRef, invoice.fileName ?? `${invoice.id}.pdf`)) return;
  const patient = getPatientById(state, invoice.patientId);
  if (!patient) return;
  const gen = await generateInvoicePdfFile(invoice, patient);
  downloadDemoFileRef(gen.fileRef, gen.fileName);
}

export function PatientReports() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    let r = visibleReportsForPatient(state, patient.id);
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((x) => x.id.toLowerCase().includes(s) || x.title.toLowerCase().includes(s));
    }
    return r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, patient.id, q]);

  return (
    <div className="space-y-4">
      <PageHeader title="Mis informes" subtitle="INF-XXXX · solo informes visibles para ti" />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por ID o título…" />
      <div className="table-cards">
        {list.map((r) => (
          <article key={r.id} className="table-cards__row">
            <IdBadge id={r.id} kind="informe" />
            <div>
              <p className="font-bold">{r.title}</p>
              <p className="text-sm text-slate-600">{fmtDate(r.createdAt)} · {r.diagnosis ?? r.description.slice(0, 60)}</p>
              {r.recommendations ? <p className="mt-1 text-xs text-slate-500">{r.recommendations}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {r.fileRef ? (
                <FileActions fileRef={r.fileRef} fileName={r.fileName} mimeType={r.mimeType} />
              ) : (
                <Button tone="ghost" className="!text-xs" disabled>
                  Sin PDF adjunto
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!list.length ? <Empty title="Sin informes" text="Cuando la clínica suba un informe visible, aparecerá aquí." /> : null}
    </div>
  );
}

export function PatientDocuments() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    let d = visibleDocumentsForPatient(state, patient.id);
    if (q.trim()) {
      const s = q.toLowerCase();
      d = d.filter((x) => x.id.toLowerCase().includes(s) || x.title.toLowerCase().includes(s) || x.type.includes(s));
    }
    return d.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, patient.id, q]);

  return (
    <div className="space-y-4">
      <PageHeader title="Mis documentos" subtitle="DOC-XXXX · consentimientos, radiografías y recibos" />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar documento o tipo…" />
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((d) => {
          const stored = d.fileRef ? getDemoFile(d.fileRef) : null;
          const showImg = stored && isImageMime(stored.mimeType, stored.name);
          return (
            <article key={d.id} className="doc-tile">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <IdBadge id={d.id} kind="documento" />
                <span className="doc-file-badge">{d.type}</span>
              </div>
              <p className="mt-2 font-bold text-dental-950">{d.title}</p>
              <p className="text-sm text-slate-600">{fmtDate(d.createdAt)}</p>
              {d.description ? <p className="mt-1 text-xs text-slate-500">{d.description}</p> : null}
              {showImg ? (
                <button
                  type="button"
                  className="mt-3 block w-full overflow-hidden rounded-xl ring-1 ring-slate-200"
                  onClick={() => openDemoFilePreview(d.fileRef!)}
                >
                  <img src={stored!.dataUrl} alt={d.title} className="max-h-48 w-full object-contain bg-slate-900/5" />
                </button>
              ) : null}
              <div className="mt-3">
                <FileActions fileRef={d.fileRef} fileName={d.fileName} mimeType={d.mimeType} />
              </div>
            </article>
          );
        })}
      </div>
      {!list.length ? <Empty title="Sin documentos" text="Los documentos solo-admin no se muestran." /> : null}
    </div>
  );
}

export function PatientInvoices() {
  const { state, commit } = useDemoStore();
  const patient = usePatient();
  const { setNotice } = useNotice();
  const list = state.invoices.filter((i) => i.patientId === patient.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  return (
    <div className="space-y-4">
      <PageHeader title="Mis facturas" subtitle="FAC-XXXX · descarga PDF y pago demo" />
      <div className="table-cards">
        {list.map((i) => (
          <article key={i.id} className="table-cards__row">
            <IdBadge id={i.id} kind="factura" />
            <div>
              <p className="font-bold">{i.concept}</p>
              <p className="text-sm text-slate-600">
                Emisión {fmtDate(i.issuedAt)}
                {i.dueDate ? ` · Vence ${fmtDate(i.dueDate)}` : ''}
              </p>
              <p className="font-bold text-dental-800">{money(i.amount)}</p>
              {i.fileName ? (
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {isPdfMime(i.mimeType, i.fileName) ? 'PDF' : 'Archivo'}: {i.fileName}
                </p>
              ) : null}
            </div>
            <Badge status={i.status === 'pagada' ? 'completada' : 'pendiente'} label={i.status} />
            <div className="flex flex-wrap gap-2">
              <FileActions fileRef={i.fileRef} fileName={i.fileName ?? `${i.id}.pdf`} mimeType={i.mimeType} />
              {i.status === 'pendiente' || i.status === 'vencida' ? (
                <Button
                  className="!text-xs"
                  onClick={() => {
                    commit(
                      createPayment(state, {
                        patientId: patient.id,
                        invoiceId: i.id,
                        amount: i.amount,
                        method: 'tarjeta',
                        status: 'completado',
                        paidAt: new Date().toISOString().slice(0, 10)
                      })
                    );
                    setNotice({ type: 'ok', message: 'Pago demo registrado. Factura marcada como pagada.' });
                  }}
                >
                  Pagar demo
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!list.length ? <Empty title="Sin facturas" text="Tus facturas en PDF aparecerán aquí cuando la clínica las emita." /> : null}
    </div>
  );
}

export function PatientPayments() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const list = state.payments.filter((p) => p.patientId === patient.id).sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
  const pending = pendingInvoicesForPatient(state, patient.id);
  const totalPending = pending.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Mis pagos" subtitle="PAG-XXXX · vinculados a facturas" />
      {totalPending > 0 ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
          Tienes {pending.length} factura(s) pendiente(s) por {money(totalPending)}.{' '}
          <a href="/paciente/facturas" className="underline">
            Ver facturas PDF
          </a>
        </div>
      ) : null}
      <div className="table-cards">
        {list.map((p) => (
          <article key={p.id} className="table-cards__row">
            <IdBadge id={p.id} kind="pago" />
            <div>
              <p className="font-bold">{money(p.amount)}</p>
              <p className="text-sm text-slate-600">
                {p.invoiceId ? `Factura ${p.invoiceId}` : 'Sin factura'} · {p.method} ·{' '}
                {p.paidAt ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
              </p>
            </div>
            <Badge status={p.status === 'completado' ? 'completada' : 'pendiente'} label={p.status} />
            <Button
              tone="ghost"
              className="!text-xs"
              onClick={() => downloadDemoFileRef(`recibo-${p.id}`, `recibo-${p.id}.txt`)}
            >
              Descargar recibo demo
            </Button>
          </article>
        ))}
      </div>
      {!list.length ? <Empty title="Sin pagos" text="" /> : null}
    </div>
  );
}
