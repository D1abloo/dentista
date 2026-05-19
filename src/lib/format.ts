export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateTime(iso: string, time: string) {
  return `${fmtDate(iso)} · ${time}`;
}

export function money(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_asistio: 'No asistió',
    reprogramada: 'Reprogramada',
    pagado: 'Pagado',
    pendiente_pago: 'Pendiente'
  };
  return map[status] ?? status;
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
