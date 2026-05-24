import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui';

type State = 'idle' | 'loading' | 'ok' | 'error';

export function ActivationPage() {
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')?.trim();
    if (!token) {
      setState('error');
      setMessage('Falta el enlace de activación. Abre el correo que te enviamos al registrarte.');
      return;
    }

    setState('loading');
    void (async () => {
      try {
        const res = await fetch('/api/public/patient-activate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const json = (await res.json()) as {
          data?: { email?: string; fullName?: string };
          error?: { message?: string };
          message?: string;
        };
        if (!res.ok) {
          setState('error');
          setMessage(json.error?.message ?? json.message ?? 'No se pudo activar la cuenta.');
          return;
        }
        setState('ok');
        setEmail(json.data?.email ?? '');
        setMessage(json.message ?? 'Tu cuenta ya está activa.');
      } catch {
        setState('error');
        setMessage('Error de conexión. Inténtalo de nuevo en unos minutos.');
      }
    })();
  }, []);

  return (
    <main className="activate-page">
      <div className="activate-page__card">
        <Logo />
        {state === 'loading' ? (
          <>
            <Loader2 className="activate-page__icon activate-page__icon--spin" aria-hidden />
            <h1>Activando tu cuenta…</h1>
            <p className="text-sm text-slate-600">Un momento, estamos verificando tu enlace.</p>
          </>
        ) : null}
        {state === 'ok' ? (
          <>
            <CheckCircle2 className="activate-page__icon activate-page__icon--ok" aria-hidden />
            <h1>¡Cuenta activada!</h1>
            <p className="text-sm text-slate-600">{message}</p>
            {email ? (
              <p className="text-xs font-bold text-teal-800">
                Acceso: <span className="font-mono">{email}</span>
              </p>
            ) : null}
            <div className="activate-page__actions">
              <a href="/login" className="no-underline">
                <Button>Iniciar sesión</Button>
              </a>
              <a href="/portal-paciente" className="no-underline">
                <Button tone="secondary">Portal del paciente</Button>
              </a>
            </div>
          </>
        ) : null}
        {state === 'error' || state === 'idle' ? (
          state === 'error' ? (
            <>
              <XCircle className="activate-page__icon activate-page__icon--err" aria-hidden />
              <h1>No se pudo activar</h1>
              <p className="text-sm text-slate-600">{message}</p>
              <div className="activate-page__actions">
                <a href="/registro-paciente" className="no-underline">
                  <Button>Registrarme de nuevo</Button>
                </a>
                <a href="/login" className="no-underline">
                  <Button tone="secondary">Ir al login</Button>
                </a>
              </div>
            </>
          ) : null
        ) : null}
      </div>
    </main>
  );
}
