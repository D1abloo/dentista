import { useEffect, useState } from 'react';
import { ExternalLink, KeyRound } from 'lucide-react';
import { Button, Card, Empty, Field, Input, PageHeader, Select } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';
import { usePortalAccess } from '@/hooks/usePortalAccess';
import { useStaffContext } from '@/hooks/useStaffContext';
import { canViewPdpAudit } from '@/lib/adminNav';
import { useDemoStore } from '@/hooks/useDemoStore';
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

export function AdminPortalAccess() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const { setNotice } = useNotice();
  const { staff, loading: staffLoading } = useStaffContext();
  const patientIds = patientsForTenant(state, scope.tenantId);
  const patients = state.patients.filter((p) => patientIds.includes(p.id));
  const dentists = state.dentists.filter((d) => d.tenantId === scope.tenantId);

  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    dentistId: '',
    label: '',
    expiresInHours: '24'
  });

  const profileByDentist = new Map(
    dentists.filter((d) => d.profileId).map((d) => [d.id, d.profileId as string])
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portal-access', { credentials: 'include' });
      const json = (await res.json()) as { data?: { tokens?: TokenRow[] }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'Error al cargar');
      setTokens(json.data?.tokens ?? []);
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
    const profileId = profileByDentist.get(form.dentistId);
    if (!profileId) {
      setNotice({
        type: 'error',
        message: 'El profesional no tiene usuario vinculado. Regístralo en Usuarios de clínica o al dar de alta el dentista.'
      });
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
      setNotice({ type: 'ok', message: 'Token generado. Compártelo solo con el profesional autorizado.' });
      await load();
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
  const staffName = (profileId: string) => {
    const d = dentists.find((x) => x.profileId === profileId);
    return d?.fullName ?? profileId.slice(0, 8);
  };

  const linkedDentists = dentists.filter((d) => d.profileId);

  return (
    <div className="grid gap-4">
      <Card>
        <PageHeader
          title="Acceso al portal del paciente"
          subtitle="Genera tokens para que el personal autorizado consulte el PdP. El historial de actividad está en Auditoría PdP (solo administración)."
        />
        {!staffLoading && staff && !staff.hasLinkedDentist && staff.role === 'dentist' ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Tu usuario no tiene ficha de dentista vinculada. Pide a administración que te asocie en{' '}
            <a href="/admin/usuarios" className="font-semibold underline">
              Usuarios de clínica
            </a>
            .
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Paciente">
            <Select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Profesional autorizado (con perfil vinculado)">
            <Select value={form.dentistId} onChange={(e) => setForm({ ...form, dentistId: e.target.value })}>
              <option value="">Seleccionar…</option>
              {linkedDentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Etiqueta (opcional)">
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ej. Revisión informes" />
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
            <a
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]"
              href={`/paciente/acceso?token=${encodeURIComponent(createdToken)}`}
            >
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
        {!loading && !tokens.length ? <Empty title="Sin tokens" text="Genera el primer token de acceso." /> : null}
      </Card>

      {canViewPdpAudit(staff?.role) ? (
        <p className="text-center text-sm text-slate-500">
          <a href="/admin/auditoria-pdp" className="font-semibold text-[var(--blue)] underline">
            Ver auditoría de actividad en PdP
          </a>
        </p>
      ) : null}
    </div>
  );
}

/** Perfil del profesional para entrar con token propio (sin mostrar auditoría). */
export function AdminStaffPortalProfile() {
  const staffPortal = usePortalAccess();
  const { staff, loading: staffLoading } = useStaffContext();
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
      window.location.href = json.data?.redirectTo ?? '/paciente';
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo activar el acceso.' });
    }
  }

  if (!staffLoading && staff && !staff.canAccessPatientPortal) {
    return (
      <Card>
        <PageHeader title="Portal del paciente" subtitle="Acceso no disponible" />
        <p className="text-sm text-slate-600">Tu sesión no tiene un perfil de clínica vinculado para usar tokens de acceso.</p>
      </Card>
    );
  }

  return (
    <Card>
      <PageHeader title="Entrar con token" subtitle="Usa un token que te haya asignado administración." />
      {staffPortal.active ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
          <p className="font-bold text-teal-900">Sesión activa en portal paciente</p>
          <a href="/paciente" className="btn btn--primary btn--sm mt-3 inline-block no-underline">
            Continuar en portal del paciente
          </a>
        </div>
      ) : (
        <>
          <Field label="Token de acceso">
            <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Pega tu token" />
          </Field>
          <Button className="mt-2" onClick={() => void openWithToken()}>
            Entrar al portal del paciente
          </Button>
        </>
      )}
    </Card>
  );
}
