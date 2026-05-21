import { useEffect, useState } from 'react';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';
import { Button, Card, Field, Input } from '@/components/ui';
import { useNotice } from '@/hooks/useNotice';

export function PortalAccessEntry({ initialToken }: { initialToken?: string }) {
  const { setNotice } = useNotice();
  const [token, setToken] = useState(initialToken ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialToken) void activate(initialToken);
  }, [initialToken]);

  async function activate(raw: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/portal-access/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: raw.trim() })
      });
      const json = (await res.json()) as {
        data?: { redirectTo?: string; patientId?: string };
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(json.error?.message ?? 'Token no válido');
      if (json.data?.patientId) localStorage.setItem(STORAGE_PATIENT_ID, json.data.patientId);
      window.location.href = json.data?.redirectTo ?? '/paciente';
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo validar el token.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Acceso autorizado al portal del paciente">
      <p className="mb-4 text-sm text-slate-600">
        Introduce el token que te ha facilitado administración para consultar informes con registro de actividad.
      </p>
      <Field label="Token">
        <Input value={token} onChange={(e) => setToken(e.target.value)} disabled={busy} />
      </Field>
      <Button className="mt-3" disabled={busy} onClick={() => void activate(token)}>
        {busy ? 'Validando…' : 'Entrar'}
      </Button>
    </Card>
  );
}
