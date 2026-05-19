import { IdBadge } from '@/components/ui/IdBadge';

const ids = [
  { id: 'PAT-0001', kind: 'paciente' as const, text: 'Paciente' },
  { id: 'CIT-0004', kind: 'cita' as const, text: 'Cita' },
  { id: 'INF-0002', kind: 'informe' as const, text: 'Informe clínico' },
  { id: 'FAC-0003', kind: 'factura' as const, text: 'Factura' },
  { id: 'PAG-0005', kind: 'pago' as const, text: 'Pago' },
  { id: 'DOC-0006', kind: 'documento' as const, text: 'Documento' }
];

export function IdLegend() {
  return (
    <div className="id-legend">
      <p className="id-legend__title">Qué significa cada ID</p>
      <ul className="id-legend__list">
        {ids.map((row) => (
          <li key={row.id} className="id-legend__item">
            <IdBadge id={row.id} kind={row.kind} />
            <span className="text-xs font-semibold text-slate-600">{row.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
