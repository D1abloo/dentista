import { useState } from 'react';
import { createPayment } from '@/lib/demoStore';
import { downloadDemoFileRef, isPdfMime } from '@/lib/demoFiles';
import { generateInvoicePdfFile } from '@/lib/pdfInvoice';
import { fmtDate, money } from '@/lib/format';
import { getPatientById, pendingInvoicesForPatient } from '@/lib/selectors';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { isClientDemoMode } from '@/lib/appMode';
import type { Invoice } from '@/types/demo';
import { FileActions } from '@/components/shared/FileActions';
import { Badge, Button, Empty, PageHeader } from '@/components/ui';

async function downloadInvoicePdf(state: ReturnType<typeof useDemoStore>['state'], invoice: Invoice) {
  if (invoice.fileRef && downloadDemoFileRef(invoice.fileRef, invoice.fileName ?? `${invoice.id}.pdf`)) return;
  const patient = getPatientById(state, invoice.patientId);
  if (!patient) return;
  const settings = settingsFor(state, getStoredTenantId());
  const gen = await generateInvoicePdfFile(invoice, patient, settings);
  downloadDemoFileRef(gen.fileRef, gen.fileName);
}

export { PatientReports } from './PatientReports';
export { PatientDocuments } from './PatientDocuments';

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
