import { useEffect, useState, type ReactNode } from 'react';
import { isClientDemoMode } from '@/lib/appMode';

function needsPasswordChange(user: {
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
  role?: string;
}) {
  if (user.role === 'super_admin') return false;
  return Boolean(user.mustChangePassword || user.passwordExpired);
}

export function PasswordChangeGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isClientDemoMode()) {
      setReady(true);
      return;
    }
    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          setReady(true);
          return;
        }
        const json = (await res.json()) as {
          data?: { mustChangePassword?: boolean; passwordExpired?: boolean; role?: string };
        };
        const user = json.data;
        if (user && needsPasswordChange(user)) {
          const q = user.passwordExpired ? '?expired=1' : '';
          window.location.replace(`/login/cambiar-password${q}`);
          return;
        }
      } catch {
        /* ignore */
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-700">
        Verificando sesión…
      </main>
    );
  }

  return <>{children}</>;
}
