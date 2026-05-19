import { Link2 } from 'lucide-react';
import { IdBadge } from '@/components/ui/IdBadge';
import { usePatient } from '@/hooks/usePatient';
import { useDemoStore } from '@/hooks/useDemoStore';
import { isActiveStatus } from '@/lib/appointments';
import { pendingInvoicesForPatient, visibleDocumentsForPatient, visibleReportsForPatient } from '@/lib/selectors';

/** Bloque destacado: tu información conectada por PAT-XXXX */
export function ConnectedIdsShowcase() {
  const { state } = useDemoStore();
  const patient = usePatient();
  const next = state.appointments
    .filter((a) => a.patientId === patient.id && isActiveStatus(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const report = visibleReportsForPatient(state, patient.id)[0];
  const invoice = pendingInvoicesForPatient(state, patient.id)[0];
  const payment = state.payments.filter((p) => p.patientId === patient.id)[0];
  const doc = visibleDocumentsForPatient(state, patient.id)[0];

  const rows = [
    { id: patient.id, kind: 'paciente' as const, label: 'Paciente actual', href: '/paciente/perfil' },
    next ? { id: next.id, kind: 'cita' as const, label: 'Próxima cita', href: '/paciente/citas' } : null,
    report ? { id: report.id, kind: 'informe' as const, label: 'Informe disponible', href: '/paciente/informes' } : null,
    invoice ? { id: invoice.id, kind: 'factura' as const, label: 'Factura pendiente', href: '/paciente/facturas' } : null,
    payment ? { id: payment.id, kind: 'pago' as const, label: 'Pago registrado', href: '/paciente/pagos' } : null,
    doc ? { id: doc.id, kind: 'documento' as const, label: 'Documento nuevo', href: '/paciente/documentos' } : null
  ].filter(Boolean) as Array<{ id: string; kind: 'paciente' | 'cita' | 'informe' | 'factura' | 'pago' | 'documento'; label: string; href: string }>;

  return (
    <section className="connected-ids">
      <div className="connected-ids__header">
        <Link2 className="h-5 w-5 text-dental-600" aria-hidden />
        <div>
          <h2 className="font-display text-lg text-dental-950">Tu información conectada</h2>
          <p className="mt-1 text-sm text-slate-600">
            Todo lo que la clínica registra en administración con tu ID de paciente aparece aquí cuando está vinculado y visible.
          </p>
        </div>
      </div>
      <ul className="connected-ids__grid">
        {rows.map((r) => (
          <li key={r.id}>
            <a href={r.href} className="connected-ids__card">
              <IdBadge id={r.id} kind={r.kind} />
              <span className="connected-ids__label">{r.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
