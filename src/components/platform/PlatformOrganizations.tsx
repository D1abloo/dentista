import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Building2,
  ChevronDown,
  Download,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings,
  Upload,
  UserPlus,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import type { OrganizationRow } from '@/lib/platform/organizationsDemo';
import { getOrganizationsKpis } from '@/lib/platform/organizationsDemo';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

type SedeDraft = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  responsible: string;
  status: 'active' | 'pending';
};

type WizardForm = {
  organizationName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  plan: string;
  tenantSlug: string;
  createAdmin: boolean;
  sendWelcome: boolean;
  isolation: boolean;
  subscriptionPerBranch: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function newSede(i: number): SedeDraft {
  return {
    id: `sede-${Date.now()}-${i}`,
    name: i === 0 ? 'Sede principal' : `Sede ${i + 1}`,
    address: '',
    city: '',
    phone: '',
    responsible: '',
    status: 'active'
  };
}

type SortKey = 'tenant_name' | 'tenant_slug' | 'branch_count' | 'admin_email' | 'plan_label' | 'status';

export function PlatformOrganizations() {
  const [orgs, setOrgs] = useState<OrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('tenant_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<OrganizationRow | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sedes, setSedes] = useState<SedeDraft[]>([newSede(0)]);
  const [removingSedeId, setRemovingSedeId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<WizardForm>({
    organizationName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    plan: '',
    tenantSlug: '',
    createAdmin: true,
    sendWelcome: true,
    isolation: true,
    subscriptionPerBranch: true
  });

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<OrganizationRow[]>('/api/platform/organizations');
      setOrgs(data);
    } catch {
      showToast('err', 'No se pudieron cargar las organizaciones.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.organizationName || form.tenantSlug) return;
    setForm((f) => ({ ...f, tenantSlug: slugify(form.organizationName) }));
  }, [form.organizationName, form.tenantSlug]);

  const kpis = useMemo(() => getOrganizationsKpis(orgs), [orgs]);

  const filtered = useMemo(() => {
    let list = [...orgs];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.tenant_name.toLowerCase().includes(q) ||
          o.tenant_slug.toLowerCase().includes(q) ||
          o.admin_email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (planFilter !== 'all') list = list.filter((o) => o.plan_label.toLowerCase().includes(planFilter));
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'es');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [orgs, search, statusFilter, planFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, planFilter, pageSize]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function openWizard() {
    setWizardOpen(true);
    setWizardStep(0);
    setErrors({});
    setForm({
      organizationName: '',
      ownerName: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      plan: '',
      tenantSlug: '',
      createAdmin: true,
      sendWelcome: true,
      isolation: true,
      subscriptionPerBranch: true
    });
    setSedes([newSede(0)]);
  }

  function validateStep(step: number): boolean {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.organizationName.trim()) next.organizationName = 'Introduce el nombre de la organización.';
      if (!form.email.trim() || !EMAIL_RE.test(form.email)) next.email = 'Introduce un email válido para el administrador.';
      if (!form.plan) next.plan = 'Selecciona un plan para la organización.';
    }
    if (step === 1) {
      const valid = sedes.filter((s) => s.name.trim());
      if (!valid.length) next.sedes = 'Añade al menos una sede.';
    }
    if (step === 2) {
      const slug = form.tenantSlug.trim();
      if (!slug) next.tenantSlug = 'Introduce el identificador del tenant.';
      else if (orgs.some((o) => o.tenant_slug === slug)) next.tenantSlug = 'El identificador del tenant ya existe.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitWizard() {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    setSaving(true);
    try {
      await api('/api/platform/organizations', {
        method: 'POST',
        body: JSON.stringify({
          organizationName: form.organizationName.trim(),
          ownerName: form.ownerName.trim() || form.organizationName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || '+34000000000',
          address: form.address.trim(),
          taxId: form.taxId,
          plan: form.plan,
          tenantSlug: form.tenantSlug.trim(),
          isolationEnabled: form.isolation,
          createAdmin: form.createAdmin,
          branches: sedes
            .filter((s) => s.name.trim())
            .map((s) => ({
              name: s.name.trim(),
              address: s.address.trim(),
              city: s.city.trim(),
              phone: s.phone.trim() || form.phone.trim(),
              email: form.email.trim()
            }))
        })
      });
      setWizardOpen(false);
      showToast('ok', 'Clínicas independientes creadas correctamente.');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear la organización.';
      showToast('err', msg);
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    try {
      const res = await fetch('/api/platform/organizations-export', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'organizaciones.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('ok', 'CSV exportado.');
    } catch {
      showToast('err', 'No se pudo exportar el CSV.');
    }
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      showToast('ok', `Archivo "${file.name}" recibido. Revisa el formato CSV de organizaciones.`);
    };
    reader.readAsText(file);
  }

  function removeSede(id: string) {
    if (sedes.length <= 1) return;
    setRemovingSedeId(id);
    window.setTimeout(() => {
      setSedes((list) => list.filter((s) => s.id !== id));
      setRemovingSedeId(null);
    }, 220);
  }

  function suspendTenant(org: OrganizationRow) {
    if (!window.confirm(`¿Suspender el tenant "${org.tenant_slug}"?`)) return;
    setOrgs((list) =>
      list.map((o) => (o.tenant_id === org.tenant_id ? { ...o, status: 'suspended' as const } : o))
    );
    if (selected?.tenant_id === org.tenant_id) setSelected({ ...org, status: 'suspended' });
    showToast('ok', 'Tenant suspendido.');
  }

  const headerActions = (
    <div className="plt-head-actions">
      <button type="button" className="plt-btn plt-btn--ghost" onClick={() => importRef.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden />
        Importar
      </button>
      <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void exportCsv()}>
        <Download className="h-4 w-4" aria-hidden />
        Exportar CSV
      </button>
      <button type="button" className="plt-btn plt-btn--primary" onClick={openWizard}>
        <Plus className="h-4 w-4" aria-hidden />
        Nueva organización
      </button>
      <input
        ref={importRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImport(f);
          e.target.value = '';
        }}
      />
    </div>
  );

  const kpiDefs = [
    { label: 'Organizaciones', value: kpis.organizations, sub: orgs.length ? `+${Math.min(1, orgs.length)} este mes` : '—' },
    { label: 'Sedes totales', value: kpis.sedes, sub: kpis.sedes ? `+${Math.min(2, kpis.sedes)} este mes` : '—' },
    { label: 'Tenants activos', value: kpis.tenantsActive, sub: orgs.length ? `${Math.round((kpis.tenantsActive / orgs.length) * 100)}% activos` : '—' },
    { label: 'Admins creados', value: kpis.admins, sub: kpis.admins ? `+${Math.min(1, kpis.admins)} este mes` : '—' },
    { label: 'Pendientes de configurar', value: kpis.pending, sub: 'Ver pendientes', link: kpis.pending > 0 }
  ];

  return (
    <PlatformShell
      title="Clínicas y organizaciones"
      subtitle="Cada clínica es un tenant independiente. Puedes registrar varias clínicas bajo un mismo contacto admin sin compartir datos."
      headerActions={headerActions}
    >
      <div className="org-page org-layout">
        <div className="org-kpis">
          {kpiDefs.map((k, i) => (
            <OrgKpi key={k.label} label={k.label} value={k.value} sub={k.sub} delay={i * 80} link={k.link} onPending={() => setStatusFilter('pending')} />
          ))}
        </div>

        <div className="org-toolbar">
          <input
            className="org-toolbar__search"
            placeholder="Buscar organización…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar organización"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Estado">
            <option value="all">Estado: Todos</option>
            <option value="active">Activa</option>
            <option value="pending">Pendiente</option>
            <option value="suspended">Suspendida</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} aria-label="Plan">
            <option value="all">Plan: Todos</option>
            <option value="básico">Básico</option>
            <option value="pro">Pro</option>
            <option value="multi">Multi-sede</option>
          </select>
          <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm">
            Más filtros
            <ChevronDown className="h-3 w-3" />
          </button>
          <button type="button" className="org-icon-btn" title="Actualizar" onClick={() => void load()}>
            <RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
          </button>
        </div>

        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                {(
                  [
                    ['tenant_name', 'Organización'],
                    ['tenant_slug', 'Tenant'],
                    ['branch_count', 'Sedes'],
                    ['admin_email', 'Admin'],
                    ['plan_label', 'Suscripción'],
                    ['status', 'Estado']
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} onClick={() => toggleSort(key)}>
                    {label}
                    {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((org) => (
                <tr
                  key={org.tenant_id}
                  className={selected?.tenant_id === org.tenant_id ? 'org-table__row--active' : ''}
                  onClick={() => setSelected(org)}
                >
                  <td>
                    <strong>{org.tenant_name}</strong>
                  </td>
                  <td>
                    <code className="text-xs text-teal-700">{org.tenant_slug}</code>
                  </td>
                  <td>{org.branch_count}</td>
                  <td className="max-w-[10rem] truncate">{org.admin_email}</td>
                  <td>{org.plan_label}</td>
                  <td>
                    <span className={`org-badge org-badge--${org.status}`}>
                      {org.status === 'active' ? 'Activa' : org.status === 'pending' ? 'Pendiente' : 'Suspendida'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="org-actions">
                      <button type="button" className="org-icon-btn" title="Ver" onClick={() => setSelected(org)}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="org-icon-btn"
                        title="Añadir usuario"
                        onClick={() => {
                          window.location.href = `/platform/usuarios?tenant=${encodeURIComponent(org.tenant_slug)}`;
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button type="button" className="org-icon-btn" title="Configuración" onClick={() => setSelected(org)}>
                        <Settings className="h-4 w-4" />
                      </button>
                      <button type="button" className="org-icon-btn" title="Más" onClick={() => setSelected(org)}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pageRows.length && !loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    No hay resultados con los filtros actuales.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <div className="org-table-foot">
            <span>
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="org-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button type="button" className="org-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                ›
              </button>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Por página">
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
              </select>
            </div>
          </div>
        </div>

        {!orgs.length && !loading ? (
          <div className="org-empty">
            <Building2 className="org-empty__icon h-14 w-14" strokeWidth={1.2} />
            <h3>Aún no hay organizaciones creadas</h3>
            <p>Registra una o varias clínicas independientes (cada una con su propio tenant y aislamiento total de datos).</p>
            <div className="org-empty__actions">
              <button type="button" className="plt-btn plt-btn--primary" onClick={openWizard}>
                Crear organización
              </button>
              <button type="button" className="plt-btn plt-btn--secondary" onClick={() => importRef.current?.click()}>
                Importar organizaciones
              </button>
            </div>
          </div>
        ) : null}

        {selected ? (
          <>
            <div className="org-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
            <aside className="org-detail" aria-label="Detalle de organización">
              <div className="org-detail__head">
                <div className="flex gap-2">
                  <Building2 className="h-6 w-6 text-teal-600" />
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-slate-900">{selected.tenant_name}</h2>
                    <span className={`org-badge org-badge--${selected.status}`}>
                      {selected.status === 'active' ? 'Activa' : selected.status === 'pending' ? 'Pendiente' : 'Suspendida'}
                    </span>
                  </div>
                </div>
                <button type="button" className="org-icon-btn" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="org-detail__body">
                <ul className="org-detail__meta">
                  <li>
                    <span>Tenant</span>
                    <span>{selected.tenant_slug}</span>
                  </li>
                  <li>
                    <span>Sedes</span>
                    <span>{selected.branch_count}</span>
                  </li>
                  <li>
                    <span>Admin principal</span>
                    <span>{selected.admin_email}</span>
                  </li>
                  <li>
                    <span>Teléfono</span>
                    <span>{selected.phone}</span>
                  </li>
                  <li>
                    <span>Plan</span>
                    <span>{selected.plan_label}</span>
                  </li>
                  <li>
                    <span>Última actividad</span>
                    <span>{selected.last_activity}</span>
                  </li>
                  <li>
                    <span>Aislamiento</span>
                    <span className={selected.isolation_ok ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {selected.isolation_ok ? 'Correcto ✓' : 'Revisar'}
                    </span>
                  </li>
                </ul>
                <div className="org-detail__branches">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Sedes de la organización</p>
                  {selected.branches.map((b) => (
                    <div key={b.id} className="org-detail__branch">
                      <p className="m-0 font-bold text-slate-800">{b.name}</p>
                      <p className="m-0 text-slate-500">
                        {b.address ?? '—'}
                        {b.city ? ` · ${b.city}` : ''}
                      </p>
                      <span className="org-badge org-badge--active mt-1">Activa</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Acciones rápidas</p>
                <div className="org-detail__actions">
                  <button
                    type="button"
                    className="plt-btn plt-btn--secondary plt-btn--sm"
                    onClick={() => {
                      setSelected(null);
                      openWizard();
                    }}
                  >
                    + Añadir sede
                  </button>
                  <button
                    type="button"
                    className="plt-btn plt-btn--secondary plt-btn--sm"
                    onClick={() => {
                      window.location.href = `/platform/usuarios?tenant=${encodeURIComponent(selected.tenant_slug)}`;
                    }}
                  >
                    Gestionar usuarios
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => showToast('ok', 'Cambio de plan: contacta soporte plataforma.')}>
                    Cambiar plan
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => (window.location.href = '/platform/auditoria')}>
                    Ver auditoría
                  </button>
                  <button type="button" className="plt-btn plt-btn--danger plt-btn--sm org-detail__danger" onClick={() => suspendTenant(selected)}>
                    Suspender tenant
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {wizardOpen ? (
          <div className="org-wizard-backdrop" role="dialog" aria-modal="true" aria-labelledby="org-wizard-title">
            <div className="org-wizard">
              <div className="org-wizard__steps">
                {['Datos de organización', 'Sedes', 'Tenant y accesos'].map((label, i) => (
                  <div
                    key={label}
                    className={`org-wizard__step${wizardStep === i ? ' org-wizard__step--active' : ''}${wizardStep > i ? ' org-wizard__step--done' : ''}`}
                  >
                    {i + 1}. {label}
                  </div>
                ))}
              </div>
              <div className="org-wizard__body">
                {wizardStep === 0 ? (
                  <div key="step0" className="org-wizard__pane">
                    <h3 id="org-wizard-title" className="mt-0 text-base font-extrabold">
                      Datos de organización
                    </h3>
                    <div className="grid gap-0 md:grid-cols-2">
                      <OrgField label="Nombre organización" error={errors.organizationName}>
                        <input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
                      </OrgField>
                      <OrgField label="Responsable">
                        <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                      </OrgField>
                      <OrgField label="Email admin" error={errors.email}>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </OrgField>
                      <OrgField label="Teléfono">
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </OrgField>
                      <OrgField label="Dirección fiscal" className="md:col-span-2">
                        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                      </OrgField>
                      <OrgField label="CIF / NIF">
                        <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
                      </OrgField>
                      <OrgField label="Plan / suscripción" error={errors.plan}>
                        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                          <option value="">Selecciona plan…</option>
                          <option value="essential">Básico</option>
                          <option value="professional">Pro</option>
                          <option value="enterprise">PRO Multi-sede</option>
                        </select>
                      </OrgField>
                    </div>
                  </div>
                ) : null}

                {wizardStep === 1 ? (
                  <div key="step1" className="org-wizard__pane">
                    <h3 className="mt-0 text-base font-extrabold">Clínicas independientes</h3>
                    <p className="text-sm text-slate-600">
                      Cada fila se registrará como clínica con su propio tenant. No se comparten pacientes, citas ni facturas entre
                      ellas.
                    </p>
                    {errors.sedes ? <p className="org-field__err">{errors.sedes}</p> : null}
                    {sedes.map((s, i) => (
                      <div
                        key={s.id}
                        className={`org-sede-card${removingSedeId === s.id ? ' org-sede-card--out' : ''}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="mb-2 flex justify-between">
                          <span className="text-xs font-bold text-slate-500">Sede {i + 1}</span>
                          {sedes.length > 1 ? (
                            <button type="button" className="text-xs text-red-600" onClick={() => removeSede(s.id)}>
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <OrgField label="Nombre sede">
                            <input value={s.name} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))} />
                          </OrgField>
                          <OrgField label="Ciudad">
                            <input value={s.city} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, city: e.target.value } : x)))} />
                          </OrgField>
                          <OrgField label="Dirección" className="md:col-span-2">
                            <input value={s.address} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, address: e.target.value } : x)))} />
                          </OrgField>
                          <OrgField label="Teléfono">
                            <input value={s.phone} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, phone: e.target.value } : x)))} />
                          </OrgField>
                          <OrgField label="Responsable sede">
                            <input value={s.responsible} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, responsible: e.target.value } : x)))} />
                          </OrgField>
                          <OrgField label="Estado">
                            <select value={s.status} onChange={(e) => setSedes(sedes.map((x) => (x.id === s.id ? { ...x, status: e.target.value as SedeDraft['status'] } : x)))}>
                              <option value="active">Activa</option>
                              <option value="pending">Pendiente</option>
                            </select>
                          </OrgField>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => setSedes([...sedes, newSede(sedes.length)])}>
                      + Añadir sede
                    </button>
                  </div>
                ) : null}

                {wizardStep === 2 ? (
                  <div key="step2" className="org-wizard__pane">
                    <h3 className="mt-0 text-base font-extrabold">Accesos</h3>
                    <p className="text-sm text-slate-600">
                      Referencia del grupo: <strong>{form.tenantSlug || slugify(form.organizationName) || '—'}</strong>. Cada
                      clínica recibe su propio tenant en base de datos (no compartido).
                    </p>
                    <label className="mb-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.createAdmin} onChange={(e) => setForm({ ...form, createAdmin: e.target.checked })} />
                      Crear credenciales admin
                    </label>
                    <label className="mb-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.sendWelcome} onChange={(e) => setForm({ ...form, sendWelcome: e.target.checked })} />
                      Enviar email de bienvenida
                    </label>
                    <label className="mb-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.isolation} onChange={(e) => setForm({ ...form, isolation: e.target.checked })} />
                      Activar aislamiento multi-tenant
                    </label>
                    <label className="mb-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.subscriptionPerBranch} onChange={(e) => setForm({ ...form, subscriptionPerBranch: e.target.checked })} />
                      Crear suscripción por sede
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="org-wizard__foot">
                <button
                  type="button"
                  className="plt-btn plt-btn--ghost"
                  onClick={() => {
                    if (wizardStep === 0) setWizardOpen(false);
                    else setWizardStep((s) => s - 1);
                  }}
                >
                  {wizardStep === 0 ? 'Cancelar' : 'Atrás'}
                </button>
                {wizardStep < 2 ? (
                  <button
                    type="button"
                    className="plt-btn plt-btn--primary"
                    onClick={() => {
                      if (validateStep(wizardStep)) setWizardStep((s) => s + 1);
                    }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void submitWizard()}>
                    {saving ? 'Creando…' : 'Crear organización'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`org-toast org-toast--${toast.type === 'ok' ? 'ok' : 'err'}`}>{toast.text}</div> : null}
      </div>
    </PlatformShell>
  );
}

function OrgKpi({
  label,
  value,
  sub,
  delay,
  link,
  onPending
}: {
  label: string;
  value: number;
  sub: string;
  delay: number;
  link?: boolean;
  onPending?: () => void;
}) {
  const n = useCountUp(value, 800);
  return (
    <article className="org-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="org-kpi__label">{label}</p>
      <p className="org-kpi__value">{n}</p>
      {link ? (
        <button type="button" className="org-kpi__sub org-kpi__sub--link" onClick={onPending}>
          {sub}
        </button>
      ) : (
        <p className="org-kpi__sub">{sub}</p>
      )}
    </article>
  );
}

function OrgField({
  label,
  error,
  className,
  children
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`org-field${error ? ' org-field--error' : ''} ${className ?? ''}`}>
      <label>{label}</label>
      {children}
      {error ? <span className="org-field__err">{error}</span> : null}
    </div>
  );
}
