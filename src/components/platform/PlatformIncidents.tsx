import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  Lock,
  Monitor,
  MoreVertical,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  User,
  UserRound,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import {
  DEMO_PATIENTS,
  getIncidentsKpis,
  REVIEW_TYPES,
  type IncidentStatus,
  type InspectionRow,
  type ModeKey,
  type RiskLevel
} from '@/lib/platform/incidentsDemo';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

type FilterChip = 'all' | ModeKey | 'security' | 'critical' | 'pending' | 'reviewed';
type DateRange = '7' | '30' | '90';

const CLINIC_ID = 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001';

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
  { label: 'Revisiones iniciadas', key: 'reviewsStarted' as const, icon: ClipboardList, tone: 'blue', sub: (k: ReturnType<typeof getIncidentsKpis>) => `Hoy: ${k.today}` },
  { label: 'Eventos auditados', key: 'eventsAudited' as const, icon: Settings, tone: 'purple', sub: (k: ReturnType<typeof getIncidentsKpis>) => `Hoy: ${k.today}` },
  { label: 'Incidencias abiertas', key: 'openIncidents' as const, icon: AlertTriangle, tone: 'orange', sub: () => 'Sin resolver' },
  { label: 'Accesos al panel', key: 'panelAccess' as const, icon: Monitor, tone: 'teal', sub: (k: ReturnType<typeof getIncidentsKpis>) => `Hoy: ${k.today}` },
  { label: 'Accesos al portal paciente', key: 'portalAccess' as const, icon: UserRound, tone: 'green', sub: (k: ReturnType<typeof getIncidentsKpis>) => `Hoy: ${k.today}` },
  { label: 'Eventos críticos', key: 'criticalEvents' as const, icon: ShieldAlert, tone: 'red', sub: () => 'Últimos 7 días' }
];

function riskLabel(r: RiskLevel) {
  if (r === 'high') return 'Alto';
  if (r === 'medium') return 'Medio';
  return 'Bajo';
}

function statusLabel(s: IncidentStatus) {
  if (s === 'registered') return 'Registrado';
  if (s === 'pending') return 'Pendiente';
  if (s === 'critical') return 'Crítico';
  if (s === 'reviewed') return 'Revisada';
  return 'Escalada';
}

function modeBadgeClass(key: ModeKey | 'security') {
  if (key === 'patient_portal') return 'inc-badge--mode-portal';
  if (key === 'security') return 'inc-badge--mode-security';
  return 'inc-badge--mode-panel';
}

function statusBadgeClass(s: IncidentStatus) {
  return `inc-badge--status-${s}`;
}

export function PlatformIncidents() {
  const [rows, setRows] = useState<InspectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [range, setRange] = useState<DateRange>('7');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InspectionRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [riskPulse, setRiskPulse] = useState<string | null>(null);
  const reviewRef = useRef<HTMLElement>(null);

  const [form, setForm] = useState({
    clinicId: CLINIC_ID,
    reviewType: '' as ModeKey | 'security' | '',
    patientId: '',
    reason: '',
    duration: '15',
    auditConfirmed: false
  });

  const [alerts, setAlerts] = useState({ critical: true, failedLogin: true, portal: false, billing: false });

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api<InspectionRow[]>('/api/platform/incidents'));
    } catch {
      showToast('err', 'No se pudo cargar el registro de inspecciones.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!didAutoSelect && rows.length) {
      const carlos = rows.find((r) => r.id === 'insp-2') ?? rows[0];
      setSelected(carlos);
      setDidAutoSelect(true);
    }
  }, [rows, didAutoSelect]);

  useEffect(() => {
    if (!selected) return;
    const fresh = rows.find((r) => r.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [rows, selected?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, chip, range]);

  const kpis = useMemo(() => getIncidentsKpis(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const days = Number(range);
    const cutoff = Date.now() - days * 86400000;
    let list = rows.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    if (q) {
      list = list.filter(
        (r) =>
          r.actor_name.toLowerCase().includes(q) ||
          r.clinic_name.toLowerCase().includes(q) ||
          (r.patient_name ?? '').toLowerCase().includes(q) ||
          r.route.toLowerCase().includes(q) ||
          r.event_label.toLowerCase().includes(q) ||
          r.resource_label.toLowerCase().includes(q)
      );
    }
    if (chip !== 'all' && chip !== 'critical' && chip !== 'pending' && chip !== 'reviewed') {
      list = list.filter((r) => r.mode_key === chip);
    }
    if (chip === 'critical') list = list.filter((r) => r.status === 'critical' || r.risk === 'high');
    if (chip === 'pending') list = list.filter((r) => r.status === 'pending');
    if (chip === 'reviewed') list = list.filter((r) => r.status === 'reviewed' || r.status === 'escalated');
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [rows, search, chip, range]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function validateReview(): boolean {
    const next: Record<string, string> = {};
    if (!form.clinicId) next.clinicId = 'Selecciona una clínica.';
    if (!form.reviewType) next.reviewType = 'Selecciona el tipo de revisión.';
    if (!form.reason.trim()) next.reason = 'Indica el motivo de la revisión.';
    if (form.reviewType === 'patient_portal' && !form.patientId) next.patientId = 'Selecciona un paciente para revisar el portal paciente.';
    if (!form.auditConfirmed) next.auditConfirmed = 'Debes confirmar que la revisión será auditada.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function startReview(redirectOnly?: 'clinic' | 'portal') {
    const reviewType = redirectOnly === 'clinic' ? 'clinic_panel' : redirectOnly === 'portal' ? 'patient_portal' : form.reviewType;
    const patientId = redirectOnly === 'portal' ? form.patientId || DEMO_PATIENTS[0].id : form.patientId;
    const reason = form.reason.trim() || 'Revisión administrativa';
    if (!redirectOnly && !validateReview()) return;
    if (redirectOnly === 'portal' && !patientId) {
      showToast('err', 'Selecciona un paciente para revisar el portal paciente.');
      return;
    }
    setSaving(true);
    try {
      const data = await api<{ redirect?: string; row?: InspectionRow }>('/api/platform/incidents', {
        method: 'POST',
        body: JSON.stringify({
          clinicId: form.clinicId,
          reviewType,
          patientId: reviewType === 'patient_portal' ? patientId : undefined,
          reason,
          duration: form.duration,
          auditConfirmed: true
        })
      });
      await load();
      showToast('ok', 'Revisión iniciada y registrada en auditoría.');
      if (data.redirect) window.location.href = data.redirect;
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo iniciar la revisión.');
    } finally {
      setSaving(false);
    }
  }

  async function patchIncident(action: 'mark_reviewed' | 'escalate', row: InspectionRow) {
    if (action === 'escalate' && !window.confirm(`¿Escalar la incidencia "${row.event_label}"?`)) return;
    try {
      await api('/api/platform/incidents', { method: 'PATCH', body: JSON.stringify({ action, id: row.id }) });
      setRiskPulse(row.id);
      window.setTimeout(() => setRiskPulse(null), 500);
      await load();
      showToast('ok', action === 'mark_reviewed' ? 'Incidencia marcada como revisada.' : 'Incidencia escalada.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'La acción falló.');
    }
    setMenuId(null);
  }

  async function exportAudit() {
    try {
      const res = await fetch('/api/platform/incidents-export', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'auditoria-incidencias.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('ok', 'Auditoría exportada en CSV.');
    } catch {
      showToast('err', 'No se pudo exportar la auditoría.');
    }
  }

  function scrollToReview() {
    reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showCriticalOnly() {
    setChip('critical');
    showToast('ok', 'Mostrando eventos críticos.');
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'clinic_panel', label: 'Panel clínica' },
    { id: 'patient_portal', label: 'Portal paciente' },
    { id: 'billing', label: 'Facturación' },
    { id: 'documents', label: 'Documentos' },
    { id: 'users', label: 'Usuarios' },
    { id: 'security', label: 'Seguridad' },
    { id: 'critical', label: 'Críticas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'reviewed', label: 'Revisadas' }
  ];

  const headerActions = (
    <div className="plt-head-actions">
      <button type="button" className="plt-btn plt-btn--primary" onClick={scrollToReview}>
        <Search className="h-4 w-4" aria-hidden />
        Iniciar revisión
      </button>
      <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void exportAudit()}>
        <Download className="h-4 w-4" aria-hidden />
        Exportar auditoría
      </button>
      <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setAlertsOpen(true)}>
        <Bell className="h-4 w-4" aria-hidden />
        Configurar alertas
      </button>
      <button type="button" className="plt-btn plt-btn--ghost" onClick={showCriticalOnly}>
        <Shield className="h-4 w-4" aria-hidden />
        Ver eventos críticos
      </button>
    </div>
  );

  function renderActions(r: InspectionRow) {
    return (
      <div className="cln-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(r)}>
          <Eye className="h-4 w-4" />
        </button>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Marcar revisada" onClick={() => void patchIncident('mark_reviewed', r)}>
          <CheckCircle2 className="h-4 w-4" />
        </button>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Escalar" onClick={() => void patchIncident('escalate', r)}>
          <AlertTriangle className="h-4 w-4" />
        </button>
        <div className="cln-menu">
          <button type="button" className="cln-icon-btn" onClick={() => setMenuId(menuId === r.id ? null : r.id)}>
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuId === r.id ? (
            <div className="cln-menu__pop">
              <button type="button" onClick={() => void patchIncident('mark_reviewed', r)}>Marcar revisada</button>
              <button type="button" onClick={() => void patchIncident('escalate', r)}>Escalar incidencia</button>
              <button type="button" onClick={() => void exportAudit()}>Descargar registro</button>
              <button type="button" onClick={() => (window.location.href = '/platform/seguridad')}>Ver auditoría completa</button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <PlatformShell
      title="Incidencias y auditoría"
      subtitle="Supervisa accesos, revisiones administrativas, actividad sensible y eventos de seguridad entre clínicas y portal paciente."
      headerActions={headerActions}
    >
      <div className={`usr-page cln-layout cln-page${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <IncKpi key={k.label} label={k.label} value={kpis[k.key]} icon={k.icon} tone={k.tone} spark={[0, 1, 1, 2, 1, 2, kpis[k.key]]} delay={i * 70} sub={k.sub(kpis)} />
          ))}
        </div>

        <section ref={reviewRef} id="review-form" className="inc-review-card">
          <h2 className="inc-review-card__title">Iniciar revisión administrativa</h2>
          <p className="inc-review-card__desc">Toda revisión queda registrada con usuario, rol, IP, fecha, hora y acciones realizadas.</p>
          <div className="inc-review-grid inc-review-grid--wide">
            <Field label="Clínica" error={errors.clinicId}>
              <select value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}>
                <option value={CLINIC_ID}>Clínica Dental Nova</option>
              </select>
            </Field>
            <Field label="Tipo de revisión" error={errors.reviewType}>
              <select value={form.reviewType} onChange={(e) => setForm({ ...form, reviewType: e.target.value as typeof form.reviewType })}>
                <option value="">Selecciona tipo</option>
                {REVIEW_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Paciente (solo si aplica)" error={errors.patientId}>
              <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} disabled={form.reviewType !== 'patient_portal'}>
                <option value="">Buscar paciente…</option>
                {DEMO_PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Motivo de revisión" error={errors.reason}>
              <input placeholder="Introduce el motivo de la revisión" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Field>
          </div>
          <div className="inc-review-grid">
            <Field label="Duración del acceso">
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </Field>
            <Field label="Confirmación de auditoría" error={errors.auditConfirmed}>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.auditConfirmed} onChange={(e) => setForm({ ...form, auditConfirmed: e.target.checked })} />
                Confirmo que esta revisión será auditada y registrada
              </label>
            </Field>
          </div>
          <div className="inc-review-actions">
            <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void startReview()}>
              <Lock className="h-4 w-4" />
              Iniciar revisión segura
            </button>
            <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void startReview('clinic')}>
              <Building2 className="h-4 w-4" />
              Revisar panel clínica
            </button>
            <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void startReview('portal')}>
              <User className="h-4 w-4" />
              Revisar portal paciente
            </button>
          </div>
        </section>

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por usuario, clínica, paciente, ruta, evento o recurso…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips">
              {chips.map((c) => (
                <button key={c.id} type="button" className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => setChip(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="cln-toolbar__sort-wrap">
              <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
              <select className="cln-toolbar__sort" value={range} onChange={(e) => setRange(e.target.value as DateRange)}>
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
              </select>
            </div>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">
            Registro de inspecciones
            <span className="usr-card-count">{filtered.length} resultados</span>
          </h2>
          {pageRows.length ? (
            <>
              <div className="cln-table-wrap">
                <table className="cln-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Usuario</th>
                      <th>Clínica</th>
                      <th>Paciente</th>
                      <th>Modo</th>
                      <th>Evento</th>
                      <th>Riesgo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => (
                      <tr
                        key={r.id}
                        style={{ animationDelay: `${i * 40}ms` }}
                        className={selected?.id === r.id ? 'cln-table__row--active' : ''}
                        onClick={() => setSelected(r)}
                      >
                        <td>{r.date_label}</td>
                        <td>
                          <div className="usr-user-cell">
                            <span className={`usr-avatar${r.is_system ? ' inc-system-avatar' : ''}`}>{r.is_system ? '⚙' : r.actor_initials}</span>
                            <strong>{r.actor_name}</strong>
                          </div>
                        </td>
                        <td>{r.clinic_name}</td>
                        <td>{r.patient_name ?? '—'}</td>
                        <td><span className={`cln-badge ${modeBadgeClass(r.mode_key)}`}>{r.mode}</span></td>
                        <td>{r.event_label}</td>
                        <td>
                          <span className={`inc-risk inc-risk--${r.risk}${riskPulse === r.id ? ' inc-risk--pulse' : ''}`}>
                            <span className="inc-risk__dot" />
                            {riskLabel(r.risk)}
                          </span>
                        </td>
                        <td><span className={`cln-badge ${statusBadgeClass(r.status)}`}>{statusLabel(r.status)}</span></td>
                        <td>{renderActions(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cln-table-foot">
                <span>Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} resultados</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  <span>{page} / {totalPages}</span>
                  <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  <span className="text-xs text-slate-500">10 por página</span>
                </div>
              </div>
            </>
          ) : (
            <div className="cln-table-empty">
              <Shield className="cln-table-empty__icon h-14 w-14" strokeWidth={1.2} />
              <p className="cln-table-empty__title">No hay inspecciones registradas</p>
              <p className="cln-table-empty__text">Cuando un Super Admin revise un panel clínico, portal paciente o recurso sensible, el evento aparecerá aquí con trazabilidad completa.</p>
              <button type="button" className="plt-btn plt-btn--primary mt-3" onClick={scrollToReview}>Iniciar revisión</button>
            </div>
          )}
        </section>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" onClick={() => setSelected(null)} />
            <aside className="cln-detail">
              <div className="cln-detail__head">
                <div>
                  <h2 className="m-0 text-base font-extrabold">Detalle de inspección</h2>
                  <span className={`cln-badge ${statusBadgeClass(selected.status)}`}>{statusLabel(selected.status)}</span>
                </div>
                <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow icon={User} label="Usuario" value={`${selected.actor_name} (${selected.actor_role})`} />
                  <DetailRow icon={Building2} label="Clínica afectada" value={`${selected.clinic_name} (${selected.clinic_slug})`} />
                  <DetailRow icon={UserRound} label="Paciente afectado" value={selected.patient_name ?? '—'} />
                  <DetailRow icon={Eye} label="Recurso consultado" value={selected.resource_label} />
                  <DetailRow icon={Monitor} label="Ruta" value={selected.route} mono />
                  <DetailRow icon={Shield} label="IP" value={selected.ip} mono />
                  <DetailRow icon={Monitor} label="Dispositivo" value={selected.device} />
                  <DetailRow icon={Calendar} label="Fecha y hora" value={new Date(selected.created_at).toLocaleString('es-ES')} />
                  <DetailRow icon={ClipboardList} label="Motivo de revisión" value={selected.reason} />
                  <DetailRow icon={Settings} label="Acciones realizadas" value={selected.actions_done} />
                  <DetailRow icon={CheckCircle2} label="Estado" value={statusLabel(selected.status)} />
                  <DetailRow icon={AlertTriangle} label="Nivel de riesgo" value={riskLabel(selected.risk)} valueClass={selected.risk === 'high' ? 'cln-val--danger' : selected.risk === 'medium' ? 'cln-val--warn' : 'cln-val--ok'} />
                </ul>
                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="cln-qa-btn" onClick={() => void patchIncident('mark_reviewed', selected)}>
                    <CheckCircle2 className="h-4 w-4" /> Marcar como revisada
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => void patchIncident('escalate', selected)}>
                    <AlertTriangle className="h-4 w-4" /> Escalar incidencia
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => void exportAudit()}>
                    <Download className="h-4 w-4" /> Descargar registro
                  </button>
                  <button type="button" className="cln-qa-btn cln-detail__danger" onClick={() => (window.location.href = '/platform/seguridad')}>
                    <Shield className="h-4 w-4" /> Ver auditoría completa
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {alertsOpen ? (
          <div className="cln-modal-backdrop" onClick={() => setAlertsOpen(false)}>
            <div className="cln-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="mt-0 font-extrabold">Configurar alertas de seguridad</h2>
              <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={alerts.critical} onChange={(e) => setAlerts({ ...alerts, critical: e.target.checked })} /> Eventos críticos</label>
              <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={alerts.failedLogin} onChange={(e) => setAlerts({ ...alerts, failedLogin: e.target.checked })} /> Intentos de acceso fallidos</label>
              <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={alerts.portal} onChange={(e) => setAlerts({ ...alerts, portal: e.target.checked })} /> Accesos portal paciente</label>
              <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={alerts.billing} onChange={(e) => setAlerts({ ...alerts, billing: e.target.checked })} /> Cambios en facturación</label>
              <div className="cln-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setAlertsOpen(false)}>Cancelar</button>
                <button type="button" className="plt-btn plt-btn--primary" onClick={() => { setAlertsOpen(false); showToast('ok', 'Preferencias de alertas guardadas.'); }}>Guardar</button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`cln-toast cln-toast--${toast.type === 'ok' ? 'ok' : 'err'}`}>{toast.text}</div> : null}
        <footer className="cln-footer"><span>Dentista+ Super Admin v2.0.0</span></footer>
      </div>
    </PlatformShell>
  );
}

function DetailRow({ icon: Icon, label, value, valueClass, mono }: { icon: LucideIcon; label: string; value: string; valueClass?: string; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>
      <span className={`cln-detail__row-value${valueClass ? ` ${valueClass}` : ''}${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}

function IncKpi({ label, value, icon: Icon, tone, spark, delay, sub }: { label: string; value: number; icon: LucideIcon; tone: string; spark: number[]; delay: number; sub: string }) {
  const n = useCountUp(value, 750);
  return (
    <article className="plt-kpi usr-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
        <p className="plt-kpi__sub">{sub}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className={`cln-field${error ? ' cln-field--error' : ''}`}>
      <label>{label}</label>
      {children}
      {error ? <span className="cln-field__err">{error}</span> : null}
    </div>
  );
}
