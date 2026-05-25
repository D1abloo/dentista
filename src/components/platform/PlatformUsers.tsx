import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  KeyRound,
  LogOut,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import {
  DEFAULT_PERMISSIONS,
  getUsersKpis,
  type UserListRow,
  type UserPermissions
} from '@/lib/platform/usersDemo';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

type FilterChip =
  | 'all'
  | 'staff'
  | 'patients'
  | 'admin'
  | 'portal'
  | 'panel'
  | 'active'
  | 'pending'
  | 'disabled';
type SortMode = 'access' | 'name' | 'email' | 'role' | 'created';
type UserTypeOption = 'staff' | 'patient' | 'clinic_admin' | 'support';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const USER_TYPES: { id: UserTypeOption; label: string; hint: string }[] = [
  { id: 'staff', label: 'Personal de clínica', hint: 'Recepción, dentista u operaciones' },
  { id: 'patient', label: 'Paciente', hint: 'Portal del paciente' },
  { id: 'clinic_admin', label: 'Administrador de clínica', hint: 'Panel /admin completo' },
  { id: 'support', label: 'Soporte interno', hint: 'Acceso operativo limitado' }
];

const PERM_MODULES: { key: string; label: string; fields: { key: keyof UserPermissions[string]; label: string }[] }[] = [
  { key: 'agenda', label: 'Agenda', fields: [{ key: 'view', label: 'Ver' }, { key: 'edit', label: 'Editar' }] },
  { key: 'pacientes', label: 'Pacientes', fields: [{ key: 'view', label: 'Ver' }, { key: 'edit', label: 'Editar' }] },
  { key: 'documentos', label: 'Documentos', fields: [{ key: 'view', label: 'Ver' }, { key: 'upload', label: 'Subir' }, { key: 'delete', label: 'Eliminar' }] },
  { key: 'informes', label: 'Informes', fields: [{ key: 'view', label: 'Ver' }, { key: 'create', label: 'Crear' }, { key: 'publish', label: 'Publicar' }] },
  { key: 'facturacion', label: 'Facturación', fields: [{ key: 'view', label: 'Ver' }, { key: 'create', label: 'Crear' }, { key: 'collect', label: 'Cobrar' }] },
  { key: 'pagos', label: 'Pagos', fields: [{ key: 'view', label: 'Ver' }, { key: 'register', label: 'Registrar' }] },
  { key: 'reportes', label: 'Reportes', fields: [{ key: 'view', label: 'Ver' }] },
  { key: 'ajustes', label: 'Ajustes', fields: [{ key: 'view', label: 'Ver' }, { key: 'edit', label: 'Editar' }] }
];

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
  { label: 'Usuarios totales', key: 'total' as const, icon: Users, tone: 'blue', spark: [4, 5, 5, 6, 6, 6, 6] },
  { label: 'Staff clínica', key: 'staff' as const, icon: Shield, tone: 'purple', spark: [0, 1, 1, 1, 1, 1, 1] },
  { label: 'Pacientes', key: 'patients' as const, icon: UserPlus, tone: 'green', spark: [3, 4, 4, 5, 5, 5, 5] },
  { label: 'Invitaciones pendientes', key: 'pendingInvites' as const, icon: Download, tone: 'orange', spark: [0, 0, 0, 0, 0, 0, 0] },
  { label: 'Accesos activos', key: 'activeAccess' as const, icon: UserCheck, tone: 'teal', spark: [5, 6, 6, 6, 6, 6, 6] },
  { label: 'Usuarios sin verificar', key: 'unverified' as const, icon: UserX, tone: 'red', spark: [0, 0, 0, 0, 0, 0, 0] }
];

function roleBadgeClass(u: UserListRow) {
  if (u.role === 'clinic_admin') return 'usr-badge--role-admin';
  if (u.role === 'patient') return 'usr-badge--role-patient';
  return 'usr-badge--role-staff';
}

export function PlatformUsers() {
  const [users, setUsers] = useState<UserListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<FilterChip>('all');
  const [sort, setSort] = useState<SortMode>('access');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selected, setSelected] = useState<UserListRow | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'activity'>('details');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permOpen, setPermOpen] = useState<UserListRow | null>(null);
  const [permDraft, setPermDraft] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [didAutoSelect, setDidAutoSelect] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const [wizard, setWizard] = useState({
    userType: 'patient' as UserTypeOption,
    fullName: '',
    email: '',
    phone: '',
    clinicId: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
    accessType: 'patient_portal' as 'patient_portal' | 'clinic_panel',
    role: 'patient',
    permissionLevel: 'standard',
    sendEmail: true,
    forcePassword: true,
    inviteExpiry: '7',
    permissions: { ...DEFAULT_PERMISSIONS } as UserPermissions
  });

  const [invite, setInvite] = useState({ email: '', clinicId: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001' });

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await api<UserListRow[]>('/api/platform/users'));
    } catch {
      showToast('err', 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!didAutoSelect && users.length) {
      const maria = users.find((u) => u.email.includes('maria.gonzalez')) ?? users[0];
      setSelected(maria);
      setDidAutoSelect(true);
    }
  }, [users, didAutoSelect]);

  useEffect(() => {
    if (!selected) return;
    const fresh = users.find((u) => u.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [users, selected?.id]);

  useEffect(() => {
    setPage(1);
  }, [search, chip, sort]);

  const kpis = useMemo(() => getUsersKpis(users), [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...users];
    if (q) {
      rows = rows.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.clinic_name.toLowerCase().includes(q) ||
          u.role_label.toLowerCase().includes(q) ||
          u.access_label.toLowerCase().includes(q)
      );
    }
    if (chip === 'staff') rows = rows.filter((u) => u.user_type === 'staff' || u.role === 'dentist' || u.role === 'receptionist');
    if (chip === 'patients') rows = rows.filter((u) => u.user_type === 'patient' && u.role === 'patient');
    if (chip === 'admin') rows = rows.filter((u) => u.role === 'clinic_admin');
    if (chip === 'portal') rows = rows.filter((u) => u.access_type === 'patient_portal');
    if (chip === 'panel') rows = rows.filter((u) => u.access_type === 'clinic_panel');
    if (chip === 'active') rows = rows.filter((u) => u.status === 'active');
    if (chip === 'pending') rows = rows.filter((u) => u.status === 'pending');
    if (chip === 'disabled') rows = rows.filter((u) => u.status === 'disabled');
    rows.sort((a, b) => {
      if (sort === 'name') return a.full_name.localeCompare(b.full_name, 'es');
      if (sort === 'email') return a.email.localeCompare(b.email, 'es');
      if (sort === 'role') return a.role_label.localeCompare(b.role_label, 'es');
      if (sort === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.last_access.localeCompare(a.last_access, 'es');
    });
    return rows;
  }, [users, search, chip, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openWizard() {
    setWizardOpen(true);
    setWizardStep(0);
    setErrors({});
    setWizard({
      userType: 'patient',
      fullName: '',
      email: '',
      phone: '',
      clinicId: 'a0e9a6b1-4c2d-4a1f-9b3e-000000000001',
      accessType: 'patient_portal',
      role: 'patient',
      permissionLevel: 'standard',
      sendEmail: true,
      forcePassword: true,
      inviteExpiry: '7',
      permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)) as UserPermissions
    });
  }

  function pickUserType(t: UserTypeOption) {
    const accessType = t === 'patient' ? 'patient_portal' : 'clinic_panel';
    const role = t === 'patient' ? 'patient' : t === 'clinic_admin' ? 'clinic_admin' : t === 'support' ? 'admin' : 'receptionist';
    setWizard((w) => ({ ...w, userType: t, accessType, role }));
  }

  function validateWizardStep(step: number) {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (!wizard.fullName.trim()) next.fullName = 'Introduce el nombre completo.';
      if (!wizard.email.trim() || !EMAIL_RE.test(wizard.email)) next.email = 'Introduce un email válido.';
      if (!wizard.clinicId) next.clinicId = 'Selecciona una clínica.';
      if (!wizard.accessType) next.accessType = 'Selecciona un tipo de acceso.';
    }
    if (step === 2 && wizard.accessType === 'clinic_panel' && !wizard.role) {
      next.role = 'Selecciona un rol.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitWizard() {
    if (!validateWizardStep(1)) return;
    setSaving(true);
    try {
      const created = await api<UserListRow>('/api/platform/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: wizard.fullName.trim(),
          email: wizard.email.trim(),
          phone: wizard.phone,
          clinicId: wizard.clinicId,
          accessType: wizard.accessType,
          role: wizard.role,
          userType: wizard.userType,
          sendEmail: wizard.sendEmail,
          forcePasswordChange: wizard.forcePassword,
          permissions: wizard.accessType === 'clinic_panel' ? wizard.permissions : undefined
        })
      });
      setWizardOpen(false);
      showToast('ok', 'Usuario creado correctamente.');
      await load();
      setSelected(created);
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  }

  async function submitInvite() {
    if (!invite.email.trim() || !EMAIL_RE.test(invite.email)) {
      showToast('err', 'Introduce un email válido.');
      return;
    }
    setSaving(true);
    try {
      await api('/api/platform/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: invite.email.split('@')[0],
          email: invite.email.trim(),
          clinicId: invite.clinicId,
          accessType: 'patient_portal',
          role: 'patient',
          userType: 'patient',
          sendEmail: true
        })
      });
      setInviteOpen(false);
      showToast('ok', 'Invitación enviada por email.');
      await load();
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo enviar la invitación.');
    } finally {
      setSaving(false);
    }
  }

  async function userAction(action: 'deactivate' | 'revoke_sessions' | 'resend_credentials', u: UserListRow) {
    if (action === 'deactivate' && !window.confirm(`¿Desactivar a "${u.full_name}"?`)) return;
    if (action === 'revoke_sessions' && !window.confirm(`¿Revocar sesiones de "${u.full_name}"?`)) return;
    if (action === 'resend_credentials' && !window.confirm(`¿Reenviar credenciales a ${u.email}?`)) return;
    try {
      await api('/api/platform/users', { method: 'PATCH', body: JSON.stringify({ action, userId: u.id }) });
      await load();
      showToast('ok', action === 'resend_credentials' ? 'Credenciales reenviadas.' : 'Acción completada.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'La acción falló.');
    }
    setMenuId(null);
  }

  async function savePermissions() {
    if (!permOpen) return;
    setSaving(true);
    try {
      await api('/api/platform/users', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update_permissions', userId: permOpen.id, permissions: permDraft })
      });
      setPermOpen(null);
      await load();
      showToast('ok', 'Permisos actualizados.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudieron guardar los permisos.');
    } finally {
      setSaving(false);
    }
  }

  function openPerms(u: UserListRow) {
    setPermDraft(JSON.parse(JSON.stringify(Object.keys(u.permissions).length ? u.permissions : DEFAULT_PERMISSIONS)) as UserPermissions);
    setPermOpen(u);
    setMenuId(null);
  }

  function togglePerm(module: string, field: string, checked: boolean) {
    setPermDraft((p) => ({
      ...p,
      [module]: { ...p[module], [field]: checked }
    }));
  }

  async function exportCsv() {
    try {
      const res = await fetch('/api/platform/users-export', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'usuarios.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('ok', 'CSV exportado.');
    } catch {
      showToast('err', 'No se pudo exportar.');
    }
  }

  const chips: { id: FilterChip; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'staff', label: 'Staff' },
    { id: 'patients', label: 'Pacientes' },
    { id: 'admin', label: 'Admin clínica' },
    { id: 'portal', label: 'Portal paciente' },
    { id: 'panel', label: 'Panel clínica' },
    { id: 'active', label: 'Activos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'disabled', label: 'Desactivados' }
  ];

  const headerActions = (
    <div className="plt-head-actions">
      <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setInviteOpen(true)}>
        <Mail className="h-4 w-4" aria-hidden />
        Invitar por email
      </button>
      <button type="button" className="plt-btn plt-btn--secondary" onClick={() => void exportCsv()}>
        <Download className="h-4 w-4" aria-hidden />
        Exportar CSV
      </button>
      <button type="button" className="plt-btn plt-btn--primary" onClick={openWizard}>
        <Plus className="h-4 w-4" aria-hidden />
        + Crear usuario
      </button>
    </div>
  );

  function renderActions(u: UserListRow) {
    return (
      <div className="cln-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected(u)}>
          <Eye className="h-4 w-4" />
        </button>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Editar permisos" onClick={() => openPerms(u)}>
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Reenviar credenciales" onClick={() => void userAction('resend_credentials', u)}>
          <Mail className="h-4 w-4" />
        </button>
        <div className="cln-menu">
          <button type="button" className="cln-icon-btn" aria-label="Más" onClick={() => setMenuId(menuId === u.id ? null : u.id)}>
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuId === u.id ? (
            <div className="cln-menu__pop" role="menu">
              <button type="button" onClick={() => openPerms(u)}>Editar permisos</button>
              <button type="button" onClick={() => void userAction('resend_credentials', u)}>Reenviar credenciales</button>
              <button type="button" onClick={() => showToast('ok', 'Email de cambio de contraseña enviado.')}>Forzar cambio de contraseña</button>
              <button type="button" onClick={() => void userAction('revoke_sessions', u)}>Revocar sesiones</button>
              <button type="button" className="cln-menu__danger" onClick={() => void userAction('deactivate', u)}>Desactivar usuario</button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <PlatformShell
      title="Usuarios y accesos"
      subtitle="Gestiona cuentas, roles, permisos, accesos por clínica y credenciales de usuarios."
      headerActions={headerActions}
    >
      <div className={`usr-page cln-layout cln-page${selected ? ' usr-page--panel-open cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          {KPI_CONFIG.map((k, i) => (
            <UsrKpi key={k.label} label={k.label} value={kpis[k.key]} icon={k.icon} tone={k.tone} spark={k.spark} delay={i * 70} sub={k.key === 'pendingInvites' ? '0 sin enviar' : k.key === 'unverified' ? '0 por verificar' : k.key === 'activeAccess' ? '100% activos' : '+1 este mes'} />
          ))}
        </div>

        <div className="cln-toolbar">
          <label className="cln-search">
            <Search className="cln-search__icon h-4 w-4" aria-hidden />
            <input placeholder="Buscar por nombre, email, clínica, rol o acceso…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <div className="cln-toolbar__row">
            <div className="cln-chips" role="tablist">
              {chips.map((c) => (
                <button key={c.id} type="button" role="tab" className={`cln-chip${chip === c.id ? ' cln-chip--active' : ''}`} onClick={() => setChip(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="cln-toolbar__sort-wrap">
              <select className="cln-toolbar__sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="access">Ordenar por: último acceso</option>
                <option value="name">Ordenar por: nombre</option>
                <option value="email">Ordenar por: email</option>
                <option value="role">Ordenar por: rol</option>
                <option value="created">Ordenar por: fecha de alta</option>
              </select>
              <button type="button" className="cln-icon-btn" onClick={() => void load()}>
                <RefreshCw className={`h-4 w-4${loading ? ' animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <section className="cln-card">
          <h2 className="cln-card__title">
            Cuentas registradas
            <span className="usr-card-count">{filtered.length} usuarios</span>
          </h2>
          <div className="cln-table-wrap">
            <table className="cln-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                  <th>Clínica</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={selected?.id === u.id ? 'usr-table__row--active cln-table__row--active' : ''}
                    onClick={() => setSelected(u)}
                  >
                    <td>
                      <div className="usr-user-cell">
                        <span className="usr-avatar">{u.initials}</span>
                        <strong>{u.full_name}</strong>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">{u.email}</td>
                    <td>
                      <span className={`cln-badge ${roleBadgeClass(u)}`}>{u.role_label}</span>
                    </td>
                    <td className="text-xs font-semibold text-slate-700">{u.access_label}</td>
                    <td>
                      <span className="font-semibold text-slate-800">{u.clinic_name}</span>
                      <span className="usr-clinic-sub">{u.clinic_slug}</span>
                    </td>
                    <td>
                      <span className={`cln-badge cln-badge--status cln-badge--${u.status === 'active' ? 'active' : u.status}`}>
                        {u.status === 'active' ? <span className="cln-status-dot" /> : null}
                        {u.status === 'active' ? 'Activo' : u.status === 'pending' ? 'Pendiente' : 'Desactivado'}
                      </span>
                    </td>
                    <td>{u.last_access}</td>
                    <td>{renderActions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cln-table-foot">
            <span>
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, filtered.length)} de {filtered.length} usuarios
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="cln-icon-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ‹
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button type="button" className="cln-icon-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                ›
              </button>
              <span className="text-xs text-slate-500">10 por página</span>
            </div>
          </div>
          <div className="cln-mobile-list">
            {pageRows.map((u, i) => (
              <article key={u.id} className={`cln-mobile-card${selected?.id === u.id ? ' cln-mobile-card--active' : ''}`} style={{ animationDelay: `${i * 40}ms` }} onClick={() => setSelected(u)}>
                <div className="usr-user-cell">
                  <span className="usr-avatar">{u.initials}</span>
                  <div>
                    <strong>{u.full_name}</strong>
                    <p className="m-0 text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs">{u.role_label} · {u.access_label}</p>
                <div className="mt-2">{renderActions(u)}</div>
              </article>
            ))}
          </div>
        </section>

        {selected ? (
          <>
            <div className="cln-detail__backdrop" onClick={() => setSelected(null)} />
            <aside className="cln-detail" aria-label="Detalle de usuario">
              <div className="cln-detail__head">
                <div className="flex items-center gap-2">
                  <span className="usr-avatar usr-avatar--lg">{selected.initials}</span>
                  <div>
                    <h2 className="m-0 text-base font-extrabold">{selected.full_name}</h2>
                    <span className="cln-badge cln-badge--active">Activo</span>
                  </div>
                </div>
                <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="cln-detail__body">
                <div className="usr-detail__tabs">
                  <button type="button" className={`usr-detail__tab${detailTab === 'details' ? ' usr-detail__tab--active' : ''}`} onClick={() => setDetailTab('details')}>
                    Detalles
                  </button>
                  <button type="button" className={`usr-detail__tab${detailTab === 'activity' ? ' usr-detail__tab--active' : ''}`} onClick={() => setDetailTab('activity')}>
                    Actividad
                  </button>
                </div>
                {detailTab === 'details' ? (
                  <ul className="cln-detail__meta">
                    <DetailRow icon={CheckCircle2} label="Estado" value="Activo" valueClass="cln-val--active" />
                    <DetailRow icon={Shield} label="Rol" value={selected.role_label} />
                    <DetailRow icon={Building2} label="Acceso" value={selected.access_label} />
                    <DetailRow icon={Mail} label="Email" value={selected.email} />
                    <DetailRow icon={Building2} label="Clínica" value={`${selected.clinic_name} (${selected.clinic_slug})`} />
                    <DetailRow icon={Clock} label="Fecha de alta" value={new Date(selected.created_at).toLocaleDateString('es-ES')} />
                    <DetailRow icon={Clock} label="Último acceso" value={selected.last_access} />
                    <DetailRow icon={Mail} label="Credenciales enviadas" value={selected.credentials_sent ? 'Sí' : 'No'} valueClass={selected.credentials_sent ? 'cln-val--ok' : undefined} />
                    <DetailRow icon={KeyRound} label="Token portal" value={selected.portal_token_hint} mono />
                    <DetailRow icon={Users} label="Sesiones activas" value={`${selected.active_sessions} sesión${selected.active_sessions === 1 ? '' : 'es'}`} />
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Último acceso: {selected.last_access}. Los eventos detallados están en Auditoría de plataforma.</p>
                )}
                <p className="cln-detail__actions-title">Acciones rápidas</p>
                <div className="cln-detail__actions">
                  <button type="button" className="cln-qa-btn" onClick={() => openPerms(selected)}>
                    <Pencil className="h-4 w-4" />
                    Editar permisos
                  </button>
                  <button type="button" className="cln-qa-btn cln-qa-btn--primary" onClick={() => void userAction('resend_credentials', selected)}>
                    <Mail className="h-4 w-4" />
                    Reenviar credenciales
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => showToast('ok', 'Solicitud de cambio de contraseña enviada.')}>
                    <KeyRound className="h-4 w-4" />
                    Forzar cambio de contraseña
                  </button>
                  <button type="button" className="cln-qa-btn" onClick={() => void userAction('revoke_sessions', selected)}>
                    <LogOut className="h-4 w-4" />
                    Revocar sesiones
                  </button>
                  <button type="button" className="cln-qa-btn cln-qa-btn--danger cln-detail__danger" onClick={() => void userAction('deactivate', selected)}>
                    <UserX className="h-4 w-4" />
                    Desactivar usuario
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {wizardOpen ? (
          <div className="cln-modal-backdrop usr-wizard-backdrop--full" role="dialog" aria-modal="true">
            <div className="cln-modal usr-wizard" style={{ maxWidth: '40rem' }} onClick={(e) => e.stopPropagation()}>
              <div className="usr-wizard-steps">
                {['Tipo de usuario', 'Datos del usuario', 'Rol y permisos'].map((label, i) => (
                  <div key={label} className={`usr-wizard-step${wizardStep === i ? ' usr-wizard-step--active' : ''}${wizardStep > i ? ' usr-wizard-step--done' : ''}`}>
                    {i + 1}. {label}
                  </div>
                ))}
              </div>
              {wizardStep === 0 ? (
                <div className="usr-wizard-pane">
                  <h2 className="mt-0 text-base font-extrabold">Tipo de usuario</h2>
                  <div className="usr-wizard-types">
                    {USER_TYPES.map((t) => (
                      <button key={t.id} type="button" className={`usr-type-card${wizard.userType === t.id ? ' usr-type-card--active' : ''}`} onClick={() => pickUserType(t.id)}>
                        <strong>{t.label}</strong>
                        <span>{t.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {wizardStep === 1 ? (
                <div className="usr-wizard-pane">
                  <h2 className="mt-0 text-base font-extrabold">Datos del usuario</h2>
                  <Field label="Nombre completo" error={errors.fullName}>
                    <input value={wizard.fullName} onChange={(e) => setWizard({ ...wizard, fullName: e.target.value })} />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input type="email" value={wizard.email} onChange={(e) => setWizard({ ...wizard, email: e.target.value })} />
                  </Field>
                  <Field label="Teléfono">
                    <input value={wizard.phone} onChange={(e) => setWizard({ ...wizard, phone: e.target.value })} />
                  </Field>
                  <Field label="Clínica / sede" error={errors.clinicId}>
                    <select value={wizard.clinicId} onChange={(e) => setWizard({ ...wizard, clinicId: e.target.value })}>
                      <option value="a0e9a6b1-4c2d-4a1f-9b3e-000000000001">Clínica Dental Nova</option>
                    </select>
                  </Field>
                  <Field label="Destino del acceso" error={errors.accessType}>
                    <select value={wizard.accessType} onChange={(e) => setWizard({ ...wizard, accessType: e.target.value as typeof wizard.accessType })}>
                      <option value="clinic_panel">Panel clínica</option>
                      <option value="patient_portal">Portal paciente</option>
                    </select>
                  </Field>
                </div>
              ) : null}
              {wizardStep === 2 ? (
                <div className="usr-wizard-pane">
                  <h2 className="mt-0 text-base font-extrabold">Rol y permisos</h2>
                  <Field label="Rol" error={errors.role}>
                    <select value={wizard.role} onChange={(e) => setWizard({ ...wizard, role: e.target.value })}>
                      {wizard.accessType === 'patient_portal' ? <option value="patient">Paciente</option> : null}
                      <option value="clinic_admin">Administrador de clínica</option>
                      <option value="receptionist">Recepción</option>
                      <option value="dentist">Dentista</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </Field>
                  <Field label="Nivel de permisos">
                    <select value={wizard.permissionLevel} onChange={(e) => setWizard({ ...wizard, permissionLevel: e.target.value })}>
                      <option value="standard">Estándar</option>
                      <option value="elevated">Elevado</option>
                      <option value="readonly">Solo lectura</option>
                    </select>
                  </Field>
                  <label className="mb-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={wizard.sendEmail} onChange={(e) => setWizard({ ...wizard, sendEmail: e.target.checked })} />
                    Enviar credenciales por email
                  </label>
                  <label className="mb-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={wizard.forcePassword} onChange={(e) => setWizard({ ...wizard, forcePassword: e.target.checked })} />
                    Forzar cambio de contraseña
                  </label>
                  <Field label="Expiración de invitación">
                    <select value={wizard.inviteExpiry} onChange={(e) => setWizard({ ...wizard, inviteExpiry: e.target.value })}>
                      <option value="7">7 días</option>
                      <option value="14">14 días</option>
                      <option value="30">30 días</option>
                    </select>
                  </Field>
                  {wizard.accessType === 'clinic_panel' ? (
                    <div className="usr-perms mt-3">
                      {PERM_MODULES.map((m) => (
                        <div key={m.key} className="usr-perm-row">
                          <span className="usr-perm-row__label">{m.label}</span>
                          <div className="flex flex-wrap gap-2">
                            {m.fields.map((f) => (
                              <label key={f.key} className="usr-toggle">
                                <input
                                  type="checkbox"
                                  checked={Boolean(wizard.permissions[m.key]?.[f.key])}
                                  onChange={(e) =>
                                    setWizard({
                                      ...wizard,
                                      permissions: {
                                        ...wizard.permissions,
                                        [m.key]: { ...wizard.permissions[m.key], [f.key]: e.target.checked }
                                      }
                                    })
                                  }
                                />
                                {f.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="cln-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => (wizardStep === 0 ? setWizardOpen(false) : setWizardStep((s) => s - 1))}>
                  {wizardStep === 0 ? 'Cancelar' : 'Atrás'}
                </button>
                {wizardStep < 2 ? (
                  <button type="button" className="plt-btn plt-btn--primary" onClick={() => { if (wizardStep === 0 || validateWizardStep(1)) setWizardStep((s) => s + 1); }}>
                    Siguiente
                  </button>
                ) : (
                  <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void submitWizard()}>
                    {saving ? 'Creando…' : 'Crear usuario'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {inviteOpen ? (
          <div className="cln-modal-backdrop" onClick={() => setInviteOpen(false)}>
            <div className="cln-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="mt-0 font-extrabold">Invitar por email</h2>
              <Field label="Email">
                <input type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="usuario@ejemplo.com" />
              </Field>
              <div className="cln-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setInviteOpen(false)}>Cancelar</button>
                <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void submitInvite()}>Enviar invitación</button>
              </div>
            </div>
          </div>
        ) : null}

        {permOpen ? (
          <div className="cln-modal-backdrop" onClick={() => setPermOpen(null)}>
            <div className="cln-modal" style={{ maxWidth: '32rem' }} onClick={(e) => e.stopPropagation()}>
              <h2 className="mt-0 font-extrabold">Permisos — {permOpen.full_name}</h2>
              <div className="usr-perms">
                {PERM_MODULES.map((m) => (
                  <div key={m.key} className="usr-perm-row">
                    <span className="usr-perm-row__label">{m.label}</span>
                    <div className="flex flex-wrap gap-2">
                      {m.fields.map((f) => (
                        <label key={f.key} className="usr-toggle">
                          <input type="checkbox" checked={Boolean(permDraft[m.key]?.[f.key])} onChange={(e) => togglePerm(m.key, f.key, e.target.checked)} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="cln-modal__foot">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setPermOpen(null)}>Cancelar</button>
                <button type="button" className="plt-btn plt-btn--primary" disabled={saving} onClick={() => void savePermissions()}>Guardar permisos</button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`cln-toast cln-toast--${toast.type === 'ok' ? 'ok' : 'err'}`}>{toast.text}</div> : null}
        <footer className="cln-footer">
          <span>AgendaClinic Super Admin v2.0.0</span>
        </footer>
      </div>
    </PlatformShell>
  );
}

function DetailRow({ icon: Icon, label, value, valueClass, mono }: { icon: LucideIcon; label: string; value: string; valueClass?: string; mono?: boolean }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
      <span className={`cln-detail__row-value${valueClass ? ` ${valueClass}` : ''}${mono ? ' cln-detail__row-value--mono' : ''}`}>{value}</span>
    </li>
  );
}

function UsrKpi({ label, value, icon: Icon, tone, spark, delay, sub }: { label: string; value: number; icon: LucideIcon; tone: string; spark: number[]; delay: number; sub: string }) {
  const n = useCountUp(value, 750);
  return (
    <article className="plt-kpi usr-kpi" style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
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
