import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle, Building2, Calendar, Copy, CreditCard, Download, Eye, FileText, Layers,
  MoreVertical, PieChart, Plus, RefreshCw, Search, Settings, Star, TrendingUp, Users, Wallet, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import type { ClinicListRow } from '@/lib/platform/clinicsDemo';
import {
  PLATFORM_PLANS,
  getSubscriptionsKpis,
  type SubscriptionRow
} from '@/lib/platform/subscriptionsDemo';
import type { SubscriptionPlan } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/subscriptions', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo guardar la suscripción.');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip = 'all' | 'active' | 'pending' | 'suspended' | 'pro' | 'professional' | 'expiring' | 'unpaid';
type SortMode = 'renewal' | 'clinic' | 'plan' | 'status';
type Modal = 'create' | 'plan' | 'seats' | 'plans' | 'billing' | null;

function fmtEuro(n: number) {
  return `${n.toLocaleString('es-ES')} €`;
}

function statusBadge(s: SubscriptionRow['status']) {
  if (s === 'active') return 'sub-badge--active';
  if (s === 'trialing') return 'sub-badge--trial';
  if (s === 'past_due') return 'sub-badge--past_due';
  return 'sub-badge--canceled';
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
  { label: 'Suscripciones activas', key: 'active' as const, icon: Building2, tone: 'purple', spark: [0,1,1,1,1,1,1], numeric: true, fmt: (v: number) => String(v) },
  { label: 'MRR estimado', key: 'mrr' as const, icon: TrendingUp, tone: 'teal', spark: [0,0,0,0,0,0,0], fmt: fmtEuro },
  { label: 'ARR estimado', key: 'arr' as const, icon: PieChart, tone: 'blue', spark: [0,0,0,0,0,0,0], fmt: fmtEuro },
  { label: 'Planes PRO', key: 'proPlans' as const, icon: Star, tone: 'green', spark: [0,1,1,1,1,1,1], numeric: true, fmt: (v: number) => String(v) },
  { label: 'Asientos usados', key: 'seatsLabel' as const, icon: Users, tone: 'orange', spark: [8,9,10,10,10,10,10], fmt: (v: string) => v },
  { label: 'Cobros pendientes', key: 'pendingPayments' as const, icon: Wallet, tone: 'red', spark: [0,0,0,0,0,0,0], numeric: true, fmt: (v: number) => String(v) }
];

function SubKpi({ label, value, icon: Icon, tone, spark, delay, numeric }: {
  label: string; value: string | number; icon: LucideIcon; tone: string; spark: number[]; delay: number; numeric?: boolean;
}) {
  const counted = useCountUp(typeof value === 'number' ? value : 0, 750, Boolean(numeric && typeof value === 'number'));
  const n = numeric && typeof value === 'number' ? counted : value;
  return (
    <article className="plt-kpi cln-kpi sub-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

export function PlatformSubscriptions() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('renewal');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<SubscriptionRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createForm, setCreateForm] = useState({ clinicId: '', plan: '' as SubscriptionPlan | '', seats: '10', billingEmail: '' });
  const [planForm, setPlanForm] = useState<SubscriptionPlan | ''>('');
  const [seatsForm, setSeatsForm] = useState('10');
  const [billingForm, setBillingForm] = useState({ email: '', taxId: '' });
  const [clinics, setClinics] = useState<ClinicListRow[]>([]);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiGet<SubscriptionRow[]>('/api/platform/subscriptions');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las suscripciones.';
      setLoadError(msg);
      setRows([]);
      showToast('err', msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await apiGet<ClinicListRow[]>('/api/platform/clinics');
        setClinics(list);
      } catch {
        setClinics([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!didAutoSelect && rows.length) {
      setSelected(rows[0]);
      setDidAutoSelect(true);
    }
  }, [rows, didAutoSelect]);

  useEffect(() => {
    if (selected) {
      const f = rows.find((r) => r.id === selected.id);
      if (f) setSelected(f);
    }
  }, [rows, selected?.id]);

  useEffect(() => { setPage(1); }, [search, chip, sort, pageSize]);

  const kpis = useMemo(() => getSubscriptionsKpis(rows), [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const q = search.trim().toLowerCase();
    if (chip === 'active') list = list.filter((r) => r.status === 'active');
    if (chip === 'pending') list = list.filter((r) => r.status === 'trialing');
    if (chip === 'suspended') list = list.filter((r) => r.status === 'canceled');
    if (chip === 'pro') list = list.filter((r) => r.is_pro);
    if (chip === 'professional') list = list.filter((r) => r.plan === 'professional');
    if (chip === 'expiring') list = list.filter((r) => r.expiring_soon);
    if (chip === 'unpaid') list = list.filter((r) => r.has_unpaid || r.status === 'past_due');
    if (q) {
      list = list.filter(
        (r) =>
          r.clinic_name.toLowerCase().includes(q) ||
          r.tenant_slug.toLowerCase().includes(q) ||
          r.plan_label.toLowerCase().includes(q) ||
          r.status_label.toLowerCase().includes(q) ||
          r.billing_email.toLowerCase().includes(q)
      );
    }
    if (sort === 'clinic') list.sort((a, b) => a.clinic_name.localeCompare(b.clinic_name));
    else if (sort === 'plan') list.sort((a, b) => a.plan_label.localeCompare(b.plan_label));
    else if (sort === 'status') list.sort((a, b) => a.status_label.localeCompare(b.status_label));
    else {
      list.sort((a, b) => {
        const ta = new Date(a.renews_at).getTime();
        const tb = new Date(b.renews_at).getTime();
        return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
      });
    }
    return list;
  }, [rows, search, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  async function post(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const { data, message } = await apiPost<SubscriptionRow[]>(body);
      setRows(data);
      setModal(null);
      showToast('ok', message ?? okMsg ?? 'Guardado correctamente.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo guardar la suscripción.');
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setCreateForm({ clinicId: clinics[0]?.id ?? '', plan: 'professional', seats: '10', billingEmail: clinics[0]?.email ?? '' });
    setErrors({});
    setModal('create');
  }

  function openPlan(id: string) {
    const r = rows.find((x) => x.id === id);
    setTargetId(id);
    setPlanForm(r?.plan ?? 'professional');
    setErrors({});
    setModal('plan');
  }

  function openSeats(id: string) {
    const r = rows.find((x) => x.id === id);
    setTargetId(id);
    setSeatsForm(String(r?.seats_contracted ?? 10));
    setErrors({});
    setModal('seats');
  }

  function openBilling(r: SubscriptionRow) {
    setTargetId(r.id);
    setBillingForm({ email: r.billing_email, taxId: r.tax_id });
    setErrors({});
    setModal('billing');
  }

  function submitCreate() {
    const seats = Number(createForm.seats);
    const next: Record<string, string> = {};
    if (!createForm.clinicId) next.clinicId = 'Selecciona una clínica.';
    if (!createForm.plan) next.plan = 'Selecciona un plan.';
    if (!seats || seats < 1) next.seats = 'El número de asientos debe ser mayor que 0.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.billingEmail)) next.billingEmail = 'Introduce un email de facturación válido.';
    setErrors(next);
    if (Object.keys(next).length) return;
    void post({ action: 'create', clinicId: createForm.clinicId, plan: createForm.plan, seats, billingEmail: createForm.billingEmail }, 'Suscripción creada.');
  }

  function submitPlan() {
    if (!targetId || !planForm) { setErrors({ plan: 'Selecciona un plan.' }); return; }
    void post({ action: 'update_plan', id: targetId, plan: planForm });
  }

  function submitSeats() {
    const seats = Number(seatsForm);
    if (!targetId || !seats || seats < 1) { setErrors({ seats: 'El número de asientos debe ser mayor que 0.' }); return; }
    void post({ action: 'update_seats', id: targetId, seats });
  }

  function submitBilling() {
    if (!targetId) return;
    void post({ action: 'update_billing', id: targetId, billingEmail: billingForm.email, taxId: billingForm.taxId });
  }

  function suspend(id: string) {
    if (!window.confirm('¿Suspender esta suscripción? La clínica perderá acceso al plan activo.')) return;
    void post({ action: 'suspend', id }, 'Suscripción suspendida.');
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' }, { id: 'active', label: 'Activas' }, { id: 'pending', label: 'Pendientes' },
    { id: 'suspended', label: 'Suspendidas' }, { id: 'pro', label: 'PRO' }, { id: 'professional', label: 'Profesional' },
    { id: 'expiring', label: 'Vencen pronto' }, { id: 'unpaid', label: 'Con impago' }
  ];

  return (
    <PlatformShell
      title="Suscripciones SaaS"
      subtitle="Gestiona planes, renovaciones, asientos, límites y estado de facturación por clínica."
      headerActions={
        <>
          <button type="button" className="plt-btn plt-btn--primary" onClick={openCreate}><Plus className="h-4 w-4" aria-hidden />Crear suscripción</button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { window.location.href = '/api/platform/subscriptions-export'; showToast('ok', 'CSV exportado.'); }}><Download className="h-4 w-4" aria-hidden />Exportar CSV</button>
          <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { const id = selected?.id ?? rows[0]?.id; if (id) window.location.href = `/api/platform/subscriptions-report?id=${id}`; else showToast('err', 'Sin datos para el informe.'); }}><FileText className="h-4 w-4" aria-hidden />Generar informe</button>
          <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal('plans')}><Settings className="h-4 w-4" aria-hidden />Configurar planes</button>
        </>
      }
    >
      <div className={`sub-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <SubKpi key={k.label} label={k.label}
              value={k.key === 'seatsLabel' ? kpis.seatsLabel : (k.key === 'mrr' || k.key === 'arr') ? k.fmt(kpis[k.key] as number) : kpis[k.key]}
              icon={k.icon} tone={k.tone} spark={k.spark} delay={i * 70} numeric={'numeric' in k && k.numeric} />
          ))}
        </div>

        {loadError && !loading ? (
          <section className="sub-empty" role="alert">
            <AlertTriangle className="sub-empty__icon" aria-hidden />
            <h3 className="sub-empty__title">No se pudo cargar el listado</h3>
            <p className="sub-empty__text">{loadError}</p>
            <button type="button" className="plt-btn plt-btn--primary" onClick={() => void load()}>
              Reintentar
            </button>
          </section>
        ) : null}

        <div className="cln-toolbar">
          <label className="cln-search"><Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por clínica, tenant, plan, estado o email de facturación…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">{chips.map((c) => (
              <button key={c.id} type="button" role="tab" aria-selected={chip === c.id} className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => setChip(c.id)}>{c.label}</button>
            ))}</div>
            <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Ordenar">
              <option value="renewal">Ordenar por: próxima renovación</option>
              <option value="clinic">Ordenar por: clínica</option>
              <option value="plan">Ordenar por: plan</option>
              <option value="status">Ordenar por: estado</option>
            </select>
            <button type="button" className="cln-icon-btn" title="Actualizar" onClick={() => void load()}><RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} /></button>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">Listado de suscripciones <span className="hist-card-count">({filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'})</span></h2>

          {rows.length === 0 && !loading ? (
            <section className="sub-empty">
              <Building2 className="sub-empty__icon" aria-hidden />
              <h3 className="sub-empty__title">No hay suscripciones creadas</h3>
              <p className="sub-empty__text">Cuando apruebes una clínica o crees una organización, podrás asignarle un plan y configurar su facturación SaaS.</p>
              <div className="reg-empty__actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="plt-btn plt-btn--primary" onClick={openCreate}><Plus className="h-4 w-4" />Crear suscripción</button>
                <a href="/platform/registros" className="plt-btn plt-btn--secondary">Ver registros aprobados</a>
              </div>
            </section>
          ) : filtered.length === 0 ? (
            <section className="sub-empty">
              <Search className="sub-empty__icon" aria-hidden />
              <h3 className="sub-empty__title">No hay resultados con este filtro</h3>
              <p className="sub-empty__text">Prueba otro término o limpia los filtros.</p>
              <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { setSearch(''); setChip('all'); }}>Limpiar filtros</button>
            </section>
          ) : (
            <>
              <div className="cln-table-wrap">
                <table className="cln-table sub-table">
                  <thead><tr><th>Clínica</th><th>Tenant</th><th>Plan</th><th>Estado</th><th>Asientos</th><th>Renovación</th><th>Facturación</th><th>Acciones</th></tr></thead>
                  <tbody>{pageRows.map((r, i) => (
                    <tr key={r.id} className={selected?.id === r.id ? 'cln-table__row--active' : ''} style={{ animationDelay: `${i * 45}ms` }} onClick={() => setSelected(r)}>
                      <td><div className="cln-clinic-cell"><strong>{r.clinic_name}</strong><span>{r.clinic_email}</span></div></td>
                      <td><span className="cln-detail__row-value--mono inline-flex items-center gap-1">{r.tenant_slug}<button type="button" className="cln-icon-btn" style={{ width: '1.25rem', height: '1.25rem' }} onClick={(e) => { e.stopPropagation(); void navigator.clipboard.writeText(r.tenant_slug); showToast('ok', 'Tenant copiado.'); }}><Copy className="h-3 w-3" /></button></span></td>
                      <td><span className="cln-badge cln-badge--plan-pro">{r.plan_label}</span></td>
                      <td><span className={`cln-badge cln-badge--status ${statusBadge(r.status)}`}><span className="cln-status-dot" />{r.status_label}</span></td>
                      <td><div>{r.seats_used} / {r.seats_contracted}{r.seats_percent >= 100 ? <span className="sub-badge--seats-full cln-badge">100%</span> : null}</div></td>
                      <td><div>{r.renewal_label}<span className="block text-xs text-orange-600">{r.renewal_sublabel}</span></div></td>
                      <td><div>{r.billing_label}<span className="block text-xs text-emerald-700">● {r.billing_status_label}</span></div></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="cln-actions">
                          <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></button>
                          <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Cambiar plan" onClick={() => openPlan(r.id)}><Layers className="h-3.5 w-3.5" /></button>
                          <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ajustar asientos" onClick={() => openSeats(r.id)}><Users className="h-3.5 w-3.5" /></button>
                          <div className="cln-menu">
                            <button type="button" className="cln-icon-btn" onClick={() => setMenuId(menuId === r.id ? null : r.id)}><MoreVertical className="h-3.5 w-3.5" /></button>
                            {menuId === r.id ? <div className="cln-menu__pop">
                              <button type="button" onClick={() => { void post({ action: 'generate_invoice', id: r.id }); setMenuId(null); }}>Generar factura</button>
                              <button type="button" onClick={() => { void post({ action: 'send_reminder', id: r.id }); setMenuId(null); }}>Enviar recordatorio</button>
                              <button type="button" className="cln-menu__danger" onClick={() => { suspend(r.id); setMenuId(null); }}>Suspender</button>
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
                  <p className="font-bold">{r.clinic_name}</p><p className="text-xs text-[var(--muted)]">{r.plan_label} · {r.status_label}</p>
                </article>
              ))}</div>
              <footer className="reg-footer">
                <span>Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</span>
                <div className="reg-footer__pages">
                  <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  <span>{page} / {totalPages}</span>
                  <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="cln-toolbar__sort"><option value={10}>10 por página</option><option value={20}>20 por página</option></select>
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
                  <h2 className="cln-detail__title">{selected.clinic_name}</h2>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`cln-badge ${statusBadge(selected.status)}`}>{selected.status_label}</span>
                    <span className="cln-badge cln-badge--plan-pro">Plan {selected.plan_label}</span>
                  </div>
                </div>
                <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow label="Plan actual" value={selected.plan_label} icon={Star} />
                  <DetailRow label="Estado" value={selected.status_label} icon={Building2} />
                  <DetailRow label="Tenant" value={selected.tenant_slug} icon={Layers} mono />
                  <DetailRow label="Asientos contratados" value={String(selected.seats_contracted)} icon={Users} />
                  <DetailRow label="Asientos usados" value={String(selected.seats_used)} icon={Users} />
                  <DetailRow label="Próxima renovación" value={`${selected.renewal_label} (${selected.renewal_sublabel})`} icon={Calendar} />
                  <DetailRow label="Precio mensual" value={fmtEuro(selected.monthly_price)} icon={CreditCard} />
                  <DetailRow label="Método de pago" value={selected.payment_method} icon={Wallet} />
                  <DetailRow label="Email de facturación" value={selected.billing_email} icon={Building2} />
                  <DetailRow label="NIF / CIF" value={selected.tax_id} icon={FileText} mono />
                  <DetailRow label="Última factura SaaS" value={selected.last_invoice ?? '—'} icon={FileText} />
                  <DetailRow label="Estado de cobro" value={selected.billing_status_label} icon={Wallet} />
                </ul>

                <div className="sub-detail-card">
                  <h3 className="sub-detail-card__title">Uso de asientos</h3>
                  <p className="text-lg font-extrabold">{selected.seats_used} / {selected.seats_contracted} <span className="text-sm font-semibold text-[var(--muted)]">({selected.seats_percent}% usados)</span></p>
                  <div className="sub-seats-bar"><div className={`sub-seats-bar__fill${selected.seats_percent >= 100 ? ' sub-seats-bar__fill--warn' : ''}`} style={{ width: `${Math.min(selected.seats_percent, 100)}%` }} /></div>
                  {selected.seats_percent >= 100 ? <p className="sub-seats-warn"><AlertTriangle className="h-3.5 w-3.5" />Límite alcanzado</p> : null}
                </div>

                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="sub-qa-grid">
                  <button type="button" className="cln-qa-btn" onClick={() => openPlan(selected.id)}>Cambiar plan</button>
                  <button type="button" className="cln-qa-btn" onClick={() => openSeats(selected.id)}>Ajustar asientos</button>
                  <button type="button" className="cln-qa-btn" onClick={() => void post({ action: 'generate_invoice', id: selected.id })}>Generar factura SaaS</button>
                  <button type="button" className="cln-qa-btn" onClick={() => void post({ action: 'send_reminder', id: selected.id })}>Enviar recordatorio</button>
                  <button type="button" className="cln-qa-btn cln-detail__danger" onClick={() => suspend(selected.id)}>Suspender suscripción</button>
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/historial')}>Ver historial</button>
                </div>

                <div className="sub-detail-card">
                  <h3 className="sub-detail-card__title">Planes disponibles</h3>
                  <ul className="sub-plans-list">{PLATFORM_PLANS.map((p) => (
                    <li key={p.name}><strong>{p.name}</strong><span>{p.desc}</span></li>
                  ))}</ul>
                </div>

                <div className="sub-detail-card sub-billing-rows">
                  <h3 className="sub-detail-card__title">Facturación SaaS</h3>
                  <div className="sub-billing-row"><span>Última factura</span><strong>{selected.last_invoice ?? '—'}</strong></div>
                  <div className="sub-billing-row"><span>Próxima factura</span><strong>{selected.next_invoice}</strong></div>
                  <div className="sub-billing-row"><span>Estado de cobro</span><strong>{selected.billing_status_label}</strong></div>
                  <div className="sub-billing-row"><span>Método de pago</span><strong>{selected.payment_method}</strong></div>
                  <div className="sub-billing-row"><span>Email fiscal</span><strong>{selected.billing_email}</strong></div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button type="button" className="plt-btn plt-btn--secondary" onClick={() => selected.last_invoice && showToast('ok', 'Factura disponible en historial.')}>Descargar factura</button>
                    <button type="button" className="plt-btn plt-btn--primary" onClick={() => void post({ action: 'generate_invoice', id: selected.id })}>Generar factura</button>
                    <button type="button" className="plt-btn plt-btn--ghost" onClick={() => openBilling(selected)}>Editar datos fiscales</button>
                  </div>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {modal === 'create' ? (
          <div className="sub-modal-backdrop" role="dialog" aria-modal="true"><div className="sub-modal">
            <div className="sub-modal__head"><h3 className="sub-modal__title">Crear suscripción</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X className="h-4 w-4" /></button></div>
            <div className="sub-modal__body">
              <div className="sub-field"><label>Clínica</label>
                <select value={createForm.clinicId} onChange={(e) => { const c = clinics.find((x) => x.id === e.target.value); setCreateForm((f) => ({ ...f, clinicId: e.target.value, billingEmail: c?.email ?? f.billingEmail })); }}>
                  <option value="">Seleccionar…</option>{clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>{errors.clinicId ? <p className="sub-field__err">{errors.clinicId}</p> : null}</div>
              <div className="sub-field"><label>Plan</label>
                <select value={createForm.plan} onChange={(e) => setCreateForm((f) => ({ ...f, plan: e.target.value as SubscriptionPlan }))}>
                  <option value="">Seleccionar…</option><option value="essential">Básico</option><option value="professional">Profesional</option><option value="enterprise">PRO Multi-sede</option>
                </select>{errors.plan ? <p className="sub-field__err">{errors.plan}</p> : null}</div>
              <div className="sub-field"><label>Asientos</label><input type="number" min={1} value={createForm.seats} onChange={(e) => setCreateForm((f) => ({ ...f, seats: e.target.value }))} />{errors.seats ? <p className="sub-field__err">{errors.seats}</p> : null}</div>
              <div className="sub-field"><label>Email de facturación</label><input type="email" value={createForm.billingEmail} onChange={(e) => setCreateForm((f) => ({ ...f, billingEmail: e.target.value }))} />{errors.billingEmail ? <p className="sub-field__err">{errors.billingEmail}</p> : null}</div>
            </div>
            <div className="sub-modal__foot"><button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={submitCreate}>Crear suscripción</button></div>
          </div></div>
        ) : null}

        {modal === 'plan' ? (
          <div className="sub-modal-backdrop" role="dialog" aria-modal="true"><div className="sub-modal">
            <div className="sub-modal__head"><h3 className="sub-modal__title">Cambiar plan</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X /></button></div>
            <div className="sub-modal__body"><div className="sub-field"><label>Plan asignado</label>
              <select value={planForm} onChange={(e) => setPlanForm(e.target.value as SubscriptionPlan)}>
                <option value="essential">Básico</option><option value="professional">Profesional</option><option value="enterprise">PRO Multi-sede / Enterprise</option>
              </select>{errors.plan ? <p className="sub-field__err">{errors.plan}</p> : null}</div></div>
            <div className="sub-modal__foot"><button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={submitPlan}>Guardar plan</button></div>
          </div></div>
        ) : null}

        {modal === 'seats' ? (
          <div className="sub-modal-backdrop" role="dialog" aria-modal="true"><div className="sub-modal">
            <div className="sub-modal__head"><h3 className="sub-modal__title">Ajustar asientos</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X /></button></div>
            <div className="sub-modal__body"><div className="sub-field"><label>Asientos contratados</label><input type="number" min={1} value={seatsForm} onChange={(e) => setSeatsForm(e.target.value)} />{errors.seats ? <p className="sub-field__err">{errors.seats}</p> : null}</div></div>
            <div className="sub-modal__foot"><button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={submitSeats}>Guardar</button></div>
          </div></div>
        ) : null}

        {modal === 'billing' ? (
          <div className="sub-modal-backdrop" role="dialog" aria-modal="true"><div className="sub-modal">
            <div className="sub-modal__head"><h3 className="sub-modal__title">Editar datos fiscales</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X /></button></div>
            <div className="sub-modal__body">
              <div className="sub-field"><label>Email fiscal</label><input type="email" value={billingForm.email} onChange={(e) => setBillingForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="sub-field"><label>NIF / CIF</label><input value={billingForm.taxId} onChange={(e) => setBillingForm((f) => ({ ...f, taxId: e.target.value }))} /></div>
            </div>
            <div className="sub-modal__foot"><button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button><button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={submitBilling}>Guardar</button></div>
          </div></div>
        ) : null}

        {modal === 'plans' ? (
          <div className="sub-modal-backdrop" role="dialog" aria-modal="true"><div className="sub-modal">
            <div className="sub-modal__head"><h3 className="sub-modal__title">Configurar planes</h3><button type="button" className="cln-icon-btn" onClick={() => setModal(null)}><X /></button></div>
            <div className="sub-modal__body"><ul className="sub-plans-list">{PLATFORM_PLANS.map((p) => (
              <li key={p.name}><strong>{p.name}</strong><span>{p.desc}</span></li>
            ))}</ul><p className="text-xs text-[var(--muted)]">Los planes se aplican al crear o cambiar suscripciones de clínicas.</p></div>
            <div className="sub-modal__foot"><button type="button" className="plt-btn plt-btn--primary" onClick={() => { setModal(null); showToast('ok', 'Catálogo de planes actualizado.'); }}>Cerrar</button></div>
          </div></div>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
        {loading && !rows.length ? <p className="text-sm text-[var(--muted)]">Cargando suscripciones…</p> : null}
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
