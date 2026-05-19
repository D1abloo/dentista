type Kind = 'paciente' | 'cita' | 'informe' | 'factura' | 'pago' | 'documento' | 'tenant';

const styles: Record<Kind, string> = {
  paciente: 'id-badge--paciente',
  cita: 'id-badge--cita',
  informe: 'id-badge--informe',
  factura: 'id-badge--factura',
  pago: 'id-badge--pago',
  documento: 'id-badge--documento',
  tenant: 'id-badge--tenant'
};

export function IdBadge({ id, kind = 'paciente' }: { id: string; kind?: Kind }) {
  return (
    <span className={`id-badge ${styles[kind]}`} title={id}>
      {id}
    </span>
  );
}

export function kindFromId(id: string): Kind {
  const p = id.split('-')[0];
  if (p === 'PAT') return 'paciente';
  if (p === 'CIT') return 'cita';
  if (p === 'INF') return 'informe';
  if (p === 'FAC') return 'factura';
  if (p === 'PAG') return 'pago';
  return 'documento';
}
