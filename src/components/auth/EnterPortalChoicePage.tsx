import { useEffect, useState } from 'react';
import { PortalChoicePanel } from '@/components/auth/PortalChoicePanel';
import { DentistaWebpLockup } from '@/components/brand/DentistaWebpLogo';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';

export function EnterPortalChoicePage() {
  const [options, setOptions] = useState<PortalChoiceOption[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<PortalChoiceId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/enter-choices', { credentials: 'include' });
        const json = (await res.json()) as {
          data?: { options?: PortalChoiceOption[]; email?: string; redirect?: string };
          error?: { message?: string };
        };
        if (!res.ok) {
          window.location.href = '/login';
          return;
        }
        if (json.data?.redirect && (json.data.options?.length ?? 0) <= 1) {
          window.location.href = json.data.redirect;
          return;
        }
        const opts = json.data?.options ?? [];
        if (opts.length <= 1) {
          window.location.href = json.data?.redirect ?? '/';
          return;
        }
        setOptions(opts);
        setEmail(json.data?.email ?? '');
      } catch {
        setError('No se pudieron cargar tus portales disponibles.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function pickPortal(portal: PortalChoiceId) {
    setPicking(portal);
    setError(null);
    try {
      const res = await fetch('/api/auth/select-portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ portal })
      });
      const json = (await res.json()) as { data?: { redirect?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo entrar.');
      window.location.href = json.data?.redirect ?? '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar.');
      setPicking(null);
    }
  }

  return (
    <main className="clinic-center-page">
      <div className="clinic-center-page__shell">
        <a href="/" className="clinic-center-page__brand">
          <DentistaWebpLockup placement="header" />
        </a>

        {loading ? (
          <p className="clinic-center-picker__lead">Cargando tus accesos…</p>
        ) : error ? (
          <p className="login-portal-choice__lead text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <PortalChoicePanel email={email} options={options} loading={picking} onSelect={(id) => void pickPortal(id)} />
        )}

        <p className="clinic-center-page__foot">
          <a href="/">← Volver al inicio</a>
        </p>
      </div>
    </main>
  );
}
