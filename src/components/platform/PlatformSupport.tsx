import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  LifeBuoy,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  UserPlus,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { getClinicsDemo } from '@/lib/platform/clinicsDemo';
import {
  PLATFORM_ASSIGNEES,
  getSupportKpis,
  type SupportTicketRow,
  type TicketPriority,
  type TicketStatus,
  type TicketType
} from '@/lib/platform/supportDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/support', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo actualizar el ticket.');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip =
  | 'all'
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'resolved'
  | 'urgent'
  | 'patient'
  | 'clinic'
  | 'system';
type SortMode = 'priority' | 'activity' | 'ticket' | 'status';
type Modal = 'create' | 'assign' | 'assign_bulk' | 'status' | 'priority' | 'clinic' | 'sla' | null;

const TEMPLATES: { id: string; label: string; text: string }[] = [
  { id: 'info', label: 'Solicitar más información', text: 'Hola,\n\nNecesitamos un poco más de información para poder ayudarte. ¿Podrías indicarnos…\n\nGracias.' },
  { id: 'confirm', label: 'Confirmar recepción', text: 'Hola,\n\nConfirmamos la recepción de tu solicitud. La revisaremos en breve.\n\nUn saludo,\nEquipo Dentista+' },
  { id: 'clinic', label: 'Derivar a clínica', text: 'Hola,\n\nHemos derivado tu consulta a la clínica correspondiente para que puedan contactarte.\n\nUn saludo.' },
  { id: 'close', label: 'Cierre de incidencia', text: 'Hola,\n\nTu incidencia ha quedado resuelta. Si necesitas algo más, puedes responder a este ticket.\n\nUn saludo.' }
];

function priorityClass(p: TicketPriority) {
  if (p === 'urgent' || p === 'high') return p === 'urgent' ? 'sop-badge--priority-urgent' : 'sop-badge--priority-high';
  return 'sop-badge--priority-normal';
}

function statusClass(s: TicketStatus) {
  if (s === 'open') return 'sop-badge--status-open';
  if (s === 'pending') return 'sop-badge--status-pending';
  if (s === 'in_progress') return 'sop-badge--status-progress';
  if (s === 'resolved') return 'sop-badge--status-resolved';
  return 'sop-badge--status-closed';
}

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 100}`).join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

const KPI_CONFIG = [
  { label: 'Tickets abiertos', key: 'open' as const, icon: Clock, tone: 'blue', spark: [0, 1, 1, 1, 1, 1, 1], numeric: true },
  { label: 'Urgentes', key: 'urgent' as const, icon: AlertCircle, tone: 'orange', spark: [0, 0, 0, 0, 0, 0, 0], numeric: true },
  { label: 'Pendientes de respuesta', key: 'pendingReply' as const, icon: MessageSquare, tone: 'purple', spark: [0, 1, 1, 1, 1, 1, 1], numeric: true },
  { label: 'Resueltos este mes', key: 'resolvedMonth' as const, icon: CheckCircle2, tone: 'green', spark: [0, 0, 0, 0, 0, 0, 0], numeric: true },
  { label: 'Tiempo medio respuesta', key: 'avgResponse' as const, icon: Clock, tone: 'teal', spark: [0, 0, 0, 0, 0, 0, 0], numeric: false },
  { label: 'SLA en riesgo', key: 'slaAtRisk' as const, icon: Shield, tone: 'red', spark: [0, 0, 0, 0, 0, 0, 0], numeric: true }
];

function SopKpi({
  label,
  value,
  icon: Icon,
  tone,
  spark,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
  spark: number[];
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi sop-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

export function PlatformSupport() {
  const [rows, setRows] = useState<SupportTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('priority');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<SupportTicketRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [badgePulse, setBadgePulse] = useState(0);
  const [replyFocus, setReplyFocus] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const [createForm, setCreateForm] = useState({
    subject: '',
    message: '',
    priority: 'normal' as TicketPriority,
    type: 'patient' as TicketType,
    requesterName: '',
    requesterEmail: '',
    clinicId: ''
  });
  const [assigneeId, setAssigneeId] = useState(PLATFORM_ASSIGNEES[0]?.id ?? '');
  const [statusForm, setStatusForm] = useState<TicketStatus>('open');
  const [priorityForm, setPriorityForm] = useState<TicketPriority>('normal');
  const [clinicForm, setClinicForm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [sendCopy, setSendCopy] = useState(true);
  const [slaForm, setSlaForm] = useState({ responseHours: '24', urgentHours: '4' });

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await apiGet<SupportTicketRow[]>('/api/platform/support'));
    } catch {
      showToast('err', 'No se pudieron cargar los tickets.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!didAutoSelect && rows.length) {
      setSelected(rows.find((r) => r.id === 'sup-demo-001') ?? rows[0]);
      setDidAutoSelect(true);
    }
  }, [rows, didAutoSelect]);

  useEffect(() => {
    if (selected) {
      const f = rows.find((r) => r.id === selected.id);
      if (f) setSelected(f);
    }
  }, [rows, selected?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, chip, sort, pageSize]);

  const kpis = useMemo(() => getSupportKpis(rows), [rows]);
  const clinics = getClinicsDemo();

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();
    if (chip === 'open') list = list.filter((r) => r.status === 'open');
    if (chip === 'pending') list = list.filter((r) => r.status === 'pending');
    if (chip === 'in_progress') list = list.filter((r) => r.status === 'in_progress');
    if (chip === 'resolved') list = list.filter((r) => r.status === 'resolved' || r.status === 'closed');
    if (chip === 'urgent') list = list.filter((r) => r.is_urgent);
    if (chip === 'patient') list = list.filter((r) => r.type === 'patient');
    if (chip === 'clinic') list = list.filter((r) => r.type === 'clinic');
    if (chip === 'system') list = list.filter((r) => r.type === 'system');
    if (q) {
      list = list.filter(
        (r) =>
          r.ticket_code.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q) ||
          r.clinic_name.toLowerCase().includes(q) ||
          r.requester_name.toLowerCase().includes(q) ||
          r.requester_email.toLowerCase().includes(q) ||
          r.status_label.toLowerCase().includes(q) ||
          r.priority_label.toLowerCase().includes(q)
      );
    }
    const prioOrder: Record<TicketPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    if (sort === 'ticket') list.sort((a, b) => a.ticket_code.localeCompare(b.ticket_code));
    else if (sort === 'status') list.sort((a, b) => a.status_label.localeCompare(b.status_label));
    else if (sort === 'activity') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else list.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);
    return list;
  }, [rows, search, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function post(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const { data, message } = await apiPost<SupportTicketRow[]>(body);
      setRows(data);
      setModal(null);
      setBadgePulse((p) => p + 1);
      showToast('ok', message ?? okMsg ?? 'Guardado correctamente.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo actualizar el ticket.');
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setCreateForm({
      subject: '',
      message: '',
      priority: 'normal',
      type: 'patient',
      requesterName: '',
      requesterEmail: '',
      clinicId: ''
    });
    setErrors({});
    setModal('create');
  }

  function openAssign(id: string) {
    setTargetId(id);
    setAssigneeId(PLATFORM_ASSIGNEES[0]?.id ?? '');
    setErrors({});
    setModal('assign');
  }

  function focusReply() {
    setReplyFocus(true);
    window.setTimeout(() => replyRef.current?.focus(), 120);
  }

  function applyTemplate() {
    const t = TEMPLATES.find((x) => x.id === templateId);
    if (t) setReplyText(t.text);
  }

  function submitCreate() {
    const next: Record<string, string> = {};
    if (!createForm.subject.trim()) next.subject = 'Introduce un asunto.';
    if (!createForm.message.trim()) next.message = 'Introduce un mensaje.';
    if (!createForm.priority) next.priority = 'Selecciona una prioridad.';
    if (!createForm.requesterName.trim()) next.requesterName = 'Introduce un nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.requesterEmail)) next.requesterEmail = 'Introduce un email válido.';
    setErrors(next);
    if (Object.keys(next).length) return;
    void post({
      action: 'create',
      subject: createForm.subject,
      message: createForm.message,
      priority: createForm.priority,
      type: createForm.type,
      requesterName: createForm.requesterName,
      requesterEmail: createForm.requesterEmail,
      clinicId: createForm.clinicId || undefined
    });
  }

  function submitAssign() {
    if (!targetId || !assigneeId) {
      setErrors({ assignee: 'Selecciona un responsable.' });
      return;
    }
    void post({ action: 'assign', id: targetId, assigneeId });
  }

  function submitBulkAssign() {
    if (!assigneeId) {
      setErrors({ assignee: 'Selecciona un responsable.' });
      return;
    }
    void post({ action: 'assign_bulk', assigneeId }, 'Tickets asignados.');
  }

  function submitStatus() {
    if (!targetId) return;
    void post({ action: 'update_status', id: targetId, status: statusForm });
  }

  function submitPriority() {
    if (!targetId) return;
    void post({ action: 'update_priority', id: targetId, priority: priorityForm });
  }

  function submitClinic() {
    if (!targetId || !clinicForm) {
      setErrors({ clinic: 'Selecciona una clínica.' });
      return;
    }
    void post({ action: 'link_clinic', id: targetId, clinicId: clinicForm });
  }

  async function submitReply() {
    if (!selected) return;
    if (!replyText.trim()) {
      showToast('err', 'Introduce un mensaje.');
      return;
    }
    const tpl = TEMPLATES.find((x) => x.id === templateId)?.text;
    await post(
      {
        action: 'reply',
        id: selected.id,
        message: replyText,
        template: tpl,
        sendCopy
      },
      'Respuesta enviada correctamente.'
    );
    setReplyText('');
  }

  function closeTicket(id: string) {
    if (!window.confirm('¿Cerrar este ticket? El solicitante no podrá reabrirlo desde el portal.')) return;
    void post({ action: 'close', id });
  }

  function submitSla() {
    void post({
      action: 'update_sla',
      responseHours: Number(slaForm.responseHours),
      urgentHours: Number(slaForm.urgentHours)
    });
  }

  const chips: { id: FilterChip; label: string; urgentDot?: boolean }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'open', label: 'Abiertos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'in_progress', label: 'En progreso' },
    { id: 'resolved', label: 'Resueltos' },
    { id: 'urgent', label: 'Urgentes', urgentDot: true },
    { id: 'patient', label: 'Paciente' },
    { id: 'clinic', label: 'Clínica' },
    { id: 'system', label: 'Sistema' }
  ];

  return (
    <PlatformShell
      title="Soporte"
      subtitle="Gestiona tickets de clínicas, pacientes y equipo interno con trazabilidad y aislamiento por tenant."
      headerActions={
        <>
          <button type="button" className="plt-btn plt-btn--primary" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Crear ticket
          </button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => setModal('assign_bulk')}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Asignar tickets
          </button>
          <button
            type="button"
            className="plt-btn plt-btn--secondary"
            onClick={() => {
              window.location.href = '/api/platform/support-export';
              showToast('ok', 'Exportación iniciada.');
            }}
          >
            Exportar soporte
          </button>
          <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal('sla')}>
            <Settings className="h-4 w-4" aria-hidden />
            Configurar SLA
          </button>
        </>
      }
    >
      <div className={`sop-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <SopKpi
              key={k.label}
              label={k.label}
              value={k.numeric ? (kpis[k.key] as number) : (kpis[k.key] as string)}
              icon={k.icon}
              tone={k.tone}
              spark={k.spark}
              delay={i * 70}
              numeric={k.numeric}
            />
          ))}
        </div>

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input
              placeholder="Buscar por ticket, clínica, paciente, email, asunto o estado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar tickets"
            />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={chip === c.id}
                  className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}${c.urgentDot ? ' sop-chip--urgent' : ''}`}
                  onClick={() => setChip(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Ordenar">
              <option value="priority">Ordenar por: prioridad</option>
              <option value="activity">Ordenar por: última actividad</option>
              <option value="ticket">Ordenar por: ticket</option>
              <option value="status">Ordenar por: estado</option>
            </select>
            <button type="button" className="cln-icon-btn" title="Actualizar" onClick={() => void load()}>
              <RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">
            Tickets de soporte{' '}
            <span className="hist-card-count">
              ({filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'})
            </span>
          </h2>

          {rows.length === 0 && !loading ? (
            <section className="sop-empty">
              <LifeBuoy className="sop-empty__icon" aria-hidden />
              <h3 className="sub-empty__title">No hay tickets de soporte</h3>
              <p className="sub-empty__text">
                Cuando una clínica, paciente o usuario contacte con soporte, los tickets aparecerán aquí con su trazabilidad.
              </p>
              <div className="reg-empty__actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="plt-btn plt-btn--primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Crear ticket
                </button>
                <button type="button" className="plt-btn plt-btn--secondary" onClick={() => setModal('sla')}>
                  Configurar SLA
                </button>
              </div>
            </section>
          ) : filtered.length === 0 ? (
            <section className="sop-empty">
              <Search className="sop-empty__icon" aria-hidden />
              <h3 className="sub-empty__title">No hay resultados con este filtro</h3>
              <p className="sub-empty__text">Prueba otro término o limpia los filtros.</p>
              <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { setSearch(''); setChip('all'); }}>
                Limpiar filtros
              </button>
            </section>
          ) : (
            <>
              <div className="cln-table-wrap">
                <table className="cln-table sop-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Origen</th>
                      <th>Clínica</th>
                      <th>Solicitante</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Última actividad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => (
                      <tr
                        key={r.id}
                        className={selected?.id === r.id ? 'cln-table__row--active' : ''}
                        style={{ animationDelay: `${i * 45}ms` }}
                        onClick={() => setSelected(r)}
                      >
                        <td>
                          <div className="sop-ticket-cell">
                            <strong>{r.ticket_code}</strong>
                            <span>{r.subject}</span>
                          </div>
                        </td>
                        <td>
                          <span className="sop-origin">
                            <Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {r.origin_label}
                          </span>
                        </td>
                        <td>{r.clinic_name}</td>
                        <td>
                          <span className="text-sm">{r.requester_email}</span>
                        </td>
                        <td>
                          <span
                            key={`${r.id}-p-${badgePulse}`}
                            className={`cln-badge ${priorityClass(r.priority)}${badgePulse ? ' sop-badge--pulse' : ''}`}
                          >
                            {r.priority_label}
                          </span>
                        </td>
                        <td>
                          <span
                            key={`${r.id}-s-${badgePulse}`}
                            className={`cln-badge cln-badge--status ${statusClass(r.status)}${badgePulse ? ' sop-badge--pulse' : ''}`}
                          >
                            <span className="cln-status-dot" />
                            {r.status_label}
                          </span>
                        </td>
                        <td>
                          <div>
                            {r.last_activity_label}
                            <span className="block text-xs text-[var(--muted)]">{r.last_activity_date.split(' · ')[1] ?? ''}</span>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cln-actions">
                            <button
                              type="button"
                              className="cln-icon-btn cln-icon-btn--tip"
                              data-tip="Ver ticket"
                              onClick={() => setSelected(r)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="cln-icon-btn cln-icon-btn--tip"
                              data-tip="Asignar"
                              onClick={() => openAssign(r.id)}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="cln-icon-btn cln-icon-btn--tip"
                              data-tip="Responder"
                              onClick={() => {
                                setSelected(r);
                                focusReply();
                              }}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                            <div className="cln-menu">
                              <button type="button" className="cln-icon-btn" onClick={() => setMenuId(menuId === r.id ? null : r.id)}>
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                              {menuId === r.id ? (
                                <div className="cln-menu__pop">
                                  <button type="button" onClick={() => { setSelected(r); setModal('status'); setTargetId(r.id); setStatusForm(r.status); setMenuId(null); }}>
                                    Cambiar estado
                                  </button>
                                  <button type="button" onClick={() => { setSelected(r); setModal('priority'); setTargetId(r.id); setPriorityForm(r.priority); setMenuId(null); }}>
                                    Cambiar prioridad
                                  </button>
                                  <button type="button" onClick={() => { setSelected(r); setModal('clinic'); setTargetId(r.id); setClinicForm(clinics[0]?.id ?? ''); setMenuId(null); }}>
                                    Vincular a clínica
                                  </button>
                                  <button type="button" className="cln-menu__danger" onClick={() => { closeTicket(r.id); setMenuId(null); }}>
                                    Cerrar ticket
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cln-mobile-list">
                {pageRows.map((r) => (
                  <article
                    key={r.id}
                    className={`cln-mobile-card${selected?.id === r.id ? ' cln-mobile-card--active' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <p className="font-bold">{r.ticket_code}</p>
                    <p className="text-xs text-[var(--muted)]">{r.subject}</p>
                    <p className="text-xs">{r.status_label} · {r.priority_label}</p>
                  </article>
                ))}
              </div>
              <footer className="reg-footer">
                <span>
                  Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length}{' '}
                  {filtered.length === 1 ? 'resultado' : 'resultados'}
                </span>
                <div className="reg-footer__pages">
                  <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    ‹
                  </button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    ›
                  </button>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="cln-toolbar__sort">
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                  </select>
                </div>
              </footer>
            </>
          )}
        </section>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
            <aside className="cln-detail">
              <div className="cln-detail__head">
                <div>
                  <h2 className="cln-detail__title">{selected.subject}</h2>
                  <span className={`cln-badge cln-badge--status ${statusClass(selected.status)}`}>
                    <span className="cln-status-dot" />
                    {selected.status_label}
                  </span>
                </div>
                <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)} aria-label="Cerrar panel">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow label="ID ticket" value={selected.ticket_code} icon={LifeBuoy} mono />
                  <DetailRow label="Estado" value={selected.status_label} icon={CheckCircle2} />
                  <DetailRow label="Prioridad" value={selected.priority_label} icon={AlertCircle} />
                  <DetailRow label="Origen" value={selected.origin_label} icon={Globe} />
                  <DetailRow label="Tipo" value={selected.type_label} icon={MessageSquare} />
                  <DetailRow label="Nombre" value={selected.requester_name} icon={UserPlus} />
                  <DetailRow label="Email" value={selected.requester_email} icon={MessageSquare} />
                  <DetailRow label="Clínica relacionada" value={selected.clinic_name} icon={LifeBuoy} />
                  <DetailRow
                    label="Tenant"
                    value={selected.tenant_slug ?? 'Sin tenant asignado'}
                    icon={Globe}
                    mono
                  />
                  <DetailRow label="Fecha de creación" value={selected.created_label} icon={Clock} />
                  <DetailRow label="Última actividad" value={selected.last_activity_label} icon={Clock} />
                  <DetailRow
                    label="Responsable asignado"
                    value={
                      selected.assignee_name === 'Sin asignar' ? (
                        <span className="sop-assign-warn">{selected.assignee_name}</span>
                      ) : (
                        selected.assignee_name
                      )
                    }
                    icon={UserPlus}
                  />
                </ul>

                <div className="sop-detail-card">
                  <h3 className="sop-detail-card__title">Mensaje del solicitante</h3>
                  <p className="sop-message">{selected.message}</p>
                </div>

                <div className="sop-detail-card">
                  <h3 className="sop-detail-card__title">Historial del ticket</h3>
                  <ul className="sop-timeline">
                    {selected.timeline.map((ev) => (
                      <li key={ev.id} data-tone={ev.tone}>
                        <strong>{ev.message}</strong>
                        <span>{ev.at_label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="sop-qa-grid">
                  <button type="button" className="cln-qa-btn" onClick={() => openAssign(selected.id)}>
                    Asignar responsable
                  </button>
                  <button
                    type="button"
                    className="cln-qa-btn"
                    onClick={() => {
                      setTargetId(selected.id);
                      setStatusForm(selected.status);
                      setModal('status');
                    }}
                  >
                    Cambiar estado
                  </button>
                  <button
                    type="button"
                    className="cln-qa-btn"
                    onClick={() => {
                      setTargetId(selected.id);
                      setPriorityForm(selected.priority);
                      setModal('priority');
                    }}
                  >
                    Cambiar prioridad
                  </button>
                  <button
                    type="button"
                    className="cln-qa-btn"
                    onClick={() => {
                      setTargetId(selected.id);
                      setClinicForm(clinics[0]?.id ?? '');
                      setModal('clinic');
                    }}
                  >
                    Vincular a clínica
                  </button>
                  <button type="button" className="cln-qa-btn cln-detail__danger" onClick={() => closeTicket(selected.id)}>
                    Cerrar ticket
                  </button>
                </div>

                <div className={`sop-reply${replyFocus ? ' sop-reply--focus' : ''}`}>
                  <h3 className="sop-detail-card__title">Responder al ticket</h3>
                  <label className="sop-field">
                    <span>Mensaje de respuesta</span>
                    <textarea
                      ref={replyRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escribe tu respuesta…"
                    />
                  </label>
                  <div className="sop-reply__row">
                    <div className="sop-reply__templates">
                      <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Plantilla rápida">
                        <option value="">Plantilla rápida</option>
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={applyTemplate}>
                        Usar
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input type="checkbox" checked={sendCopy} onChange={(e) => setSendCopy(e.target.checked)} />
                      Enviar copia por email
                    </label>
                  </div>
                  <button type="button" className="plt-btn plt-btn--primary w-full mt-2" disabled={busy} onClick={submitReply}>
                    <Send className="h-4 w-4" aria-hidden />
                    Enviar respuesta
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {modal === 'create' ? (
          <ModalShell title="Crear ticket" onClose={() => setModal(null)}>
            <div className="sop-field">
              <label>Asunto</label>
              <input value={createForm.subject} onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))} />
              {errors.subject ? <p className="sop-field__err">{errors.subject}</p> : null}
            </div>
            <div className="sop-field">
              <label>Tipo</label>
              <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as TicketType }))}>
                <option value="patient">Paciente</option>
                <option value="clinic">Clínica</option>
                <option value="staff">Equipo interno</option>
                <option value="system">Sistema</option>
                <option value="billing">Facturación</option>
              </select>
            </div>
            <div className="sop-field">
              <label>Prioridad</label>
              <select value={createForm.priority} onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))}>
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              {errors.priority ? <p className="sop-field__err">{errors.priority}</p> : null}
            </div>
            <div className="sop-field">
              <label>Nombre solicitante</label>
              <input value={createForm.requesterName} onChange={(e) => setCreateForm((f) => ({ ...f, requesterName: e.target.value }))} />
            </div>
            <div className="sop-field">
              <label>Email</label>
              <input type="email" value={createForm.requesterEmail} onChange={(e) => setCreateForm((f) => ({ ...f, requesterEmail: e.target.value }))} />
              {errors.requesterEmail ? <p className="sop-field__err">{errors.requesterEmail}</p> : null}
            </div>
            <div className="sop-field">
              <label>Clínica (opcional)</label>
              <select value={createForm.clinicId} onChange={(e) => setCreateForm((f) => ({ ...f, clinicId: e.target.value }))}>
                <option value="">Sin vincular</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sop-field">
              <label>Mensaje</label>
              <textarea rows={4} value={createForm.message} onChange={(e) => setCreateForm((f) => ({ ...f, message: e.target.value }))} />
              {errors.message ? <p className="sop-field__err">{errors.message}</p> : null}
            </div>
            <ModalFoot onCancel={() => setModal(null)} onConfirm={submitCreate} confirmLabel="Crear ticket" busy={busy} />
          </ModalShell>
        ) : null}

        {modal === 'assign' || modal === 'assign_bulk' ? (
          <ModalShell title={modal === 'assign_bulk' ? 'Asignar tickets abiertos' : 'Asignar responsable'} onClose={() => setModal(null)}>
            <div className="sop-field">
              <label>Responsable</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                {PLATFORM_ASSIGNEES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.assignee ? <p className="sop-field__err">{errors.assignee}</p> : null}
            </div>
            <ModalFoot
              onCancel={() => setModal(null)}
              onConfirm={modal === 'assign_bulk' ? submitBulkAssign : submitAssign}
              confirmLabel="Asignar"
              busy={busy}
            />
          </ModalShell>
        ) : null}

        {modal === 'status' ? (
          <ModalShell title="Cambiar estado" onClose={() => setModal(null)}>
            <div className="sop-field">
              <label>Estado</label>
              <select value={statusForm} onChange={(e) => setStatusForm(e.target.value as TicketStatus)}>
                <option value="open">Abierto</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
            </div>
            <ModalFoot onCancel={() => setModal(null)} onConfirm={submitStatus} confirmLabel="Guardar" busy={busy} />
          </ModalShell>
        ) : null}

        {modal === 'priority' ? (
          <ModalShell title="Cambiar prioridad" onClose={() => setModal(null)}>
            <div className="sop-field">
              <label>Prioridad</label>
              <select value={priorityForm} onChange={(e) => setPriorityForm(e.target.value as TicketPriority)}>
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <ModalFoot onCancel={() => setModal(null)} onConfirm={submitPriority} confirmLabel="Guardar" busy={busy} />
          </ModalShell>
        ) : null}

        {modal === 'clinic' ? (
          <ModalShell title="Vincular a clínica" onClose={() => setModal(null)}>
            <div className="sop-field">
              <label>Clínica</label>
              <select value={clinicForm} onChange={(e) => setClinicForm(e.target.value)}>
                <option value="">Seleccionar…</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.clinic ? <p className="sop-field__err">{errors.clinic}</p> : null}
            </div>
            <ModalFoot onCancel={() => setModal(null)} onConfirm={submitClinic} confirmLabel="Vincular" busy={busy} />
          </ModalShell>
        ) : null}

        {modal === 'sla' ? (
          <ModalShell title="Configurar SLA" onClose={() => setModal(null)}>
            <p className="text-xs text-[var(--muted)]">Define tiempos objetivo de primera respuesta para tickets de plataforma.</p>
            <div className="sop-field">
              <label>Respuesta estándar (horas)</label>
              <input type="number" min={1} max={168} value={slaForm.responseHours} onChange={(e) => setSlaForm((f) => ({ ...f, responseHours: e.target.value }))} />
            </div>
            <div className="sop-field">
              <label>Respuesta urgente (horas)</label>
              <input type="number" min={1} max={48} value={slaForm.urgentHours} onChange={(e) => setSlaForm((f) => ({ ...f, urgentHours: e.target.value }))} />
            </div>
            <ModalFoot onCancel={() => setModal(null)} onConfirm={submitSla} confirmLabel="Guardar SLA" busy={busy} />
          </ModalShell>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !rows.length ? <p className="text-sm text-[var(--muted)]">Cargando tickets…</p> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({ label, value, icon: Icon, mono }: { label: string; value: ReactNode; icon: LucideIcon; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
      <span className={`cln-detail__row-value${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sop-modal-backdrop" role="dialog" aria-modal="true">
      <div className="sop-modal">
        <div className="sop-modal__head">
          <h3 className="sop-modal__title">{title}</h3>
          <button type="button" className="cln-icon-btn" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="sop-modal__body">{children}</div>
      </div>
    </div>
  );
}

function ModalFoot({
  onCancel,
  onConfirm,
  confirmLabel,
  busy
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  busy: boolean;
}) {
  return (
    <div className="sop-modal__foot">
      <button type="button" className="plt-btn plt-btn--ghost" onClick={onCancel}>
        Cancelar
      </button>
      <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  );
}
