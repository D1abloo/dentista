import type { ClinicNotification, ClinicNotificationCategory, DemoState } from '@/types/demo';
import { patientLine } from '@/lib/paymentAdmin';

export type NotificationDateRange = 'hoy' | '7d' | 'mes' | 'todas';
export type NotificationListFilter =
  | 'todas'
  | 'no_leidas'
  | 'urgentes'
  | 'citas'
  | 'pacientes'
  | 'documentos'
  | 'informes'
  | 'facturas'
  | 'pagos'
  | 'portal'
  | 'sistema';

const CATEGORY_MAP: Record<NotificationListFilter, ClinicNotificationCategory | null> = {
  todas: null,
  no_leidas: null,
  urgentes: null,
  citas: 'citas',
  pacientes: 'pacientes',
  documentos: 'documentos',
  informes: 'informes',
  facturas: 'facturas',
  pagos: 'pagos',
  portal: 'portal',
  sistema: 'sistema'
};

export function filterNotifications(
  list: ClinicNotification[],
  state: DemoState,
  filter: NotificationListFilter,
  range: NotificationDateRange,
  query = ''
): ClinicNotification[] {
  const now = new Date();
  let out = list.filter((n) => !n.archived);

  if (range === 'hoy') {
    const day = now.toISOString().slice(0, 10);
    out = out.filter((n) => n.createdAt.startsWith(day));
  } else if (range === '7d') {
    const cut = new Date(now);
    cut.setDate(cut.getDate() - 7);
    out = out.filter((n) => new Date(n.createdAt) >= cut);
  } else if (range === 'mes') {
    const prefix = now.toISOString().slice(0, 7);
    out = out.filter((n) => n.createdAt.startsWith(prefix));
  }

  if (filter === 'no_leidas') out = out.filter((n) => !n.read);
  else if (filter === 'urgentes') out = out.filter((n) => n.priority === 'urgente');
  else {
    const cat = CATEGORY_MAP[filter];
    if (cat) out = out.filter((n) => n.category === cat);
  }

  const q = query.trim().toLowerCase();
  if (q) {
    out = out.filter((n) => {
      const pl = n.patientId ? patientLine(state, n.patientId).toLowerCase() : '';
      return (
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.category.includes(q) ||
        pl.includes(q)
      );
    });
  }

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function notificationKpis(list: ClinicNotification[]) {
  const active = list.filter((n) => !n.archived);
  return {
    unread: active.filter((n) => !n.read).length,
    urgent: active.filter((n) => n.priority === 'urgente' && !n.read).length,
    pacientes: active.filter((n) => n.category === 'pacientes').length,
    citas: active.filter((n) => n.category === 'citas').length,
    facturas: active.filter((n) => n.category === 'facturas').length,
    pagos: active.filter((n) => n.category === 'pagos').length
  };
}

export function categoryLabel(c: ClinicNotificationCategory): string {
  const map: Record<ClinicNotificationCategory, string> = {
    citas: 'Citas',
    pacientes: 'Pacientes',
    documentos: 'Documentos',
    informes: 'Informes',
    facturas: 'Facturación',
    pagos: 'Pagos',
    portal: 'Portal paciente',
    sistema: 'Sistema'
  };
  return map[c] ?? c;
}

export function priorityLabel(p: ClinicNotification['priority']) {
  if (p === 'urgente') return 'Urgente';
  if (p === 'importante') return 'Importante';
  return 'Normal';
}

export function actionRoute(n: ClinicNotification): string {
  if (n.entityType === 'message' && n.patientId) {
    const q = n.entityId ? `&focus=${encodeURIComponent(n.entityId)}` : '';
    return `/admin/pacientes/${n.patientId}?tab=mensajes${q}`;
  }
  if (n.entityType === 'appointment') return '/admin/citas';
  if (n.entityType === 'patient') return n.patientId ? `/admin/pacientes/${n.patientId}` : '/admin/pacientes';
  if (n.entityType === 'document') return '/admin/documentos';
  if (n.entityType === 'report') return '/admin/informes';
  if (n.entityType === 'invoice') return '/admin/facturas';
  if (n.entityType === 'payment') return '/admin/pagos';
  return '/admin/notificaciones';
}
