import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, Download, Eye, Lock, MoreVertical,
  Settings, Shield, ShieldCheck, UserX, Users, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import {
  type SecurityAlert,
  type SecurityDetail,
  type SecurityPayload,
  type SecurityPolicy,
  type SecurityRole
} from '@/lib/platform/securityDemo';
import { PlatformShell } from './PlatformShell';

async function apiGet<T>(): Promise<T> {
  const res = await fetch('/api/platform/security', { credentials: 'include' });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/security', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo ejecutar la revisión.');
  return { data: json.data as T, message: json.meta?.message };
}

type Modal = 'policies' | 'permissions' | null;

function Sparkline({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points, 1);
  const coords = points.map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 100},${100 - (p / max) * 100}`).join(' ');
  return (
    <svg className={`plt-spark plt-spark--${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline className="plt-spark__line" points={coords} />
    </svg>
  );
}

function SecKpi({ label, value, icon: Icon, tone, spark, delay, numeric, className }: {
  label: string; value: string | number; icon: LucideIcon; tone: string; spark: number[]; delay: number; numeric?: boolean; className?: string;
}) {
  const n = numeric && typeof value === 'number' ? useCountUp(value, 750) : value;
  return (
    <article className={`plt-kpi cln-kpi sec-kpi${className ? ` ${className}` : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <span className={`plt-kpi__icon plt-kpi__icon--${tone}`}><Icon className="h-4 w-4" aria-hidden /></span>
      <div className="plt-kpi__body"><p className="plt-kpi__label">{label}</p><p className="plt-kpi__value">{n}</p></div>
      <Sparkline points={spark} tone={tone} />
    </article>
  );
}

function riskLabel(r: string) {
  if (r === 'high') return 'Alto';
  if (r === 'medium') return 'Medio';
  return 'Bajo';
}

export function PlatformSecurity() {
  const [data, setData] = useState<SecurityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [selected, setSelected] = useState<SecurityDetail | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [permRole, setPermRole] = useState<SecurityRole | null>(null);
  const [policyForm, setPolicyForm] = useState<SecurityPayload['policy_settings'] | null>(null);
  const [didAutoSelect, setDidAutoSelect] = useState(false);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await apiGet<SecurityPayload>()); }
    catch { showToast('err', 'No se pudieron cargar los datos de seguridad.'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (data && !didAutoSelect && data.policies[0]) {
      setSelected({ kind: 'policy', item: data.policies[0] });
      setDidAutoSelect(true);
    }
  }, [data, didAutoSelect]);

  async function post(body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    try {
      const { data: next, message } = await apiPost<SecurityPayload>(body);
      setData(next);
      if (selected?.kind === 'session') {
        const s = next.sessions.find((x) => x.id === selected.item.id);
        if (!s) setSelected({ kind: 'policy', item: next.policies[0] });
        else setSelected({ kind: 'session', item: s });
      }
      showToast('ok', message ?? okMsg ?? 'Operación completada.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo ejecutar la revisión.');
    } finally { setBusy(false); }
  }

  async function runReview() {
    await post({ action: 'run_review' }, 'Revisión de seguridad completada.');
  }

  function revokeSession(id: string) {
    if (!window.confirm('¿Revocar esta sesión? El usuario deberá volver a iniciar sesión.')) return;
    void post({ action: 'revoke_session', sessionId: id }, 'Sesión revocada.');
  }

  function policyAction(policy: SecurityPolicy, actionId: string) {
    if (actionId === 'test') { void post({ action: 'run_policy_test', policyId: policy.id }); return; }
    if (actionId === 'rules') { window.location.href = '/platform/aislamiento'; return; }
    if (actionId === 'roles') { const r = data?.roles[0]; if (r) setSelected({ kind: 'role', item: r }); return; }
    if (actionId === 'sessions') { setPolicyForm(data?.policy_settings ?? null); setModal('policies'); return; }
    if (actionId === 'restrictions' || actionId === 'audit_search') { window.location.href = '/platform/incidencias'; return; }
    if (actionId === 'flow') { window.location.href = '/platform/registros'; return; }
    if (actionId === 'config_reg') { window.location.href = '/platform/configuracion'; return; }
    setSelected({ kind: 'policy', item: policy });
  }

  function openAlert(a: SecurityAlert) {
    window.location.href = `/platform/incidencias?filter=${a.filter}`;
  }

  async function savePolicies() {
    if (!policyForm) return;
    if (!window.confirm('Confirma esta acción de seguridad: actualizar políticas globales.')) return;
    await post({ action: 'update_policies', policies: policyForm }, 'Políticas guardadas.');
    setModal(null);
  }

  const detailMeta = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === 'policy') {
      return { tipo: 'Política', estado: selected.item.status_label, alcance: selected.item.title, revision: data?.kpis.last_review ?? '—', riesgo: 'Bajo', audit: '/platform/aislamiento' };
    }
    if (selected.kind === 'role') {
      return { tipo: 'Rol', estado: selected.item.status_label, alcance: selected.item.scope, revision: data?.kpis.last_review ?? '—', riesgo: riskLabel(selected.item.risk), audit: '/platform/incidencias' };
    }
    return { tipo: 'Sesión', estado: 'Activa', alcance: selected.item.tenant_masked, revision: selected.item.last_activity, riesgo: 'Bajo', audit: '/platform/incidencias' };
  }, [selected, data]);

  if (!data) {
    return (
      <PlatformShell title="Seguridad y acceso" subtitle="Cargando…">
        <p className="text-sm text-[var(--muted)]">{loading ? 'Cargando seguridad…' : 'Sin datos.'}</p>
      </PlatformShell>
    );
  }

  const k = data.kpis;

  return (
    <PlatformShell
      title="Seguridad y acceso"
      subtitle="Gestiona autenticación, roles, sesiones, permisos y controles que protegen el aislamiento entre clínicas."
      headerActions={<>
        <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void runReview()}>
          <Shield className="h-4 w-4" aria-hidden />Ejecutar revisión de seguridad
        </button>
        <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { window.location.href = '/api/platform/security-export'; showToast('ok', 'Informe descargado.'); }}>
          <Download className="h-4 w-4" aria-hidden />Exportar informe
        </button>
        <button type="button" className="plt-btn plt-btn--secondary" onClick={() => { setPolicyForm({ ...data.policy_settings }); setModal('policies'); }}>
          <Settings className="h-4 w-4" aria-hidden />Configurar políticas
        </button>
        <a href="/platform/incidencias" className="plt-btn plt-btn--ghost no-underline"><Eye className="h-4 w-4" aria-hidden />Ver auditoría</a>
      </>}
    >
      <div className={`sec-page cln-layout${selected ? ' cln-page--panel-open' : ''}`}>
        <div className="cln-kpis plt-kpis">
          <SecKpi label="Estado general" value={k.overall_status} icon={ShieldCheck} tone="teal" spark={[1,1,1,1,1,1,1]} delay={0} className="sec-kpi__status" />
          <SecKpi label="Sesiones activas" value={k.active_sessions} icon={Users} tone="blue" spark={[0,1,1,1,1,1,1]} delay={70} numeric />
          <SecKpi label="Roles configurados" value={k.roles_configured} icon={Lock} tone="purple" spark={[4,4,4,4,4,4,4]} delay={140} numeric />
          <SecKpi label="Intentos fallidos" value={k.failed_attempts} icon={AlertTriangle} tone="orange" spark={[0,0,0,0,0,0,0]} delay={210} numeric />
          <SecKpi label="Alertas críticas" value={k.critical_alerts} icon={AlertTriangle} tone="red" spark={[0,0,0,0,0,0,0]} delay={280} numeric />
          <SecKpi label="Última revisión" value={k.last_review} icon={Clock} tone="green" spark={[1,1,1,1,1,1,1]} delay={350} />
        </div>

        <div className="sec-policies">
          {data.policies.map((p, i) => (
            <article key={p.id} className="sec-policy" style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => setSelected({ kind: 'policy', item: p })}>
              <div className="sec-policy__head">
                <h3 className="sec-policy__title">{p.title}</h3>
                <span className="cln-badge sec-badge--active">{p.status_label}</span>
              </div>
              <p className="sec-policy__desc">{p.description}</p>
              <div className="sec-policy__actions" onClick={(e) => e.stopPropagation()}>
                {p.actions.map((a) => (
                  <button key={a.id} type="button" onClick={() => policyAction(p, a.id)}>{a.label}</button>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="sec-grid-2">
          <section className="cln-card">
            <h2 className="cln-card__title">Roles y permisos</h2>
            <div className="cln-table-wrap">
              <table className="cln-table sec-table">
                <thead><tr><th>Rol</th><th>Acceso</th><th>Alcance</th><th>Sesiones</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{data.roles.map((r, i) => (
                  <tr key={r.id} className={selected?.kind === 'role' && selected.item.id === r.id ? 'cln-table__row--active' : ''}
                    style={{ animationDelay: `${i * 40}ms` }} onClick={() => setSelected({ kind: 'role', item: r })}>
                    <td><strong>{r.role}</strong></td><td><code className="text-xs">{r.access}</code></td><td className="text-xs">{r.scope}</td><td>{r.sessions}</td>
                    <td><span className="cln-badge sec-badge--active">{r.status_label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="cln-actions">
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Ver detalle" onClick={() => setSelected({ kind: 'role', item: r })}><Eye className="h-3.5 w-3.5" /></button>
                        <button type="button" className="cln-icon-btn cln-icon-btn--tip" data-tip="Editar permisos" onClick={() => { setPermRole(r); setModal('permissions'); }}><Settings className="h-3.5 w-3.5" /></button>
                        <div className="cln-menu">
                          <button type="button" className="cln-icon-btn" onClick={() => setMenuId(menuId === r.id ? null : r.id)}><MoreVertical className="h-3.5 w-3.5" /></button>
                          {menuId === r.id ? <div className="cln-menu__pop">
                            <button type="button" onClick={() => { window.location.href = '/platform/usuarios'; setMenuId(null); }}>Ver usuarios</button>
                            <button type="button" onClick={() => { window.location.href = '/platform/incidencias'; setMenuId(null); }}>Ver auditoría</button>
                          </div> : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="cln-card">
            <h2 className="cln-card__title">Sesiones activas</h2>
            {data.sessions.length === 0 ? <p className="text-sm text-[var(--muted)] p-4">No hay sesiones activas.</p> : (
              <div className="cln-table-wrap">
                <table className="cln-table sec-table">
                  <thead><tr><th>Usuario</th><th>Rol</th><th>Ruta</th><th>Tenant</th><th>IP</th><th>Dispositivo</th><th>Última actividad</th><th>Acciones</th></tr></thead>
                  <tbody>{data.sessions.map((s, i) => (
                    <tr key={s.id} className={selected?.kind === 'session' && selected.item.id === s.id ? 'cln-table__row--active' : ''}
                      style={{ animationDelay: `${i * 40}ms` }} onClick={() => setSelected({ kind: 'session', item: s })}>
                      <td>{s.user}</td><td>{s.role}</td><td><code className="text-xs">{s.route}</code></td><td className="font-mono text-xs">{s.tenant_masked}</td>
                      <td>{s.ip}</td><td className="text-xs">{s.device}</td><td>{s.last_activity}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm text-red-600" onClick={() => revokeSession(s.id)}>
                          <UserX className="h-3.5 w-3.5" />Revocar sesión
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="sec-grid-2">
          <section className="cln-card">
            <h2 className="cln-card__title">Alertas de seguridad</h2>
            {data.alerts.map((a) => (
              <div key={a.id} className="sec-alert-row">
                <span>{a.label} — <strong>{a.count}</strong></span>
                <span className={`cln-badge sec-severity sec-severity--${a.severity}`}>{a.severity_label}</span>
                <button type="button" onClick={() => openAlert(a)}>Ver ›</button>
              </div>
            ))}
          </section>
          <section className="cln-card">
            <h2 className="cln-card__title">Informe de aislamiento</h2>
            <div className="sec-isolation-rows">
              <div><span>Última verificación</span><strong>{data.isolation.last_check}</strong></div>
              <div><span>Resultado</span><strong>{data.isolation.result}</strong></div>
              <div><span>Reglas RLS revisadas</span><strong>{data.isolation.rls_rules}</strong></div>
              <div><span>Incidencias encontradas</span><strong>{data.isolation.incidents}</strong></div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href="/platform/aislamiento" className="plt-btn plt-btn--secondary plt-btn--sm">Ver informe de aislamiento</a>
              <button type="button" className="plt-btn plt-btn--ghost plt-btn--sm" onClick={() => { window.location.href = '/api/platform/security-export?format=csv'; }}>Exportar informe</button>
            </div>
          </section>
        </div>

        {selected && detailMeta ? (<>
          <div className="cln-detail__backdrop" role="presentation" onClick={() => setSelected(null)} />
          <aside className="cln-detail">
            <div className="cln-detail__head">
              <h2 className="cln-detail__title">Detalle de seguridad</h2>
              <button type="button" className="cln-icon-btn" onClick={() => setSelected(null)} aria-label="Cerrar"><X className="h-4 w-4" /></button>
            </div>
            <div className="cln-detail__body">
              <ul className="cln-detail__meta">
                <DetailRow label="Tipo" value={detailMeta.tipo} icon={Shield} />
                <DetailRow label="Estado" value={detailMeta.estado} icon={CheckCircle2} />
                <DetailRow label="Alcance" value={detailMeta.alcance} icon={Lock} />
                <DetailRow label="Última revisión" value={detailMeta.revision} icon={Clock} />
                <DetailRow label="Riesgo" value={detailMeta.riesgo} icon={AlertTriangle} />
                <DetailRow label="Auditoría vinculada" value={<a href={detailMeta.audit} className="text-teal-700 font-bold">Ver registro</a>} icon={Eye} />
              </ul>
              <p className="cln-detail__actions-title">Acciones disponibles</p>
              <div className="sop-qa-grid">
                {selected.kind === 'policy' ? (
                  <button type="button" className="cln-qa-btn" onClick={() => void post({ action: 'run_policy_test', policyId: selected.item.id })}>Ejecutar test</button>
                ) : null}
                <button type="button" className="cln-qa-btn" onClick={() => { setPolicyForm({ ...data.policy_settings }); setModal('policies'); }}>Editar política</button>
                <a href="/platform/incidencias" className="cln-qa-btn no-underline">Ver auditoría</a>
                {selected.kind === 'session' ? (
                  <button type="button" className="cln-qa-btn cln-detail__danger" onClick={() => revokeSession(selected.item.id)}>Revocar acceso</button>
                ) : null}
                <button type="button" className="cln-qa-btn" onClick={() => { window.location.href = '/api/platform/security-export'; }}>Exportar registro</button>
              </div>
            </div>
          </aside>
        </>) : null}

        {modal === 'policies' && policyForm ? (
          <div className="sec-modal-backdrop" role="dialog" aria-modal="true"><div className="sec-modal">
            <h3 className="sec-modal__title">Configurar políticas</h3>
            <label className="sec-toggle"><input type="checkbox" checked={policyForm.require2fa} onChange={(e) => setPolicyForm({ ...policyForm, require2fa: e.target.checked })} />Requerir 2FA para Super Admin</label>
            <label className="sec-toggle"><input type="checkbox" checked={policyForm.strongPassword} onChange={(e) => setPolicyForm({ ...policyForm, strongPassword: e.target.checked })} />Forzar contraseña segura</label>
            <label className="sec-toggle"><input type="checkbox" checked={policyForm.blockFailedAttempts} onChange={(e) => setPolicyForm({ ...policyForm, blockFailedAttempts: e.target.checked })} />Bloquear intentos fallidos</label>
            <label className="sec-toggle"><input type="checkbox" checked={policyForm.auditSensitive} onChange={(e) => setPolicyForm({ ...policyForm, auditSensitive: e.target.checked })} />Auditoría de eventos sensibles</label>
            <div className="cfg-field mt-2"><label>Caducidad de sesión (min)</label>
              <input type="number" value={policyForm.sessionExpiryMinutes} onChange={(e) => setPolicyForm({ ...policyForm, sessionExpiryMinutes: Number(e.target.value) })} /></div>
            <div className="flex gap-2 justify-end mt-3">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button type="button" className="plt-btn plt-btn--primary" disabled={busy} onClick={() => void savePolicies()}>Guardar</button>
            </div>
          </div></div>
        ) : null}

        {modal === 'permissions' && permRole ? (
          <div className="sec-modal-backdrop" role="dialog" aria-modal="true"><div className="sec-modal">
            <h3 className="sec-modal__title">Permisos — {permRole.role}</h3>
            <p className="text-xs text-[var(--muted)]">Alcance: {permRole.scope}</p>
            <ul className="met-module-list mt-2">
              <li><span>Acceso a ruta</span><strong>{permRole.access}</strong></li>
              <li><span>Sesiones activas</span><strong>{permRole.sessions}</strong></li>
              <li><span>Riesgo</span><strong>{riskLabel(permRole.risk)}</strong></li>
            </ul>
            <p className="text-xs mt-2">Los permisos granulares se gestionan en Usuarios por clínica, sin exponer datos clínicos cruzados.</p>
            <div className="flex gap-2 justify-end mt-3">
              <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setModal(null)}>Cerrar</button>
              <a href="/platform/usuarios" className="plt-btn plt-btn--primary no-underline">Abrir usuarios</a>
            </div>
          </div></div>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
      </div>
    </PlatformShell>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) {
  return (
    <li className="cln-detail__row">
      <span className="cln-detail__row-label"><Icon className="h-3.5 w-3.5" aria-hidden />{label}</span>
      <span className="cln-detail__row-value">{value}</span>
    </li>
  );
}
