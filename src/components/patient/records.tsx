import { useEffect, useMemo, useState } from 'react';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { createPayment } from '@/lib/demoStore';
import {
  downloadDemoFileRef,
  isImageMime,
  isPdfMime,
  openDemoFilePreview,
  resolveDemoFileUrl
} from '@/lib/demoFiles';
import { generateInvoicePdfFile } from '@/lib/pdfInvoice';
import { fmtDate, money } from '@/lib/format';
import {
  getPatientById,
  pendingInvoicesForPatient,
  visibleDocumentsForPatient,
  visibleReportsForPatient
} from '@/lib/selectors';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { isClientDemoMode } from '@/lib/appMode';
import type { Invoice } from '@/types/demo';
import { FileActions } from '@/components/shared/FileActions';
import { Badge, Button, Empty, PageHeader, SearchInput } from '@/components/ui';

async function downloadInvoicePdf(state: ReturnType<typeof useDemoStore>['state'], invoice: Invoice) {
  if (invoice.fileRef && downloadDemoFileRef(invoice.fileRef, invoice.fileName ?? `${invoice.id}.pdf`)) return;
  const patient = getPatientById(state, invoice.patientId);
  if (!patient) return;
  const settings = settingsFor(state, getStoredTenantId());
  const gen = await generateInvoicePdfFile(invoice, patient, settings);
  downloadDemoFileRef(gen.fileRef, gen.fileName);
}

export function PatientReports() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const portalAccess = usePortalAccess();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'view_report',
        pagePath: '/paciente/informes',
        resourceLabel: 'Consulta de informes clínicos'
      });
    }
  }, [portalAccess.active]);
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
      <PageHeader title="Mis informes" subtitle="Solo informes visibles para ti" />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar por título o diagnóstico…" />
      <div className="data-rows">
        {list.map((r) => (
          <article key={r.id} className="data-row">
            <div className="data-row__main">
              <p className="data-row__title">{r.title}</p>
              <p className="data-row__meta">{fmtDate(r.createdAt)} · {r.diagnosis ?? r.description.slice(0, 60)}</p>
              {r.recommendations ? <p className="data-row__meta">{r.recommendations}</p> : null}
            </div>
            <div className="data-row__aside">
              {r.fileRef ? (
                <FileActions
                  fileRef={r.fileRef}
                  fileName={r.fileName}
                  mimeType={r.mimeType}
                  onOpen={() => {
                    if (portalAccess.active) {
                      void logPortalAudit({
                        eventType: 'view_report',
                        pagePath: '/paciente/informes',
                        resourceLabel: r.title,
                        resourceId: r.id
                      });
                    }
                  }}
                />
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
      <PageHeader title="Mis documentos" subtitle="Consentimientos, radiografías y recibos" />
      <SearchInput value={q} onChange={setQ} placeholder="Buscar documento o tipo…" />
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((d) => {
          const previewUrl = d.fileRef ? resolveDemoFileUrl(d.fileRef) : null;
          const showImg = previewUrl && isImageMime(d.mimeType, d.fileName ?? d.fileRef);
          return (
            <article key={d.id} className="doc-tile">
              <div className="flex flex-wrap items-start justify-between gap-2">
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
                  <img src={previewUrl!} alt={d.title} className="max-h-48 w-full object-contain bg-slate-900/5" />
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
      <PageHeader title="Mis facturas" subtitle="Descarga PDF y gestiona el pago" />
      <div className="data-rows">
        {list.map((i) => (
          <article key={i.id} className="data-row">
            <div className="data-row__main">
              <p className="data-row__title">{i.concept}</p>
              <p className="data-row__meta">
                Emisión {fmtDate(i.issuedAt)}
                {i.dueDate ? ` · Vence ${fmtDate(i.dueDate)}` : ''} · {money(i.amount)}
              </p>
              {i.fileName ? (
                <p className="data-row__meta">
                  {isPdfMime(i.mimeType, i.fileName) ? 'PDF' : 'Archivo'}: {i.fileName}
                </p>
              ) : null}
            </div>
            <div className="data-row__aside">
            <Badge status={i.status === 'pagada' ? 'completada' : 'pendiente'} label={i.status} />
            <div className="flex flex-wrap gap-2">
              <FileActions fileRef={i.fileRef} fileName={i.fileName ?? `${i.id}.pdf`} mimeType={i.mimeType} />
              {i.status === 'pendiente' || i.status === 'vencida' ? (
                <Button
                  className="!text-xs"
                  onClick={async () => {
                    if (!isClientDemoMode()) {
                      const res = await fetch('/api/billing/stripe-checkout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          clinicId: patient.preferredClinicId,
                          patientId: patient.id,
                          invoiceId: i.id,
                          amount: i.amount,
                          concept: i.concept
                        })
                      });
                      const json = (await res.json()) as { data?: { checkoutUrl?: string }; error?: { message?: string } };
                      if (res.ok && json.data?.checkoutUrl) {
                        window.location.href = json.data.checkoutUrl;
                        return;
                      }
                      setNotice({ type: 'error', message: json.error?.message ?? 'No se pudo iniciar Stripe checkout.' });
                      return;
                    }
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
                  {isClientDemoMode() ? 'Pagar demo' : 'Pagar con Stripe'}
                </Button>
              ) : null}
            </div>
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
      <PageHeader title="Mis pagos" subtitle="Historial vinculado a tus facturas" />
      {totalPending > 0 ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
          Tienes {pending.length} factura(s) pendiente(s) por {money(totalPending)}.{' '}
          <a href="/paciente/facturas" className="underline">
            Ver facturas PDF
          </a>
        </div>
      ) : null}
      <div className="data-rows">
        {list.map((p) => {
          const inv = p.invoiceId ? state.invoices.find((i) => i.id === p.invoiceId) : undefined;
          return (
          <article key={p.id} className="data-row">
            <div className="data-row__main">
              <p className="data-row__title">{money(p.amount)}</p>
              <p className="data-row__meta">
                {inv ? inv.concept : 'Pago sin factura'} · {p.method} ·{' '}
                {p.paidAt ? fmtDate(p.paidAt) : fmtDate(p.createdAt)}
              </p>
            </div>
            <div className="data-row__aside">
            <Badge status={p.status === 'completado' ? 'completada' : 'pendiente'} label={p.status} />
            <Button
              tone="ghost"
              className="!text-xs"
              onClick={() => downloadDemoFileRef(`recibo-${p.id}`, `recibo-${p.id}.txt`)}
            >
              Descargar recibo demo
            </Button>
            </div>
          </article>
          );
        })}
      </div>
      {!list.length ? <Empty title="Sin pagos" text="" /> : null}
    </div>
  );
}
