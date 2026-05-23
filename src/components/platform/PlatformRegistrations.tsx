import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Building2, Check, CheckCircle2, ClipboardList, Clock, Database, Download, ExternalLink,
  Eye, Mail, MapPin, MoreVertical, Phone, Plus, RefreshCw, Search, Settings, User, X, XCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { getRegistrationsKpis, type RegistrationRow, type RegistrationStatus } from '@/lib/platform/registrationsDemo';
import type { SubscriptionPlan } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/registrations', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip = 'all' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'tax' | 'unreviewed';
type SortMode = 'created' | 'name' | 'status';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function statusBadgeClass(status: RegistrationStatus) {
  if (status === 'pending') return 'reg-badge--pending';
  if (status === 'in_review') return 'reg-badge--review';
  if (status === 'approved') return 'reg-badge--approved';
  return 'reg-badge--rejected';
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
  { label: 'Pendientes', key: 'pending' as const, icon: Clock, tone: 'purple', spark: [0,1,0,1,0,0,0], sub: () => 'Por revisar', numeric: true },
  { label: 'Aprobadas', key: 'approved' as const, icon: CheckCircle2, tone: 'green', spark: [0,0,1,1,1,1,1], sub: () => 'Este mes', numeric: true },
  { label: 'Rechazadas', key: 'rejected' as const, icon: XCircle, tone: 'red', spark: [0,0,0,0,0,0,0], sub: () => 'Total', numeric: true },
  { label: 'En revisión', key: 'inReview' as const, icon: ClipboardList, tone: 'orange', spark: [0,0,0,1,1,0,0], sub: () => 'Activas', numeric: true },
  { label: 'Tiempo medio revisión', key: 'avgReviewLabel' as const, icon: Clock, tone: 'blue', spark: [2,3,2,4,3,3,3], sub: () => 'Sin datos' },
  { label: 'Tenants creados', key: 'tenantsCreated' as const, icon: Database, tone: 'teal', spark: [0,1,1,1,1,1,1], sub: () => 'Este mes', numeric: true }
];

function RegKpi({ label, value, icon: Icon, tone, spark, sub, delay, numeric }: {
  label: string; value: string | number; icon: LucideIcon; tone: string; spark: number[]; sub: string; delay: number; numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi reg-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
        <p className="text-xs text-[var(--muted)]">{sub}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

type ApproveForm = {
  plan: SubscriptionPlan | '';
  tenantSlug: string;
  adminEmail: string;
  createCredentials: boolean;
  welcomeEmail: boolean;
  isolation: boolean;
  subscription: boolean;
};

export function PlatformRegistrations() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('created');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<RegistrationRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [modal, setModal] = useState<'approve' | 'reject' | 'manual' | null>(null);
  const [approveTarget, setApproveTarget] = useState<RegistrationRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RegistrationRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approveForm, setApproveForm] = useState<ApproveForm>({
    plan: '', tenantSlug: '', adminEmail: '', createCredentials: true, welcomeEmail: true, isolation: true, subscription: true
  });
  const [manualForm, setManualForm] = useState({ clinicName: '', ownerName: '', email: '', phone: '', city: '', plan: 'PRO Clínica' });

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await apiGet<RegistrationRow[]>('/api/platform/registrations')); }
    catch { showToast('err', 'No se pudieron cargar las solicitudes.'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!didAutoSelect && rows.length) {
      setSelected(rows.find((r) => r.id === 'reg-pending-002') ?? rows.find((r) => r.status === 'pending') ?? rows[0]);
      setDidAutoSelect(true);
    }
  }, [rows, didAutoSelect]);
  useEffect(() => {
    if (selected) { const f = rows.find((r) => r.id === selected.id); if (f) setSelected(f); }
  }, [rows, selected?.id]);
  useEffect(() => { setPage(1); }, [search, chip, sort, pageSize]);

  const kpis = useMemo(() => getRegistrationsKpis(rows), [rows]);
  const filtered = useMemo(() => {
    let list = [...rows];
    if (chip === 'all') list = list.filter((r) => r.status === 'pending' || r.status === 'in_review');
    if (chip === 'pending') list = list.filter((r) => r.status === 'pending');
    if (chip === 'in_review') list = list.filter((r) => r.status === 'in_review');
    if (chip === 'approved') list = list.filter((r) => r.status === 'approved');
    if (chip === 'rejected') list = list.filter((r) => r.status === 'rejected');
    if (chip === 'tax') list = list.filter((r) => r.has_tax_data);
    if (chip === 'unreviewed') list = list.filter((r) => !r.reviewed);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.clinic_name.toLowerCase().includes(q) || r.owner_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q) || r.city.toLowerCase().includes(q));
    if (sort === 'name') list.sort((a, b) => a.clinic_name.localeCompare(b.clinic_name));
    else if (sort === 'status') list.sort((a, b) => a.status_label.localeCompare(b.status_label));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [rows, search, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const canReview = (r: RegistrationRow) => r.status === 'pending' || r.status === 'in_review';

  function openApprove(r: RegistrationRow) {
    setApproveTarget(r);
    setApproveForm({
      plan: r.requested_plan.includes('Multi') ? 'enterprise' : r.requested_plan.includes('PRO') ? 'professional' : 'essential',
      tenantSlug: slugify(r.clinic_name), adminEmail: r.email,
      createCredentials: true, welcomeEmail: true, isolation: true, subscription: true
    });
    setErrors({}); setModal('approve');
  }

  function openReject(r: RegistrationRow) { setRejectTarget(r); setRejectReason(''); setErrors({}); setModal('reject'); }

  function validateApprove() {
    const next: Record<string, string> = {};
    if (!approveForm.plan) next.plan = 'Selecciona un plan.';
    if (!SLUG_RE.test(approveForm.tenantSlug)) next.tenantSlug = 'Introduce un slug de tenant válido.';
    if (!EMAIL_RE.test(approveForm.adminEmail)) next.adminEmail = 'Introduce un email de administrador válido.';
    setErrors(next); return Object.keys(next).length === 0;
  }

  async function submitApprove() {
    if (!approveTarget || !validateApprove()) return;
    setBusy(true);
    try {
      const { data, message } = await apiPost<RegistrationRow[]>({ action: 'approve', id: approveTarget.id, ...approveForm });
      setRows(data); setModal(null); setApproveTarget(null);
      showToast('ok', message ?? 'Clínica aprobada y tenant creado.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudo aprobar la solicitud.'); }
    finally { setBusy(false); }
  }

  async function submitReject() {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { setErrors({ reason: 'El motivo del rechazo es obligatorio.' }); return; }
    setBusy(true);
    try {
      const { data, message } = await apiPost<RegistrationRow[]>({ action: 'reject', id: rejectTarget.id, reason: rejectReason.trim(), notify: true });
      setRows(data); setModal(null); setRejectTarget(null);
      showToast('ok', message ?? 'Solicitud rechazada.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudo rechazar la solicitud.'); }
    finally { setBusy(false); }
  }

  async function requestInfo() {
    if (!selected) return;
    setBusy(true);
    try {
      const { data, message } = await apiPost<RegistrationRow[]>({ action: 'request_info', id: selected.id, message: 'Solicitud de información adicional.' });
      setRows(data); showToast('ok', message ?? 'Solicitud de información enviada.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudo enviar la solicitud.'); }
    finally { setBusy(false); }
  }

  async function submitManual() {
    setBusy(true);
    try {
      const { data, message } = await apiPost<RegistrationRow[]>({ action: 'manual_create', ...manualForm });
      setRows(data); setModal(null); showToast('ok', message ?? 'Solicitud manual creada.');
    } catch (e) { showToast('err', e instanceof Error ? e.message : 'No se pudo crear la solicitud.'); }
    finally { setBusy(false); }
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' }, { id: 'pending', label: 'Pendientes' }, { id: 'in_review', label: 'En revisión' },
    { id: 'approved', label: 'Aprobadas' }, { id: 'rejected', label: 'Rechazadas' }, { id: 'tax', label: 'Con datos fiscales' }, { id: 'unreviewed', label: 'Sin revisar' }
  ];

  return (
    <PlatformShell title="Registros de clínicas" subtitle="Revisa solicitudes de alta, valida datos fiscales, asigna plan y crea tenants seguros para nuevas clínicas."
      headerActions={<>
        <button type="button" className="plt-btn plt-btn--ghost" disabled={loading} onClick={() => void load()}><RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} aria-hidden />Actualizar</button>
        <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { window.location.href = '/api/platform/registrations-export'; showToast('ok', 'Solicitudes exportadas.'); }}><Download className="h-4 w-4" aria-hidden />Exportar solicitudes</button>
        <button type="button" className="plt-btn plt-btn--ghost" onClick={() => (window.location.href = '/platform/configuracion')}><Settings className="h-4 w-4" aria-hidden />Configurar formulario público</button>
      </>}
    >
      <div className={`reg-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <RegKpi key={k.label} label={k.label} value={k.key === 'avgReviewLabel' ? kpis.avgReviewLabel : kpis[k.key]} icon={k.icon} tone={k.tone} spark={k.spark} sub={k.sub()} delay={i * 70} numeric={'numeric' in k ? k.numeric : false} />
          ))}
        </div>

        {kpis.pending === 0 ? (
          <section className="reg-empty">
            <ClipboardList className="reg-empty__icon" aria-hidden />
            <h2 className="reg-empty__title">No hay solicitudes pendientes</h2>
            <p className="reg-empty__text">Cuando una clínica complete el formulario de registro público, aparecerá aquí para que puedas revisar sus datos, aprobarla y crear su tenant.</p>
            <div className="reg-empty__actions">
              <a href="/registro-clinica" target="_blank" rel="noopener noreferrer" className="plt-btn plt-btn--primary"><ExternalLink className="h-4 w-4" aria-hidden />Ver formulario público</a>
              <button type="button" className="plt-btn plt-btn--secondary" onClick={() => setModal('manual')}><Plus className="h-4 w-4" aria-hidden />Crear clínica manualmente</button>
            </div>
          </section>
        ) : null}

        <div className="cln-toolbar">
          <label className="cln-search"><Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por clínica, responsable, email, teléfono o ciudad…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar solicitudes" />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">{chips.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={chip === c.id} className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => setChip(c.id)}>{c.label}</button>
            ))}</div>
            <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Ordenar">
              <option value="created">Ordenar por: fecha de solicitud</option>
              <option value="name">Ordenar por: clínica</option>
              <option value="status">Ordenar por: estado</option>
            </select>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">Solicitudes de registro</h2>
          <div className="cln-table-wrap">
            <table className="cln-table reg-table">
              <thead><tr><th>Clínica</th><th>Responsable</th><th>Contacto</th><th>Ciudad</th><th>Plan solicitado</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
              <tbody>{pageRows.map((r, i) => (
                <tr key={r.id} className={selected?.id === r.id ? 'cln-table__row--active' : ''} style={{ animationDelay: `${i * 45}ms` }} onClick={() => setSelected(r)}>
                  <td><strong>{r.clinic_name}</strong></td>
                  <td>{r.owner_name}</td>
                  <td className="text-xs">{r.contact_display}</td>
                  <td>{r.city}</td>
                  <td>{r.requested_plan}</td>
                  <td><span className={`cln-badge ${statusBadgeClass(r.status)}`}>{r.status_label}</span></td>
                  <td>{r.date_label}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="cln-actions">
                      <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver solicitud" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></button>
                      {canReview(r) ? (<>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Aprobar" onClick={() => openApprove(r)}><Check className="h-3.5 w-3.5" /></button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Rechazar" onClick={() => openReject(r)}><X className="h-3.5 w-3.5" /></button>
                      </>) : null}
                      <div className="cln-menu">
                        <button type="button" className="cln-icon-btn" aria-label="Más" onClick={() => setMenuId(menuId === r.id ? null : r.id)}><MoreVertical className="h-3.5 w-3.5" /></button>
                        {menuId === r.id ? <div className="cln-menu__pop">
                          <button type="button" onClick={() => { setSelected(r); setMenuId(null); }}>Ver solicitud</button>
                          {canReview(r) ? (<>
                            <button type="button" onClick={() => { openApprove(r); setMenuId(null); }}>Aprobar</button>
                            <button type="button" className="cln-menu__danger" onClick={() => { openReject(r); setMenuId(null); }}>Rechazar</button>
                          </>) : null}
                        </div> : null}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="cln-mobile-list">{pageRows.map((r) => (
            <article key={r.id} className={`cln-mobile-card${selected?.id === r.id ? ' cln-mobile-card--active' : ''}`} onClick={() => setSelected(r)}>
              <p className="font-bold">{r.clinic_name}</p><p className="text-xs text-[var(--muted)]">{r.owner_name} · {r.status_label}</p>
            </article>
          ))}</div>
          <footer className="reg-footer">
            <span>Mostrando {filtered.length ? (page - 1) * pageSize + 1 : 0} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} solicitudes</span>
            <div className="reg-footer__pages">
              <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              <span>{page} / {totalPages}</span>
              <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="cln-toolbar__sort"><option value={10}>10 por página</option><option value={20}>20 por página</option></select>
            </div>
          </footer>
        </section>

        {selected ? (<>
          <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
          <aside className="cln-detail">
            <div className="cln-detail__head">
              <div><h2 className="cln-detail__title">Solicitud de clínica</h2><p className="cln-detail__sub">{selected.clinic_name}</p>
                <span className={`cln-badge ${statusBadgeClass(selected.status)}`}>{selected.status_label}</span></div>
              <button type="button" className="cln-icon-btn" aria-label="Cerrar" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="cln-detail__body">
              <ul className="cln-detail__meta">
                <DetailRow label="Nombre clínica" value={selected.clinic_name} icon={Building2} />
                <DetailRow label="Responsable" value={selected.owner_name} icon={User} />
                <DetailRow label="Email" value={selected.email} icon={Mail} />
                <DetailRow label="Teléfono" value={selected.phone} icon={Phone} />
                <DetailRow label="Dirección" value={selected.address} icon={MapPin} />
                <DetailRow label="Ciudad" value={selected.city} icon={MapPin} />
                <DetailRow label="NIF / CIF" value={selected.tax_id} icon={ClipboardList} mono />
                <DetailRow label="Plan solicitado" value={selected.requested_plan} icon={CheckCircle2} />
                <DetailRow label="Nº de sedes" value={String(selected.branches_count)} icon={Building2} />
                {selected.message ? <DetailRow label="Mensaje del solicitante" value={selected.message} icon={Mail} /> : null}
                <DetailRow label="Fecha de solicitud" value={selected.date_label} icon={Clock} />
                <DetailRow label="Estado" value={selected.status_label} icon={ClipboardList} />
              </ul>
              {canReview(selected) ? (<>
                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="cln-qa-btn" onClick={() => openApprove(selected)}>Aprobar y crear tenant</button>
                  <button type="button" className="cln-qa-btn" disabled={busy} onClick={() => void requestInfo()}>Solicitar más información</button>
                  <button type="button" className="cln-qa-btn cln-detail__danger" onClick={() => openReject(selected)}>Rechazar solicitud</button>
                  <button type="button" className="cln-qa-btn" onClick={() => setModal('manual')}>Crear clínica manualmente</button>
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/historial')}>Ver historial</button>
                </div>
              </>) : (
                <button type="button" className="cln-qa-btn mt-3" onClick={() => (window.location.href = '/platform/historial')}>Ver historial</button>
              )}
            </div>
          </aside>
        </>) : null}

        {modal === 'approve' && approveTarget ? (
          <div className="reg-modal-backdrop" role="dialog" aria-modal="true"><div className="reg-modal">
            <div className="reg-modal__head"><h3 className="reg-modal__title">Aprobar solicitud</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="reg-modal__body">
              <p className="text-sm text-[var(--muted)]">{approveTarget.clinic_name} · {approveTarget.owner_name}</p>
              <div className="reg-field"><label htmlFor="reg-plan">Plan asignado</label>
                <select id="reg-plan" value={approveForm.plan} onChange={(e) => setApproveForm((f) => ({ ...f, plan: e.target.value as SubscriptionPlan }))}>
                  <option value="">Seleccionar…</option><option value="essential">Básico</option><option value="professional">PRO Clínica</option><option value="enterprise">PRO Multi-sede</option>
                </select>{errors.plan ? <p className="reg-field__err">{errors.plan}</p> : null}</div>
              <div className="reg-field"><label htmlFor="reg-slug">Slug del tenant</label>
                <input id="reg-slug" value={approveForm.tenantSlug} onChange={(e) => setApproveForm((f) => ({ ...f, tenantSlug: e.target.value }))} />
                {errors.tenantSlug ? <p className="reg-field__err">{errors.tenantSlug}</p> : null}</div>
              <div className="reg-field"><label htmlFor="reg-email">Email administrador</label>
                <input id="reg-email" type="email" value={approveForm.adminEmail} onChange={(e) => setApproveForm((f) => ({ ...f, adminEmail: e.target.value }))} />
                {errors.adminEmail ? <p className="reg-field__err">{errors.adminEmail}</p> : null}</div>
              <label className="reg-check"><input type="checkbox" checked={approveForm.createCredentials} onChange={(e) => setApproveForm((f) => ({ ...f, createCredentials: e.target.checked }))} /> Crear credenciales</label>
              <label className="reg-check"><input type="checkbox" checked={approveForm.welcomeEmail} onChange={(e) => setApproveForm((f) => ({ ...f, welcomeEmail: e.target.checked }))} /> Enviar email de bienvenida</label>
              <label className="reg-check"><input type="checkbox" checked={approveForm.isolation} onChange={(e) => setApproveForm((f) => ({ ...f, isolation: e.target.checked }))} /> Activar aislamiento multi-tenant</label>
              <label className="reg-check"><input type="checkbox" checked={approveForm.subscription} onChange={(e) => setApproveForm((f) => ({ ...f, subscription: e.target.checked }))} /> Crear suscripción</label>
            </div>
            <div className="reg-modal__foot">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void submitApprove()}>Aprobar y crear tenant</button>
            </div>
          </div></div>
        ) : null}

        {modal === 'reject' && rejectTarget ? (
          <div className="reg-modal-backdrop" role="dialog" aria-modal="true"><div className="reg-modal">
            <div className="reg-modal__head"><h3 className="reg-modal__title">Rechazar solicitud</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="reg-modal__body">
              <p className="text-sm text-[var(--muted)]">{rejectTarget.clinic_name}</p>
              <div className="reg-field"><label htmlFor="reg-reason">Motivo del rechazo</label>
                <textarea id="reg-reason" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                {errors.reason ? <p className="reg-field__err">{errors.reason}</p> : null}</div>
              <label className="reg-check"><input type="checkbox" defaultChecked /> Notificar al solicitante</label>
            </div>
            <div className="reg-modal__foot">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void submitReject()}>Rechazar solicitud</button>
            </div>
          </div></div>
        ) : null}

        {modal === 'manual' ? (
          <div className="reg-modal-backdrop" role="dialog" aria-modal="true"><div className="reg-modal">
            <div className="reg-modal__head"><h3 className="reg-modal__title">Crear clínica manualmente</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="reg-modal__body">
              {[['clinicName','Nombre clínica'],['ownerName','Responsable'],['email','Email'],['phone','Teléfono'],['city','Ciudad']].map(([field,label]) => (
                <div key={field} className="reg-field"><label htmlFor={`m-${field}`}>{label}</label>
                  <input id={`m-${field}`} value={manualForm[field as keyof typeof manualForm]} onChange={(e) => setManualForm((f) => ({ ...f, [field]: e.target.value }))} /></div>
              ))}
              <div className="reg-field"><label htmlFor="m-plan">Plan solicitado</label>
                <select id="m-plan" value={manualForm.plan} onChange={(e) => setManualForm((f) => ({ ...f, plan: e.target.value }))}>
                  <option value="PRO Clínica">PRO Clínica</option><option value="PRO Multi-sede">PRO Multi-sede</option><option value="Básico">Básico</option>
                </select></div>
            </div>
            <div className="reg-modal__foot">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void submitManual()}>Crear solicitud</button>
            </div>
          </div></div>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !rows.length ? <p className="text-sm text-[var(--muted)]">Cargando solicitudes…</p> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({ label, value, icon: Icon, mono }: { label: string; value: ReactNode; icon: LucideIcon; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>
      <span className={`cln-detail__row-value${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}
