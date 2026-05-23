import { getClinicsDemo } from '@/lib/platform/clinicsDemo';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
export type TicketOrigin = 'public_portal' | 'clinic_portal' | 'patient' | 'staff' | 'system';
export type TicketType = 'patient' | 'clinic' | 'staff' | 'system' | 'billing';

export type TicketTimelineEvent = {
  id: string;
  message: string;
  actor: string;
  at_label: string;
  created_at: string;
  tone: 'info' | 'warn' | 'success' | 'system';
};

export type TicketReply = {
  id: string;
  body: string;
  actor: string;
  at_label: string;
  created_at: string;
  send_copy: boolean;
};

export type SupportTicketRow = {
  id: string;
  ticket_code: string;
  subject: string;
  origin: TicketOrigin;
  origin_label: string;
  clinic_id: string | null;
  clinic_name: string;
  tenant_slug: string | null;
  requester_name: string;
  requester_email: string;
  type: TicketType;
  type_label: string;
  priority: TicketPriority;
  priority_label: string;
  status: TicketStatus;
  status_label: string;
  message: string;
  assignee_id: string | null;
  assignee_name: string;
  last_activity_label: string;
  last_activity_date: string;
  created_at: string;
  created_label: string;
  is_urgent: boolean;
  pending_reply: boolean;
  sla_at_risk: boolean;
  timeline: TicketTimelineEvent[];
  replies: TicketReply[];
};

export const PLATFORM_ASSIGNEES = [
  { id: 'assign-ana', name: 'Ana Plataforma' },
  { id: 'assign-carlos', name: 'Carlos Operaciones' },
  { id: 'assign-lucia', name: 'Lucía Soporte' }
];

export type SlaConfig = {
  responseHours: number;
  urgentHours: number;
  label: string;
};

let slaConfig: SlaConfig = {
  responseHours: 24,
  urgentHours: 4,
  label: 'Respuesta estándar 24 h · Urgente 4 h'
};

let ticketSeq = 1;

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  pending: 'Pendiente',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado'
};

const TYPE_LABELS: Record<TicketType, string> = {
  patient: 'Paciente',
  clinic: 'Clínica',
  staff: 'Equipo interno',
  system: 'Sistema',
  billing: 'Facturación'
};

const ORIGIN_LABELS: Record<TicketOrigin, string> = {
  public_portal: 'Portal público',
  clinic_portal: 'Panel clínica',
  patient: 'Paciente',
  staff: 'Equipo interno',
  system: 'Sistema'
};

function fmtNowLabel() {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return { short: `Hoy, ${h}:${m}`, full: `Hoy, ${h}:${m} · ${day}/${month}/${d.getFullYear()}` };
}

function nextCode() {
  ticketSeq += 1;
  return `SUP-2026-${String(ticketSeq).padStart(4, '0')}`;
}

function refreshRow(row: SupportTicketRow): SupportTicketRow {
  return {
    ...row,
    priority_label: PRIORITY_LABELS[row.priority],
    status_label: STATUS_LABELS[row.status],
    type_label: TYPE_LABELS[row.type],
    origin_label: ORIGIN_LABELS[row.origin],
    is_urgent: row.priority === 'urgent' || row.priority === 'high',
    pending_reply: row.status === 'open' || row.status === 'pending',
    sla_at_risk: row.status === 'open' && row.priority === 'urgent'
  };
}

const { short, full } = fmtNowLabel();

let demoStore: SupportTicketRow[] = [
  refreshRow({
    id: 'sup-demo-001',
    ticket_code: 'SUP-2026-0001',
    subject: 'Contacto web: paciente',
    origin: 'public_portal',
    origin_label: 'Portal público',
    clinic_id: null,
    clinic_name: 'Sin asignar',
    tenant_slug: null,
    requester_name: 'asdfgnsfngsfngsf',
    requester_email: 'isaaccoria46@gmail.com',
    type: 'patient',
    type_label: 'Paciente',
    priority: 'normal',
    priority_label: 'Normal',
    status: 'open',
    status_label: 'Abierto',
    message: 'asdfsdgbsfgnsfgnsfgnsfngsfgnsfns',
    assignee_id: null,
    assignee_name: 'Sin asignar',
    last_activity_label: short,
    last_activity_date: full,
    created_at: new Date().toISOString(),
    created_label: short,
    is_urgent: false,
    pending_reply: true,
    sla_at_risk: false,
    timeline: [
      {
        id: 'tl-1',
        message: 'Ticket recibido desde formulario público',
        actor: 'Sistema',
        at_label: `${short} · Sistema`,
        created_at: new Date().toISOString(),
        tone: 'info'
      },
      {
        id: 'tl-2',
        message: 'Pendiente de asignación',
        actor: 'Sistema',
        at_label: `${short} · Sistema`,
        created_at: new Date().toISOString(),
        tone: 'warn'
      }
    ],
    replies: []
  })
];

export function getSupportTicketsDemo(): SupportTicketRow[] {
  return demoStore.map((t) => ({ ...t, timeline: [...t.timeline], replies: [...t.replies] }));
}

export function getSupportKpis(rows: SupportTicketRow[]) {
  const open = rows.filter((r) => r.status === 'open' || r.status === 'in_progress');
  const urgent = rows.filter((r) => r.is_urgent && r.status !== 'closed' && r.status !== 'resolved');
  const pendingReply = rows.filter((r) => r.pending_reply && r.status !== 'closed');
  const resolvedMonth = rows.filter((r) => r.status === 'resolved' || r.status === 'closed');
  return {
    open: open.length,
    urgent: urgent.length,
    pendingReply: pendingReply.length,
    resolvedMonth: resolvedMonth.filter((r) => r.status === 'resolved').length,
    avgResponse: '—',
    slaAtRisk: rows.filter((r) => r.sla_at_risk).length
  };
}

export function getSlaConfigDemo(): SlaConfig {
  return { ...slaConfig };
}

export function findTicketDemo(id: string) {
  const t = demoStore.find((x) => x.id === id);
  return t ? { ...t, timeline: [...t.timeline], replies: [...t.replies] } : null;
}

function pushTimeline(t: SupportTicketRow, message: string, actor: string, tone: TicketTimelineEvent['tone'] = 'info') {
  const lbl = fmtNowLabel();
  t.timeline.push({
    id: crypto.randomUUID(),
    message,
    actor,
    at_label: `${lbl.short} · ${actor}`,
    created_at: new Date().toISOString(),
    tone
  });
  t.last_activity_label = lbl.short;
  t.last_activity_date = lbl.full;
}

export function createTicketDemo(input: {
  subject: string;
  message: string;
  priority: TicketPriority;
  type: TicketType;
  requesterName: string;
  requesterEmail: string;
  clinicId?: string;
  origin?: TicketOrigin;
}): SupportTicketRow | { error: string } {
  if (!input.subject.trim()) return { error: 'Introduce un asunto.' };
  if (!input.message.trim()) return { error: 'Introduce un mensaje.' };
  if (!input.priority) return { error: 'Selecciona una prioridad.' };

  const clinic = input.clinicId ? getClinicsDemo().find((c) => c.id === input.clinicId) : null;
  const lbl = fmtNowLabel();
  const row = refreshRow({
    id: crypto.randomUUID(),
    ticket_code: nextCode(),
    subject: input.subject.trim(),
    origin: input.origin ?? (clinic ? 'clinic_portal' : 'staff'),
    origin_label: '',
    clinic_id: clinic?.id ?? null,
    clinic_name: clinic?.name ?? 'Sin asignar',
    tenant_slug: clinic?.slug ?? null,
    requester_name: input.requesterName.trim(),
    requester_email: input.requesterEmail.trim(),
    type: input.type,
    type_label: '',
    priority: input.priority,
    priority_label: '',
    status: 'open',
    status_label: '',
    message: input.message.trim(),
    assignee_id: null,
    assignee_name: 'Sin asignar',
    last_activity_label: lbl.short,
    last_activity_date: lbl.full,
    created_at: new Date().toISOString(),
    created_label: lbl.short,
    is_urgent: false,
    pending_reply: true,
    sla_at_risk: false,
    timeline: [],
    replies: []
  });
  pushTimeline(row, 'Ticket creado manualmente', 'Super Admin');
  demoStore.unshift(row);
  return row;
}

export function assignTicketDemo(id: string, assigneeId: string): SupportTicketRow | { error: string } {
  const t = demoStore.find((x) => x.id === id);
  if (!t) return { error: 'No se pudo actualizar el ticket.' };
  const a = PLATFORM_ASSIGNEES.find((x) => x.id === assigneeId);
  if (!a) return { error: 'Selecciona un responsable.' };
  t.assignee_id = a.id;
  t.assignee_name = a.name;
  if (t.status === 'open') t.status = 'in_progress';
  pushTimeline(t, `Asignado a ${a.name}`, 'Super Admin', 'success');
  return refreshRow(t);
}

export function assignBulkOpenDemo(assigneeId: string): number {
  const a = PLATFORM_ASSIGNEES.find((x) => x.id === assigneeId);
  if (!a) return 0;
  let n = 0;
  for (const t of demoStore) {
    if (!t.assignee_id && (t.status === 'open' || t.status === 'pending')) {
      t.assignee_id = a.id;
      t.assignee_name = a.name;
      t.status = 'in_progress';
      pushTimeline(t, `Asignado a ${a.name} (lote)`, 'Super Admin', 'success');
      n += 1;
    }
  }
  return n;
}

export function updateStatusDemo(id: string, status: TicketStatus): SupportTicketRow | { error: string } {
  const t = demoStore.find((x) => x.id === id);
  if (!t) return { error: 'No se pudo actualizar el ticket.' };
  t.status = status;
  pushTimeline(t, `Estado cambiado a ${STATUS_LABELS[status]}`, 'Super Admin');
  if (status === 'resolved' || status === 'closed') t.pending_reply = false;
  return refreshRow(t);
}

export function updatePriorityDemo(id: string, priority: TicketPriority): SupportTicketRow | { error: string } {
  const t = demoStore.find((x) => x.id === id);
  if (!t) return { error: 'No se pudo actualizar el ticket.' };
  t.priority = priority;
  pushTimeline(t, `Prioridad cambiada a ${PRIORITY_LABELS[priority]}`, 'Super Admin');
  return refreshRow(t);
}

export function linkClinicDemo(id: string, clinicId: string): SupportTicketRow | { error: string } {
  const t = demoStore.find((x) => x.id === id);
  if (!t) return { error: 'No se pudo actualizar el ticket.' };
  const clinic = getClinicsDemo().find((c) => c.id === clinicId);
  if (!clinic) return { error: 'No se pudo actualizar el ticket.' };
  t.clinic_id = clinic.id;
  t.clinic_name = clinic.name;
  t.tenant_slug = clinic.slug;
  pushTimeline(t, `Vinculado a clínica ${clinic.name}`, 'Super Admin', 'success');
  return refreshRow(t);
}

export function sendReplyDemo(
  id: string,
  message: string,
  opts?: { template?: string; sendCopy?: boolean }
): SupportTicketRow | { error: string } {
  const t = demoStore.find((x) => x.id === id);
  if (!t) return { error: 'No se pudo enviar la respuesta.' };
  if (!message.trim()) return { error: 'Introduce un mensaje.' };
  const lbl = fmtNowLabel();
  const body = opts?.template ? `${opts.template}\n\n${message.trim()}` : message.trim();
  t.replies.push({
    id: crypto.randomUUID(),
    body,
    actor: 'Super Admin',
    at_label: lbl.short,
    created_at: new Date().toISOString(),
    send_copy: opts?.sendCopy ?? true
  });
  if (t.status === 'open' || t.status === 'pending') t.status = 'in_progress';
  t.pending_reply = false;
  pushTimeline(t, 'Respuesta enviada al solicitante', 'Super Admin', 'success');
  return refreshRow(t);
}

export function closeTicketDemo(id: string): SupportTicketRow | { error: string } {
  return updateStatusDemo(id, 'closed');
}

export function updateSlaConfigDemo(responseHours: number, urgentHours: number): SlaConfig {
  slaConfig = {
    responseHours,
    urgentHours,
    label: `Respuesta estándar ${responseHours} h · Urgente ${urgentHours} h`
  };
  return getSlaConfigDemo();
}

export function addPublicContactTicketDemo(input: {
  name: string;
  email: string;
  type: string;
  message: string;
  clinic?: string;
}) {
  const exists = demoStore.some(
    (t) => t.requester_email === input.email && t.subject.startsWith('Contacto web:') && t.status === 'open'
  );
  if (exists) return demoStore[0];

  const typeMap: Record<string, TicketType> = {
    paciente: 'patient',
    clinica: 'clinic',
    facturacion: 'billing',
    tecnico: 'system',
    otro: 'staff'
  };
  return createTicketDemo({
    subject: `Contacto web: ${input.type}`,
    message: input.message,
    priority: 'normal',
    type: typeMap[input.type] ?? 'patient',
    requesterName: input.name,
    requesterEmail: input.email,
    origin: 'public_portal'
  });
}
