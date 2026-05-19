import { RefreshCw } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { recentPatientActivity } from '@/lib/selectors';
import { IdBadge } from '@/components/ui/IdBadge';
import { Empty } from '@/components/ui';

/** Actividad admin → portal paciente */
export function AdminSyncFeed({ limit = 8 }: { limit?: number }) {
  const { state } = useDemoStore();
  const activity = recentPatientActivity(state, limit);

  return (
    <section className="admin-sync-feed">
      <div className="admin-sync-feed__header">
        <RefreshCw className="h-5 w-5 text-dental-600" aria-hidden />
        <div>
          <h2 className="font-display text-lg text-dental-950">Conexión con portal del paciente</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cuando publicas informes, facturas, documentos o pagos con un paciente, el portal del paciente se actualiza al instante en demo (localStorage).
          </p>
        </div>
      </div>
      <ul className="admin-sync-feed__list">
        {activity.map((a) => (
          <li key={`${a.kind}-${a.id}`} className="admin-sync-feed__item">
            <IdBadge id={a.id} kind={a.kind === 'factura' ? 'factura' : a.kind === 'informe' ? 'informe' : a.kind === 'pago' ? 'pago' : 'documento'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{a.label}</p>
              <p className="text-xs text-slate-500">
                Paciente <strong>{a.patientId}</strong> · visible en /paciente si aplica
              </p>
            </div>
          </li>
        ))}
      </ul>
      {!activity.length ? <Empty title="Sin actividad" text="Crea un informe, factura o documento para ver la sincronización." /> : null}
    </section>
  );
}
