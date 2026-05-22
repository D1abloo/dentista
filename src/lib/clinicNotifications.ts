import type {
  ClinicNotification,
  ClinicNotificationCategory,
  ClinicNotificationEntity,
  ClinicNotificationPriority,
  DemoState,
  NotificationPrefs
} from '@/types/demo';
import { displayInvoiceId, effectiveStatus } from '@/lib/invoiceAdmin';
import { displayPaymentId } from '@/lib/paymentAdmin';
import { patientName } from '@/lib/selectors';
import { getStoredTenantId } from '@/lib/demoStore';
import { todayIso } from '@/lib/format';

export const defaultNotificationPrefs = (): NotificationPrefs => ({
  categories: {
    citas: true,
    pacientes: true,
    documentos: true,
    informes: true,
    facturas: true,
    pagos: true,
    portal: true,
    sistema: true
  },
  channels: { panel: true, email: true, whatsapp: false, portal: true },
  alertNewAppointment: true,
  alertInvoiceDue: true,
  alertPaymentFailed: true,
  alertDocumentDownload: true,
  alertUploadError: true,
  alertInvalidToken: true,
  dailyDigest: false,
  urgentImmediate: true
});

function nid() {
  return `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function pushClinicNotification(
  state: DemoState,
  input: Omit<ClinicNotification, 'id' | 'tenantId' | 'read' | 'archived' | 'createdAt' | 'priority'> & {
    tenantId?: string;
    read?: boolean;
    archived?: boolean;
    createdAt?: string;
    priority?: ClinicNotificationPriority;
  }
): DemoState {
  const tenantId = input.tenantId ?? getStoredTenantId();
  const note: ClinicNotification = {
    ...input,
    id: nid(),
    tenantId,
    read: input.read ?? false,
    archived: input.archived ?? false,
    priority: input.priority ?? 'normal',
    createdAt: input.createdAt ?? new Date().toISOString()
  };
  const exists = state.clinicNotifications.some(
    (n) =>
      n.entityId === note.entityId &&
      n.entityType === note.entityType &&
      n.title === note.title &&
      !n.archived
  );
  if (exists) return state;
  return {
    ...state,
    clinicNotifications: [note, ...state.clinicNotifications].slice(0, 500)
  };
}

export function markNotificationRead(state: DemoState, id: string): DemoState {
  return {
    ...state,
    clinicNotifications: state.clinicNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  };
}

export function markAllNotificationsRead(state: DemoState, tenantId = getStoredTenantId()): DemoState {
  return {
    ...state,
    clinicNotifications: state.clinicNotifications.map((n) =>
      n.tenantId === tenantId ? { ...n, read: true } : n
    )
  };
}

export function archiveNotification(state: DemoState, id: string): DemoState {
  return {
    ...state,
    clinicNotifications: state.clinicNotifications.map((n) =>
      n.id === id ? { ...n, archived: true, read: true } : n
    )
  };
}

export function unreadCount(state: DemoState, tenantId = getStoredTenantId()): number {
  return state.clinicNotifications.filter((n) => n.tenantId === tenantId && !n.read && !n.archived).length;
}

function push(
  list: ClinicNotification[],
  tenantId: string,
  category: ClinicNotificationCategory,
  title: string,
  description: string,
  opts: {
    patientId?: string;
    entityType?: ClinicNotificationEntity;
    entityId?: string;
    priority?: ClinicNotificationPriority;
    read?: boolean;
    createdAt?: string;
  }
) {
  list.push({
    id: nid(),
    tenantId,
    category,
    title,
    description,
    patientId: opts.patientId,
    entityType: opts.entityType,
    entityId: opts.entityId,
    read: opts.read ?? false,
    archived: false,
    priority: opts.priority ?? 'normal',
    createdAt: opts.createdAt ?? new Date().toISOString()
  });
}

/** Genera notificaciones reales a partir del estado demo (sin datos decorativos). */
export function buildClinicNotificationsFromState(state: DemoState, tenantId = getStoredTenantId()): ClinicNotification[] {
  const out: ClinicNotification[] = [];
  const t = todayIso();

  state.appointments
    .filter((a) => a.tenantId === tenantId)
    .slice(0, 12)
    .forEach((a) => {
      const name = patientName(state, a.patientId);
      if (a.status === 'pendiente') {
        const treatment =
          state.treatments.find((t) => t.id === a.treatmentId)?.name ?? a.notes ?? 'consulta';
        push(out, tenantId, 'citas', 'Nueva cita solicitada', `${name} ha solicitado una nueva cita para ${treatment}.`, {
          patientId: a.patientId,
          entityType: 'appointment',
          entityId: a.id,
          priority: 'importante'
        });
      } else if (a.status === 'cancelada') {
        push(out, tenantId, 'citas', 'Cita cancelada', `${name} ha cancelado su cita del ${a.date} a las ${a.time}.`, {
          patientId: a.patientId,
          entityType: 'appointment',
          entityId: a.id,
          priority: 'importante'
        });
      } else if (a.status === 'confirmada') {
        push(out, tenantId, 'citas', 'Cita confirmada', `Cita de ${name} confirmada para ${a.date} ${a.time}.`, {
          patientId: a.patientId,
          entityType: 'appointment',
          entityId: a.id,
          read: true
        });
      } else if (a.status === 'no_asistio') {
        push(out, tenantId, 'citas', 'Paciente no asistió', `${name} no asistió a la cita del ${a.date}.`, {
          patientId: a.patientId,
          entityType: 'appointment',
          entityId: a.id,
          priority: 'urgente'
        });
      }
    });

  state.invoices
    .filter((i) => i.tenantId === tenantId)
    .forEach((inv) => {
      const name = patientName(state, inv.patientId);
      const fac = displayInvoiceId(inv);
      const st = effectiveStatus(inv, t);
      if (st === 'vencida') {
        push(out, tenantId, 'facturas', 'Factura vencida', `La factura ${fac} de ${name} ha vencido.`, {
          patientId: inv.patientId,
          entityType: 'invoice',
          entityId: inv.id,
          priority: 'urgente'
        });
      } else if (st === 'pendiente') {
        push(out, tenantId, 'facturas', 'Factura pendiente de pago', `La factura ${fac} de ${name} está pendiente de pago.`, {
          patientId: inv.patientId,
          entityType: 'invoice',
          entityId: inv.id,
          priority: 'importante'
        });
      } else if (st === 'pagada') {
        push(out, tenantId, 'facturas', 'Factura pagada', `La factura ${fac} de ${name} ha sido marcada como pagada.`, {
          patientId: inv.patientId,
          entityType: 'invoice',
          entityId: inv.id,
          read: true
        });
      }
      if (inv.sentAt) {
        push(out, tenantId, 'facturas', 'Factura enviada al paciente', `Factura ${fac} enviada correctamente al portal del paciente.`, {
          patientId: inv.patientId,
          entityType: 'invoice',
          entityId: inv.id,
          read: true
        });
      }
    });

  state.payments
    .filter((p) => p.tenantId === tenantId)
    .forEach((p) => {
      const name = patientName(state, p.patientId);
      const pid = displayPaymentId(p);
      if (p.status === 'completado') {
        push(out, tenantId, 'pagos', 'Pago completado', `Pago de ${p.amount.toFixed(2).replace('.', ',')} € registrado para ${name}.`, {
          patientId: p.patientId,
          entityType: 'payment',
          entityId: p.id,
          read: true
        });
      } else if (p.status === 'pendiente') {
        push(out, tenantId, 'pagos', 'Pago pendiente', `El pago ${pid} de ${name} está pendiente.`, {
          patientId: p.patientId,
          entityType: 'payment',
          entityId: p.id,
          priority: 'importante'
        });
      } else if (p.status === 'fallido') {
        push(out, tenantId, 'pagos', 'Pago fallido', `El pago de ${name} ha fallado.`, {
          patientId: p.patientId,
          entityType: 'payment',
          entityId: p.id,
          priority: 'urgente'
        });
      }
    });

  state.patientDocuments
    .filter((d) => d.tenantId === tenantId)
    .slice(0, 6)
    .forEach((d) => {
      const name = patientName(state, d.patientId);
      push(out, tenantId, 'documentos', 'Documento vinculado', `Nuevo documento «${d.title}» vinculado a ${name}.`, {
        patientId: d.patientId,
        entityType: 'document',
        entityId: d.id
      });
    });

  state.clinicalReports
    .filter((r) => r.tenantId === tenantId)
    .slice(0, 5)
    .forEach((r) => {
      const name = patientName(state, r.patientId);
      if (r.visibleToPatient) {
        push(out, tenantId, 'informes', 'Informe en portal', `El informe de ${name} está disponible en el portal.`, {
          patientId: r.patientId,
          entityType: 'report',
          entityId: r.id
        });
      } else {
        push(out, tenantId, 'informes', 'Informe pendiente', `Informe «${r.title}» de ${name} pendiente de publicar.`, {
          patientId: r.patientId,
          entityType: 'report',
          entityId: r.id,
          priority: 'importante'
        });
      }
    });

  state.patients.slice(0, 3).forEach((p) => {
    push(out, tenantId, 'portal', 'Acceso al portal', `${p.fullName} ha accedido al portal del paciente.`, {
      patientId: p.id,
      entityType: 'patient',
      entityId: p.id
    });
  });

  push(out, tenantId, 'sistema', 'Recordatorio enviado', 'Recordatorio de cita enviado a pacientes con cita próxima.', {
    priority: 'normal',
    read: true
  });

  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function ensureClinicNotifications(state: DemoState, tenantId = getStoredTenantId()): DemoState {
  const existing = state.clinicNotifications.filter((n) => n.tenantId === tenantId);
  if (existing.length >= 8) return state;
  const built = buildClinicNotificationsFromState(state, tenantId);
  const merged = [...existing];
  for (const n of built) {
    if (merged.length >= 80) break;
    if (!merged.some((x) => x.entityId === n.entityId && x.title === n.title)) merged.push(n);
  }
  return { ...state, clinicNotifications: merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}
