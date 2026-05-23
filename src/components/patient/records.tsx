import { useMemo } from 'react';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import { fmtDate, money } from '@/lib/format';
import { pendingInvoicesForPatient } from '@/lib/selectors';
import { useDemoStore } from '@/hooks/useDemoStore';
import { usePatient } from '@/hooks/usePatient';
import { Badge, Button, Empty, PageHeader } from '@/components/ui';

export { PatientReports } from './PatientReports';
export { PatientDocuments } from './PatientDocuments';
export { PatientInvoices } from './PatientInvoices';

export function PatientPayments() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const invoiceFilter = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('factura') ?? '';
  }, []);
  const list = state.payments
    .filter((p) => p.patientId === patient.id)
    .filter((p) => !invoiceFilter || p.invoiceId === invoiceFilter)
    .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
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
