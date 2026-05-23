import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Eye,
  Link2,
  List,
  Lock,
  Monitor,
  MoreVertical,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import {
  POLICY_CHECKLIST,
  type IsolationClinicRow,
  type IsolationPayload,
  type IsolationRisk
} from '@/lib/platform/isolationDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', headers: { 'content-type': 'application/json' } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiAction<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/isolation', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return { data: json.data as T, message: json.meta?.message };
}

type FilterChip = 'all' | 'isolated' | 'no-tenant' | 'rls-active' | 'pending' | 'incidents' | 'high-risk';

const RLS_TABLES = [
  'clinics',
  'profiles',
  'patients',
  'appointments',
  'invoices',
  'payments',
  'documents',
  'messages',
  'consents',
  'records',
  'notifications',
  'audit_logs'
];

const POLICY_KEYS: { key: string; label: string }[] = [
  { key: 'uniqueTenant', label: 'Tenant único por clínica' },
  { key: 'rlsActive', label: 'RLS activo en Supabase' },
  { key: 'clinicScopedUsers', label: 'Usuarios limitados a su clínica' },
  { key: 'isolatedPortal', label: 'Portal paciente aislado' },
  { key: 'adminMetadataOnly', label: 'Super Admin solo ve metadatos agregados' },
  { key: 'manualReview', label: 'Registros revisados manualmente' }
];

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (p / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

function riskLabel(r: IsolationRisk) {
  if (r === 'high') return 'Alto';
  if (r === 'medium') return 'Medio';
  return 'Bajo';
}

function riskClass(r: IsolationRisk) {
  if (r === 'high') return 'cln-badge--suspended';
  if (r === 'medium') return 'cln-badge--pending';
  return 'cln-badge--active';
}

const KPI_CONFIG: {
  label: string;
  getValue: (k: IsolationPayload['kpis']) => string | number;
  icon: LucideIcon;
  tone: string;
  spark: number[];
  sub: (k: IsolationPayload['kpis']) => string;
  numeric?: boolean;
}[] = [
  {
    label: 'Clínicas con tenant',
    getValue: (k) => k.withTenant,
    icon: Building2,
    tone: 'green',
    spark: [0, 1, 1, 1, 1, 1, 1],
    sub: (k) => `${k.withTenant ? '100' : '0'}% del total`,
    numeric: true
  },
  {
    label: 'Clínicas sin tenant',
    getValue: (k) => k.withoutTenant,
    icon: AlertTriangle,
    tone: 'orange',
    spark: [0, 0, 0, 0, 0, 0, 0],
    sub: () => 'Revisar urgentemente',
    numeric: true
  },
  {
    label: 'Tenants aislados',
    getValue: (k) => k.isolatedTenants,
    icon: Link2,
    tone: 'purple',
    spark: [1, 1, 1, 1, 1, 1, 1],
    sub: () => '100% aislados'
  },
  {
    label: 'Reglas RLS activas',
    getValue: (k) => k.rlsRules,
    icon: Shield,
    tone: 'blue',
    spark: [8, 10, 11, 12, 12, 12, 12],
    sub: () => 'Tablas protegidas',
    numeric: true
  },
  {
    label: 'Usuarios staff',
    getValue: (k) => k.staffUsers,
    icon: Users,
    tone: 'teal',
    spark: [1, 1, 1, 1, 1, 1, 1],
    sub: () => 'En todas las clínicas',
    numeric: true
  },
  {
    label: 'Incidencias de aislamiento',
    getValue: (k) => k.isolationIncidents,
    icon: ShieldAlert,
    tone: 'red',
    spark: [0, 0, 0, 0, 0, 0, 0],
    sub: (k) => (k.isolationIncidents ? 'Revisar' : 'Sin incidencias'),
    numeric: true
  }
];

function IsoKpi({
  label,
  value,
  icon: Icon,
  tone,
  spark,
  sub,
  delay,
  numeric
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
  spark: number[];
  sub: string;
  delay: number;
  numeric?: boolean;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className="plt-kpi cln-kpi iso-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="plt-kpi__body">
        <p className="plt-kpi__label">{label}</p>
        <p className="plt-kpi__value">{n}</p>
        <p className="text-xs text-[var(--muted)]">{sub}</p>
      </div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

export function PlatformIsolation() {
  const [payload, setPayload] = useState<IsolationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [selected, setSelected] = useState<IsolationClinicRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const [riskPulse, setRiskPulse] = useState<string | null>(null);
  const [testAnim, setTestAnim] = useState(false);
  const [modal, setModal] = useState<'policies' | 'rls' | null>(null);
  const [policyDraft, setPolicyDraft] = useState<Record<string, boolean>>({});

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayload(await apiGet<IsolationPayload>('/api/platform/isolation'));
    } catch {
      showToast('err', 'No se pudo cargar el informe de aislamiento.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!didAutoSelect && payload?.clinics.length) {
      setSelected(payload.clinics[0]);
      setDidAutoSelect(true);
    }
  }, [payload, didAutoSelect]);

  useEffect(() => {
    if (!selected || !payload) return;
    const fresh = payload.clinics.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [payload, selected?.id]);

  const filtered = useMemo(() => {
    if (!payload) return [];
    const q = search.trim().toLowerCase();
    let list = [...payload.clinics];
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.status_label.toLowerCase().includes(q) ||
          c.rls_label.toLowerCase().includes(q) ||
          riskLabel(c.risk).toLowerCase().includes(q) ||
          String(c.staff_count).includes(q)
      );
    }
    if (chip === 'isolated') list = list.filter((c) => c.status_label === 'Aislado');
    if (chip === 'no-tenant') list = list.filter((c) => !c.has_tenant);
    if (chip === 'rls-active') list = list.filter((c) => c.rls_active);
    if (chip === 'pending') list = list.filter((c) => c.status_label === 'Pendiente' || !c.rls_active);
    if (chip === 'incidents') list = list.filter((c) => c.incidents > 0);
    if (chip === 'high-risk') list = list.filter((c) => c.risk === 'high');
    return list;
  }, [payload, search, chip]);

  async function runVerify() {
    setBusy(true);
    try {
      const { data, message } = await apiAction<IsolationPayload>({ action: 'verify' });
      setPayload(data);
      const failed = data.tests.some((t) => t.status === 'fail');
      showToast(
        failed ? 'err' : 'ok',
        failed ? 'Verificación completada con incidencias críticas.' : (message ?? 'Verificación completada sin incidencias.')
      );
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Error al verificar.');
    } finally {
      setBusy(false);
    }
  }

  async function runClinicTest(clinicId: string) {
    setBusy(true);
    try {
      const { data, message } = await apiAction<IsolationPayload>({ action: 'test', clinicId });
      setPayload(data);
      setTestAnim(true);
      window.setTimeout(() => setTestAnim(false), 600);
      showToast('ok', message ?? 'Pruebas de aislamiento correctas.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'Error en las pruebas.');
    } finally {
      setBusy(false);
    }
  }

  async function runAllTests() {
    if (!payload?.clinics.length) return;
    await runClinicTest(payload.clinics[0].id);
  }

  async function escalate(clinicId: string) {
    setBusy(true);
    setMenuId(null);
    try {
      const { data, message } = await apiAction<IsolationPayload>({ action: 'escalate', clinicId });
      setPayload(data);
      setRiskPulse(clinicId);
      window.setTimeout(() => setRiskPulse(null), 500);
      showToast('ok', message ?? 'Incidencia escalada.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo escalar.');
    } finally {
      setBusy(false);
    }
  }

  async function savePolicies() {
    setBusy(true);
    try {
      const { data, message } = await apiAction<IsolationPayload>({ action: 'update_policies', policies: policyDraft });
      setPayload(data);
      setModal(null);
      showToast('ok', message ?? 'Políticas actualizadas.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudieron guardar las políticas.');
    } finally {
      setBusy(false);
    }
  }

  function exportReport() {
    window.location.href = '/api/platform/isolation-export';
    showToast('ok', 'Informe de aislamiento descargado.');
  }

  function openPolicies() {
    setPolicyDraft(payload?.policies ?? {});
    setModal('policies');
  }

  function copySlug(slug: string) {
    void navigator.clipboard.writeText(slug);
    showToast('ok', 'Slug copiado al portapapeles.');
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'isolated', label: 'Aisladas' },
    { id: 'no-tenant', label: 'Sin tenant' },
    { id: 'rls-active', label: 'RLS activo' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'incidents', label: 'Con incidencias' },
    { id: 'high-risk', label: 'Riesgo alto' }
  ];

  const headerActions = (
    <>
      <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void runVerify()}>
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Ejecutar verificación
      </button>
      <button type="button" className="plt-btn plt-btn--secondary" onClick={exportReport}>
        <Download className="h-4 w-4" aria-hidden />
        Exportar informe
      </button>
      <button type="button" className="plt-btn plt-btn--ghost" onClick={() => (window.location.href = '/platform/incidencias')}>
        <List className="h-4 w-4" aria-hidden />
        Ver auditoría
      </button>
      <button type="button" className="plt-btn plt-btn--ghost" onClick={openPolicies}>
        <Settings className="h-4 w-4" aria-hidden />
        Configurar políticas
      </button>
    </>
  );

  return (
    <PlatformShell
      title="Aislamiento multi-tenant"
      subtitle="Supervisa la separación de datos, tenants, usuarios, permisos y reglas RLS entre clínicas."
      headerActions={headerActions}
    >
      <div className={`iso-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        {payload ? (
          <section className="iso-policy">
            <div className="iso-policy__main">
              <div className="iso-policy__head">
                <h2 className="iso-policy__title">Política de aislamiento activa</h2>
                <span className="iso-policy__badge">
                  <Lock className="h-3 w-3" aria-hidden />
                  Seguro
                </span>
              </div>
              <p className="iso-policy__desc">
                Cada clínica opera en un tenant independiente. Los datos clínicos, pacientes, facturas, documentos y mensajes quedan separados por organización.
              </p>
              <ul className="iso-policy__checks">
                {POLICY_CHECKLIST.map((item, i) => (
                  <li key={item} className="iso-policy__check" style={{ animationDelay: `${i * 60}ms` }}>
                    <CheckCircle2 className="iso-policy__check-icon h-4 w-4" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="iso-policy__aside">
              <div className="iso-policy__stat">
                <span>Última verificación</span>
                <strong>{payload.lastVerification}</strong>
              </div>
              <div className="iso-policy__stat iso-policy__stat--ok">
                <span>Resultado</span>
                <strong>{payload.verificationResult}</strong>
              </div>
              <div className="iso-policy__coverage">
                <div className="iso-policy__coverage-label">
                  <span>Cobertura</span>
                  <span>{payload.coverage}%</span>
                </div>
                <div className="iso-policy__bar">
                  <div className="iso-policy__bar-fill" style={{ width: `${payload.coverage}%` }} />
                </div>
              </div>
              <Shield className="iso-policy__shield" aria-hidden />
            </aside>
          </section>
        ) : null}

        {payload ? (
          <div className="cln-kpis plt-kpis">
            {KPI_CONFIG.map((k, i) => (
              <IsoKpi
                key={k.label}
                label={k.label}
                value={k.getValue(payload.kpis)}
                icon={k.icon}
                tone={k.tone}
                spark={k.spark}
                sub={k.sub(payload.kpis)}
                delay={i * 70}
                numeric={k.numeric}
              />
            ))}
          </div>
        ) : null}

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input
              placeholder="Buscar por clínica, tenant, estado, riesgo o usuario…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar clínicas"
            />
          </label>
          <div className="cln-chips" role="tablist">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={chip === c.id}
                className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`}
                onClick={() => setChip(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">Estado de aislamiento por clínica</h2>
          <div className="cln-table-wrap">
            <table className="cln-table iso-table">
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th>Tenant</th>
                  <th>Estado</th>
                  <th>RLS</th>
                  <th>Usuarios</th>
                  <th>Pacientes</th>
                  <th>Última revisión</th>
                  <th>Riesgo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`${selected?.id === c.id ? 'cln-table__row--active' : ''}${!c.has_tenant ? ' iso-row--no-tenant' : ''}`}
                    style={{ animationDelay: `${i * 45}ms` }}
                    onClick={() => setSelected(c)}
                  >
                    <td>
                      <div className="cln-clinic-cell">
                        <strong>{c.name}</strong>
                        <span>{c.slug}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cln-clinic-cell">
                        <strong>{c.slug}</strong>
                        <span className="cln-detail__row-value--mono">{c.tenant_display}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`cln-badge cln-badge--status${c.has_tenant ? ' cln-badge--active' : ' cln-badge--pending'}`}>
                        <span className="cln-status-dot" />
                        {c.status_label}
                      </span>
                    </td>
                    <td>
                      <span className={`cln-badge cln-badge--status${c.rls_active ? ' cln-badge--active' : ' cln-badge--pending'}`}>
                        <span className="cln-status-dot" />
                        {c.rls_label}
                      </span>
                    </td>
                    <td>{c.staff_count}</td>
                    <td>{c.patient_count}</td>
                    <td>{c.last_review}</td>
                    <td>
                      <span className={`cln-badge ${riskClass(c.risk)}${riskPulse === c.id ? ' iso-risk--pulse' : ''}`}>
                        {riskLabel(c.risk)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="cln-actions">
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(c)}>
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ejecutar test" disabled={busy} onClick={() => void runClinicTest(c.id)}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver reglas" onClick={() => setModal('rls')}>
                          <ClipboardList className="h-3.5 w-3.5" />
                        </button>
                        <div className="cln-menu">
                          <button type="button" className="cln-icon-btn" aria-label="Más acciones" onClick={() => setMenuId(menuId === c.id ? null : c.id)}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                          {menuId === c.id ? (
                            <div className="cln-menu__pop">
                              <button type="button" onClick={() => { setSelected(c); setMenuId(null); }}>
                                Ver detalle completo
                              </button>
                              <button type="button" onClick={() => { exportReport(); setMenuId(null); }}>
                                Exportar informe
                              </button>
                              <button type="button" className="cln-menu__danger" onClick={() => void escalate(c.id)}>
                                Escalar incidencia
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
            {filtered.map((c) => (
              <article
                key={c.id}
                className={`cln-mobile-card${selected?.id === c.id ? ' cln-mobile-card--active' : ''}${!c.has_tenant ? ' iso-row--no-tenant' : ''}`}
                onClick={() => setSelected(c)}
              >
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{c.slug} · {c.status_label}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="iso-bottom">
          <section className="iso-side-card">
            <h3 className="iso-side-card__title">Pruebas de aislamiento</h3>
            <div className="iso-side-card__body">
              {payload?.tests.map((t) => (
                <div key={t.id} className="iso-test-row">
                  <span>{t.label}</span>
                  <span className={`iso-test-row__status iso-test-row__status--${t.status}${testAnim ? ' iso-risk--pulse' : ''}`}>
                    {t.status === 'ok' ? 'Correcto' : t.status === 'fail' ? 'Fallo' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
            <div className="iso-side-card__foot">
              <button type="button" className="plt-btn plt-btn--secondary w-full" disabled={busy} onClick={() => void runAllTests()}>
                Ejecutar todas las pruebas
              </button>
            </div>
          </section>
          <section className="iso-side-card">
            <h3 className="iso-side-card__title">Actividad de aislamiento</h3>
            <div className="iso-side-card__body">
              {payload?.activity.map((a) => (
                <div key={a.id} className="iso-act-row">
                  <span>{a.label}</span>
                  <span>{a.when}</span>
                </div>
              ))}
            </div>
            <div className="iso-side-card__foot">
              <button type="button" className="plt-btn plt-btn--ghost w-full" onClick={() => (window.location.href = '/platform/incidencias')}>
                Ver auditoría completa
              </button>
            </div>
          </section>
        </div>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
            <aside className="cln-detail">
              <div className="cln-detail__head">
                <div>
                  <h2 className="cln-detail__title">Detalle de aislamiento</h2>
                  <p className="cln-detail__sub">{selected.name}</p>
                </div>
                <button type="button" className="cln-icon-btn" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <DetailRow label="Clínica" value={selected.name} icon={Building2} />
                  <DetailRow label="Tenant ID" value={selected.tenant_display} icon={Link2} mono />
                  <DetailRow
                    label="Slug"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {selected.slug}
                        <button type="button" className="cln-icon-btn" style={{ width: '1.5rem', height: '1.5rem' }} onClick={() => copySlug(selected.slug)}>
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    }
                    icon={Link2}
                  />
                  <DetailRow label="Estado" value={selected.status_label} icon={Shield} valueClass="cln-val--ok" />
                  <DetailRow label="RLS" value={selected.rls_label} icon={Lock} valueClass="cln-val--ok" />
                  <DetailRow label="Tablas protegidas" value={String(selected.protected_tables)} icon={ClipboardList} />
                  <DetailRow label="Usuarios staff" value={String(selected.staff_count)} icon={Users} />
                  <DetailRow label="Pacientes" value={String(selected.patient_count)} icon={UserRound} />
                  <DetailRow label="Panel" value={selected.panel_path} icon={Monitor} mono />
                  <DetailRow label="Portal paciente" value={selected.portal_isolated ? 'Aislado' : 'Pendiente'} icon={ShieldCheck} />
                  <DetailRow label="Última revisión" value={selected.last_review} icon={ClipboardList} />
                  <DetailRow label="Incidencias" value={String(selected.incidents)} icon={AlertTriangle} valueClass={selected.incidents ? 'cln-val--danger' : undefined} />
                  <DetailRow
                    label="Nivel de riesgo"
                    value={riskLabel(selected.risk)}
                    icon={ShieldAlert}
                    valueClass={selected.risk === 'low' ? 'cln-val--ok' : 'cln-val--danger'}
                  />
                </ul>
                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="cln-qa-btn" disabled={busy} onClick={() => void runVerify()}>
                    Ejecutar verificación
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => setModal('rls')}>
                    Ver reglas RLS
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => (window.location.href = '/platform/incidencias')}>
                    Ver auditoría
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={exportReport}>
                    Exportar informe
                  </button>
                  <button type="button" className="cln-qa-btn cln-detail__danger" disabled={busy} onClick={() => void escalate(selected.id)}>
                    Escalar incidencia
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {modal === 'policies' ? (
          <div className="iso-modal-backdrop" role="dialog" aria-modal="true">
            <div className="iso-modal">
              <div className="iso-modal__head">
                <h3 className="iso-modal__title">Configurar políticas de aislamiento</h3>
                <button type="button" className="cln-icon-btn" onClick={() => setModal(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="iso-modal__body">
                {POLICY_KEYS.map((p) => (
                  <label key={p.key} className="iso-policy-toggle">
                    {p.label}
                    <input
                      type="checkbox"
                      checked={policyDraft[p.key] ?? false}
                      onChange={(e) => setPolicyDraft((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>
              <div className="iso-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void savePolicies()}>
                  Guardar políticas
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {modal === 'rls' ? (
          <div className="iso-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
            <div className="iso-modal" onClick={(e) => e.stopPropagation()}>
              <div className="iso-modal__head">
                <h3 className="iso-modal__title">Reglas RLS activas</h3>
                <button type="button" className="cln-icon-btn" onClick={() => setModal(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="iso-modal__body">
                <p className="text-sm text-[var(--muted)] mb-2">
                  Políticas de fila en Supabase que garantizan aislamiento por clinic_id / tenant.
                </p>
                <ul className="iso-rls-list">
                  {RLS_TABLES.map((t) => (
                    <li key={t}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="iso-modal__foot">
                <button type="button" className="plt-btn plt-btn--primary" onClick={() => setModal(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? (
          <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">
            {toast.text}
          </div>
        ) : null}

        {loading && !payload ? <p className="text-sm text-[var(--muted)]">Cargando informe…</p> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  valueClass,
  mono
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label">
        <Icon className="h-3.5 w-3" aria-hidden />
        {label}
      </span>
      <span className={`cln-detail__row-value${valueClass ? ` ${valueClass}` : ''}${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}
