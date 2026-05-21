import { useEffect, useState } from 'react';
import { ExternalLink, KeyRound, Shield } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { usePortalAccess } from '@/hooks/usePortalAccess';
import { useDemoStore } from '@/hooks/useDemoStore';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';
import { useTenant } from '@/hooks/useTenant';
import { patientsForTenant } from '@/lib/tenant';

type TokenRow = {
  id: string;
  patient_id: string;
  staff_profile_id: string;
  label: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
};

type AuditRow = {
  id: string;
  event_type: string;
  page_path: string | null;
  resource_label: string | null;
  resource_id: string | null;
  staff_profile_id: string | null;
  patient_id: string | null;
  created_at: string;
};

export function AdminPortalAccess() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const staffPortal = usePortalAccess();
  const patientIds = patientsForTenant(state, scope.tenantId);
  const patients = state.patients.filter((p) => patientIds.includes(p.id));
  const dentists = state.dentists.filter((d) => d.tenantId === scope.tenantId);

  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    dentistId: '',
    label: '',
    expiresInHours: '24'
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portal-access', { credentials: 'include' });
      const json = (await res.json()) as { data?: { tokens?: TokenRow[] }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar');
      setTokens(json.data?.tokens ?? []);
      const auditRes = await fetch('/api/admin/portal-access?audit=1', { credentials: 'include' });
      const auditJson = (await auditRes.json()) as { data?: { audit?: AuditRow[] } };
      if (auditRes.ok) setAudit(auditJson.data?.audit ?? []);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo cargar.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createToken() {
    if (!form.patientId || !form.dentistId) {
      setNotice({ type: 'error', message: 'Selecciona paciente y profesional.' });
      return;
    }
    try {
      const res = await fetch('/api/admin/portal-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientId: form.patientId,
          dentistId: form.dentistId,
          label: form.label || undefined,
          expiresInHours: Number(form.expiresInHours)
        })
      });
      const json = (await res.json()) as {
        data?: { token?: string; portalUrl?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo crear');
      setCreatedToken(json.data?.token ?? null);
      setNotice({ type: 'ok', message: 'Token generado. Cópialo ahora; no se volverá a mostrar.' });
      await load();
      await staffPortal.refresh();
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'Error al crear token.' });
    }
  }

  async function revoke(id: string) {
    try {
      const res = await fetch('/api/admin/portal-access', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tokenId: id })
      });
      if (!res.ok) throw new Error('No se pudo revocar');
      setNotice({ type: 'ok', message: 'Token revocado.' });
      await load();
    } catch {
      setNotice({ type: 'error', message: 'No se pudo revocar el token.' });
    }
  }

  const patientName = (id: string) => state.patients.find((p) => p.id === id)?.fullName ?? id.slice(0, 8);
  const staffName = (id: string) => {
    const d = dentists.find((x) => x.id === id);
    return d?.fullName ?? id.slice(0, 8);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <PageHeader title="Acceso al portal del paciente" subtitle="Tokens para que el equipo consulte informes en el PdP con trazabilidad." />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Paciente">
            <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} · {p.dni ?? p.id}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Profesional autorizado">
            <Select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Etiqueta (opcional)">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ej. Revisión informes sede norte" />
          </Field>
          <Field label="Validez (horas)">
            <Input type="number" min={1} max={168} value={form.expiresInHours} onChange={(e) => setForm({ ...form, expiresInHours: e.target.value })} />
          </Field>
          <Button className="md:col-span-2" onClick={() => void createToken()}>
            <KeyRound className="h-4 w-4" /> Generar token de acceso
          </Button>
        </div>
        {createdToken ? (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[#f8fafc] p-4 text-sm">
            <p className="font-bold text-[var(--navy)]">Token (copiar ahora)</p>
            <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{createdToken}</code>
            <a className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]" href={`/paciente/acceso?token=${encodeURIComponent(createdToken)}`}>
              Abrir enlace de acceso <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : null}
      </Card>

      <Card>
        <PageHeader title="Tokens activos" subtitle={loading ? 'Cargando…' : `${tokens.filter((t) => !t.revoked_at).length} registros`} />
        <ul className="org-branch-list">
          {tokens.map((t) => (
            <li key={t.id} className="org-branch-list__item">
              <div>
                <p className="font-bold">{t.label || 'Acceso PdP'}</p>
                <p className="text-xs text-slate-600">
                  {patientName(t.patient_id)} → {staffName(t.staff_profile_id)}
                </p>
                <p className="text-xs text-slate-500">
                  Expira {new Date(t.expires_at).toLocaleString('es-ES')}
                  {t.last_used_at ? ` · Último uso ${new Date(t.last_used_at).toLocaleString('es-ES')}` : ''}
                </p>
              </div>
              {!t.revoked_at && new Date(t.expires_at) > new Date() ? (
                <Button tone="ghost" onClick={() => void revoke(t.id)}>
                  Revocar
                </Button>
              ) : (
                <span className="text-xs font-bold text-slate-400">{t.revoked_at ? 'Revocado' : 'Expirado'}</span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <PageHeader title="Registro de actividad en PdP" subtitle="Fecha, hora y acciones del profesional en el portal del paciente." />
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Fecha / hora</th>
                <th>Evento</th>
                <th>Detalle</th>
                <th>Paciente</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString('es-ES')}</td>
                  <td>{row.event_type}</td>
                  <td>
                    {row.resource_label || row.page_path || '—'}
                    {row.resource_id ? ` · ${row.resource_id}` : ''}
                  </td>
                  <td>{row.patient_id ? patientName(row.patient_id) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AdminStaffPortalProfile() {
  const staffPortal = usePortalAccess();
  const [tokenInput, setTokenInput] = useState('');
  const { setNotice } = useNotice();

  async function openWithToken(raw?: string) {
    const token = (raw ?? tokenInput).trim();
    if (!token) {
      setNotice({ type: 'error', message: 'Introduce el token de acceso.' });
      return;
    }
    try {
      const res = await fetch('/api/portal-access/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token })
      });
      const json = (await res.json()) as {
        data?: { redirectTo?: string; patientId?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'Token no válido');
      if (json.data?.patientId) {
        localStorage.setItem(STORAGE_PATIENT_ID, json.data.patientId);
      }
      window.location.href = json.data?.redirectTo ?? '/paciente';
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo activar el acceso.' });
    }
  }

  return (
    <Card>
      <PageHeader title="Mi acceso al portal del paciente" subtitle="Consulta informes de otras sedes con autorización registrada." />
      {staffPortal.active ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
          <p className="flex items-center gap-2 font-bold text-teal-900">
            <Shield className="h-4 w-4" /> Sesión activa: {staffPortal.patientName ?? 'Paciente'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/paciente" className="btn btn--primary text-sm no-underline">
              Continuar en portal del paciente
            </a>
            <Button tone="ghost" onClick={() => void staffPortal.closeAccess()}>
              Cerrar acceso autorizado
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Field label="Token de acceso">
            <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Pega el token que te ha facilitado administración" />
          </Field>
          <Button className="mt-2" onClick={() => void openWithToken()}>
            Entrar al portal del paciente
          </Button>
          {staffPortal.tokens.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              <p className="font-bold text-slate-700">Tokens asignados a ti</p>
              {staffPortal.tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2">
                  <span>{t.label || `Paciente ${t.patient_id.slice(0, 8)}`}</span>
                  <span className="text-xs text-slate-500">hasta {new Date(t.expires_at).toLocaleString('es-ES')}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </Card>
  );
}
