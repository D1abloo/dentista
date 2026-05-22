import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Building2,
  Download,
  Eye,
  LogIn,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Upload,
  X
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import type { ClinicListRow } from '@/lib/platform/clinicsDemo';
import { getClinicsKpis, planLabel } from '@/lib/platform/clinicsDemo';
import type { ClinicStatus, SubscriptionPlan } from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

type FilterChip = 'all' | 'active' | 'pending' | 'suspended' | 'pro' | 'professional' | 'no-tenant';
type SortMode = 'created' | 'name' | 'activity' | 'status' | 'plan';

type ClinicForm = {
  name: string;
  email: string;
  slug: string;
  plan: SubscriptionPlan | '';
  city: string;
  phone: string;
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

function statusLabel(s: ClinicStatus) {
  if (s === 'active') return 'Activa';
  if (s === 'pending') return 'Pendiente';
  if (s === 'suspended') return 'Suspendida';
  return 'Rechazada';
}

function planBadgeClass(plan: SubscriptionPlan) {
  if (plan === 'professional' || plan === 'enterprise') return 'cln-badge--plan-pro';
  return 'cln-badge--plan-essential';
}

export function PlatformClinics() {
  const [list, setList] = useState<ClinicListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('created');
  const [selected, setSelected] = useState<ClinicListRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicForm>({ name: '', email: '', slug: '', plan: '', city: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [badgePulse, setBadgePulse] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await api<ClinicListRow[]>('/api/platform/clinics'));
    } catch {
      showToast('err', 'No se pudieron cargar las clínicas.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    const fresh = list.find((c) => c.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [list, selected?.id]);

  useEffect(() => {
    if (!form.name || form.slug) return;
    setForm((f) => ({ ...f, slug: slugify(form.name) }));
  }, [form.name, form.slug]);

  const kpis = useMemo(() => getClinicsKpis(list), [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...list];
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.tenant_id ?? '').toLowerCase().includes(q) ||
          (c.city ?? '').toLowerCase().includes(q) ||
          c.plan_label.toLowerCase().includes(q)
      );
    }
    if (chip === 'active') rows = rows.filter((c) => c.status === 'active');
    if (chip === 'pending') rows = rows.filter((c) => c.status === 'pending');
    if (chip === 'suspended') rows = rows.filter((c) => c.status === 'suspended');
    if (chip === 'pro') rows = rows.filter((c) => c.subscription_plan === 'enterprise');
    if (chip === 'professional') rows = rows.filter((c) => c.subscription_plan === 'professional');
    if (chip === 'no-tenant') rows = rows.filter((c) => !c.tenant_id);
    rows.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'es');
      if (sort === 'status') return a.status.localeCompare(b.status);
      if (sort === 'plan') return a.plan_label.localeCompare(b.plan_label, 'es');
      if (sort === 'activity') return b.activity_label.localeCompare(a.activity_label, 'es');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return rows;
  }, [list, search, chip, sort]);

  function openCreate() {
    setEditId(null);
    setForm({ name: '', email: '', slug: '', plan: '', city: 'Madrid', phone: '' });
    setErrors({});
    setModal('create');
  }

  function openEdit(c: ClinicListRow) {
    setEditId(c.id);
    setForm({
      name: c.name,
      email: c.email ?? '',
      slug: c.slug,
      plan: c.subscription_plan,
      city: c.city ?? '',
      phone: c.phone ?? ''
    });
    setErrors({});
    setModal('edit');
    setMenuId(null);
  }

  function validateForm(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Introduce el nombre de la clínica.';
    if (!form.email.trim() || !EMAIL_RE.test(form.email)) next.email = 'Introduce un email válido.';
    if (!form.slug.trim()) next.slug = 'El slug de la clínica es obligatorio.';
    if (!form.plan) next.plan = 'Selecciona un plan.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveClinic() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const data = await api<ClinicListRow>('/api/platform/clinics', {
        method: 'POST',
        body: JSON.stringify({
          id: editId ?? undefined,
          name: form.name.trim(),
          email: form.email.trim(),
          slug: form.slug.trim(),
          plan: form.plan,
          city: form.city.trim(),
          phone: form.phone.trim()
        })
      });
      setModal(null);
      showToast('ok', editId ? 'Clínica actualizada.' : 'Clínica creada correctamente.');
      await load();
      if (selected?.id === data.id) setSelected(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar la clínica.';
      showToast('err', msg);
      setErrors({ form: msg });
    } finally {
      setSaving(false);
    }
  }

  async function patchStatus(c: ClinicListRow, status: ClinicStatus, skipConfirm = false) {
    const label = statusLabel(status);
    if (!skipConfirm && !window.confirm(`¿Cambiar el estado de "${c.name}" a ${label}?`)) return;
    try {
      await api('/api/platform/clinics', {
        method: 'PATCH',
        body: JSON.stringify({ clinicId: c.id, status })
      });
      setBadgePulse(c.id);
      window.setTimeout(() => setBadgePulse(null), 500);
      await load();
      showToast('ok', `Estado actualizado a ${label}.`);
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo actualizar el estado.');
    }
    setMenuId(null);
  }

  async function patchPlan(c: ClinicListRow, plan: SubscriptionPlan, skipConfirm = false) {
    if (!skipConfirm && !window.confirm(`¿Cambiar el plan de "${c.name}" a ${planLabel(plan)}?`)) return;
    try {
      await api('/api/platform/clinics', {
        method: 'PATCH',
        body: JSON.stringify({ clinicId: c.id, plan })
      });
      setBadgePulse(c.id);
      window.setTimeout(() => setBadgePulse(null), 500);
      await load();
      showToast('ok', 'Plan actualizado.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo cambiar el plan.');
    }
    setMenuId(null);
  }

  async function suspendClinic(c: ClinicListRow) {
    if (!window.confirm(`¿Suspender la clínica "${c.name}"? Los usuarios no podrán operar hasta reactivarla.`)) return;
    await patchStatus(c, 'suspended', true);
  }

  async function enterAsAdmin(c: ClinicListRow) {
    try {
      const res = await fetch('/api/platform/inspect', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'clinic', clinicId: c.id })
      });
      const json = (await res.json()) as { data?: { redirect?: string }; error?: { message?: string } };
      if (!res.ok) {
        window.location.href = '/admin';
        showToast('ok', 'Abriendo panel admin (modo demo).');
        return;
      }
      window.location.href = json.data?.redirect ?? '/admin';
    } catch {
      window.location.href = '/admin';
      showToast('ok', 'Abriendo panel admin.');
    }
    setMenuId(null);
  }

  async function exportCsv() {
    try {
      const res = await fetch('/api/platform/clinics-export', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clinicas.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('ok', 'CSV exportado.');
    } catch {
      showToast('err', 'No se pudo exportar el CSV.');
    }
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'active', label: 'Activas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'suspended', label: 'Suspendidas' },
    { id: 'pro', label: 'PRO' },
    { id: 'professional', label: 'Profesional' },
    { id: 'no-tenant', label: 'Sin tenant' }
  ];

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
      <button type="button" className="plt-btn plt-btn--primary" onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden />
        Nueva clínica
      </button>
      <input
        ref={importRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) showToast('ok', `Archivo "${f.name}" recibido.`);
          e.target.value = '';
        }}
      />
    </div>
  );

  function renderRowActions(c: ClinicListRow, compact?: boolean) {
    return (
      <div className="cln-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cln-btn-text" onClick={() => setSelected(c)}>
          {compact ? <Eye className="h-4 w-4" /> : 'Ver detalle'}
        </button>
        <button type="button" className="cln-btn-text" onClick={() => void enterAsAdmin(c)}>
          {compact ? <LogIn className="h-4 w-4" /> : 'Entrar como admin'}
        </button>
        <button type="button" className="cln-icon-btn" title="Editar" onClick={() => openEdit(c)}>
          <Pencil className="h-4 w-4" />
        </button>
        <div className="cln-menu">
          <button type="button" className="cln-icon-btn" aria-label="Más acciones" onClick={() => setMenuId(menuId === c.id ? null : c.id)}>
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuId === c.id ? (
            <div className="cln-menu__pop" role="menu">
              <button type="button" onClick={() => void patchStatus(c, c.status === 'active' ? 'pending' : 'active')}>
                Cambiar estado
              </button>
              <button type="button" onClick={() => void patchPlan(c, 'professional')}>
                Cambiar plan
              </button>
              <button type="button" onClick={() => showToast('ok', `Tenant: ${c.tenant_id ?? 'sin vincular'}`)}>
                Ver tenant
              </button>
              <button type="button" onClick={() => (window.location.href = `/platform/suscripciones?clinic=${c.id}`)}>
                Ver facturación
              </button>
              <button type="button" onClick={() => (window.location.href = `/platform/soporte?clinic=${c.id}`)}>
                Ver soporte
              </button>
              <button type="button" className="cln-menu__danger" onClick={() => void suspendClinic(c)}>
                Suspender clínica
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <PlatformShell
      title="Clínicas registradas"
      subtitle="Gestiona sedes, estados, planes, tenants y accesos de cada clínica."
      headerActions={headerActions}
    >
      <div className="cln-page cln-layout">
        <div className="cln-kpis">
          <ClnKpi label="Clínicas totales" value={kpis.total} delay={0} />
          <ClnKpi label="Activas" value={kpis.active} delay={60} />
          <ClnKpi label="Pendientes" value={kpis.pending} delay={120} />
          <ClnKpi label="Suspendidas" value={kpis.suspended} delay={180} />
          <ClnKpi label="Plan PRO" value={kpis.planPro} delay={240} />
          <ClnKpi label="Tenants vinculados" value={kpis.tenantsLinked} delay={300} />
        </div>

        <div className="cln-toolbar">
          <input
            className="cln-toolbar__search"
            placeholder="Buscar por clínica, email, tenant, ciudad o plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar clínicas"
          />
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
          <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Ordenar">
            <option value="created">Ordenar por: fecha de alta</option>
            <option value="name">Ordenar por: nombre</option>
            <option value="activity">Ordenar por: actividad</option>
            <option value="status">Ordenar por: estado</option>
            <option value="plan">Ordenar por: plan</option>
          </select>
          <button type="button" className="cln-icon-btn" title="Actualizar" onClick={() => void load()}>
            <RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
          </button>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">Listado de clínicas</h2>
          <div className="cln-table-wrap">
            <table className="cln-table">
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th>Tenant</th>
                  <th>Organización</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Actividad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ animationDelay: `${i * 45}ms` }}
                    className={selected?.id === c.id ? 'cln-table__row--active' : ''}
                    onClick={() => setSelected(c)}
                  >
                    <td className="cln-clinic-cell">
                      <strong>{c.name}</strong>
                      <span>{c.email ?? '—'}</span>
                      <span>{c.slug}</span>
                    </td>
                    <td>
                      <code className="text-xs text-teal-800">{c.tenant_display}</code>
                    </td>
                    <td>{c.organization_label}</td>
                    <td>
                      <span className={`cln-badge ${planBadgeClass(c.subscription_plan)}${badgePulse === c.id ? ' cln-badge--pulse' : ''}`}>
                        {c.plan_label}
                      </span>
                    </td>
                    <td>
                      <span className={`cln-badge cln-badge--${c.status}${badgePulse === c.id ? ' cln-badge--pulse' : ''}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td>{c.activity_label}</td>
                    <td>{renderRowActions(c)}</td>
                  </tr>
                ))}
                {!filtered.length && !loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                      No hay clínicas con los filtros actuales.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="cln-mobile-list">
            {filtered.map((c, i) => (
              <article
                key={c.id}
                className={`cln-mobile-card${selected?.id === c.id ? ' cln-mobile-card--active' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => setSelected(c)}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <strong>{c.name}</strong>
                    <p className="m-0 text-xs text-slate-500">{c.email}</p>
                  </div>
                  <span className={`cln-badge cln-badge--${c.status}`}>{statusLabel(c.status)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {c.plan_label} · {c.tenant_display} · {c.activity_label}
                </p>
                <div className="mt-2">{renderRowActions(c, true)}</div>
              </article>
            ))}
          </div>
        </section>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
            <aside className="cln-detail" aria-label="Detalle de clínica">
              <div className="cln-detail__head">
                <div className="flex gap-2">
                  <Building2 className="h-6 w-6 text-teal-600" />
                  <div>
                    <h2 className="m-0 text-base font-extrabold">{selected.name}</h2>
                    <span className={`cln-badge cln-badge--${selected.status}`}>{statusLabel(selected.status)}</span>
                  </div>
                </div>
                <button type="button" className="cln-icon-btn" aria-label="Cerrar" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="cln-detail__body">
                <ul className="cln-detail__meta">
                  <li>
                    <span>Estado</span>
                    <span>{statusLabel(selected.status)}</span>
                  </li>
                  <li>
                    <span>Plan</span>
                    <span>{selected.plan_label}</span>
                  </li>
                  <li>
                    <span>Email</span>
                    <span>{selected.email ?? '—'}</span>
                  </li>
                  <li>
                    <span>Slug</span>
                    <span>{selected.slug}</span>
                  </li>
                  <li>
                    <span>Tenant ID</span>
                    <span>{selected.tenant_id ?? '—'}</span>
                  </li>
                  <li>
                    <span>Organización</span>
                    <span>{selected.organization_label}</span>
                  </li>
                  <li>
                    <span>Fecha de alta</span>
                    <span>{new Date(selected.created_at).toLocaleDateString('es-ES')}</span>
                  </li>
                  <li>
                    <span>Última actividad</span>
                    <span>{selected.activity_label}</span>
                  </li>
                  <li>
                    <span>Usuarios staff</span>
                    <span>{selected.staff_count}</span>
                  </li>
                  <li>
                    <span>Pacientes</span>
                    <span>{selected.patients_count}</span>
                  </li>
                  <li>
                    <span>Citas del mes</span>
                    <span>{selected.appointments_month}</span>
                  </li>
                  <li>
                    <span>Facturas pendientes</span>
                    <span>{selected.pending_invoices}</span>
                  </li>
                  <li>
                    <span>Aislamiento</span>
                    <span className={selected.isolation_ok ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>
                      {selected.isolation_ok ? 'Correcto' : 'Revisar'}
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-500">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="plt-btn plt-btn--primary plt-btn--sm" onClick={() => void enterAsAdmin(selected)}>
                    Entrar al panel
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => openEdit(selected)}>
                    Editar clínica
                  </button>
                  <button
                    type="button"
                    className="plt-btn plt-btn--secondary plt-btn--sm"
                    onClick={() => (window.location.href = `/platform/usuarios?clinicId=${selected.id}`)}
                  >
                    Gestionar usuarios
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => void patchPlan(selected, 'enterprise')}>
                    Cambiar plan
                  </button>
                  <button type="button" className="plt-btn plt-btn--secondary plt-btn--sm" onClick={() => (window.location.href = '/platform/seguridad')}>
                    Ver auditoría
                  </button>
                  <button type="button" className="plt-btn plt-btn--danger plt-btn--sm cln-detail__danger" onClick={() => void suspendClinic(selected)}>
                    Suspender clínica
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {modal ? (
          <div className="cln-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
            <div className="cln-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{modal === 'create' ? 'Nueva clínica' : 'Editar clínica'}</h2>
              {errors.form ? <p className="cln-field__err">{errors.form}</p> : null}
              <ClnField label="Nombre de la clínica" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </ClnField>
              <ClnField label="Email" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </ClnField>
              <ClnField label="Slug" error={errors.slug}>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </ClnField>
              <ClnField label="Plan" error={errors.plan}>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as SubscriptionPlan })}>
                  <option value="">Selecciona…</option>
                  <option value="essential">Básico</option>
                  <option value="professional">Profesional</option>
                  <option value="enterprise">PRO Multi-sede</option>
                </select>
              </ClnField>
              <ClnField label="Ciudad">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </ClnField>
              <ClnField label="Teléfono">
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </ClnField>
              <div className="cln-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void saveClinic()}>
                  {saving ? 'Guardando…' : modal === 'create' ? 'Crear clínica' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`cln-toast cln-toast--${toast.type === 'ok' ? 'ok' : 'err'}`}>{toast.text}</div> : null}
      </div>
    </PlatformShell>
  );
}

function ClnKpi({ label, value, delay }: { label: string; value: number; delay: number }) {
  const n = useCountUp(value, 750);
  return (
    <article className="cln-kpi" style={{ animationDelay: `${delay}ms` }}>
      <p className="cln-kpi__label">{label}</p>
      <p className="cln-kpi__value">{n}</p>
    </article>
  );
}

function ClnField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className={`cln-field${error ? ' cln-field--error' : ''}`}>
      <label>{label}</label>
      {children}
      {error ? <span className="cln-field__err">{error}</span> : null}
    </div>
  );
}
