import { useEffect, useState, type ReactNode } from 'react';
import { isClientDemoMode } from '@/lib/appMode';
import { clearDemoSession, getStoredRole } from '@/lib/demoStore';
import { Restricted } from './Restricted';
import type { DemoRole } from '@/types/demo';

export function PatientPortalGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [staffView, setStaffView] = useState(false);
  const [inspectBanner, setInspectBanner] = useState(false);
  const [current, setCurrent] = useState<DemoRole | null>(null);
  const demo = isClientDemoMode();

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (demo) {
        const stored = getStoredRole();
        if (!cancelled) {
          if (stored === 'admin') {
            setStaffView(true);
            setInspectBanner(false);
            setCurrent('paciente');
          } else {
            setStaffView(false);
            setInspectBanner(false);
            setCurrent(stored === 'paciente' ? 'paciente' : null);
          }
          setReady(true);
        }
        return;
      }

      clearDemoSession();
      try {
        const pdpRes = await fetch('/api/portal-access/me', { credentials: 'include' });
        const pdpJson = (await pdpRes.json()) as { data?: { active?: boolean } };
        if (!cancelled && pdpRes.ok && pdpJson.data?.active) {
          setStaffView(true);
          setCurrent('paciente');
          setReady(true);
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        const meJson = (await meRes.json()) as {
          data?: { role?: string; platformInspect?: boolean; inspectMode?: string };
        };
        if (meJson.data?.platformInspect && meJson.data.inspectMode === 'patient_portal') {
          if (!cancelled) {
            setStaffView(true);
            setInspectBanner(true);
            setCurrent('paciente');
            setReady(true);
          }
          return;
        }
        if (meJson.data?.role === 'super_admin' || meJson.data?.role === 'admin') {
          if (!cancelled) {
            setStaffView(true);
            setInspectBanner(false);
            setCurrent('paciente');
            setReady(true);
          }
          return;
        }
        const role = meJson.data?.role;
        if (!cancelled) {
          setStaffView(false);
          setInspectBanner(false);
          if (role === 'patient') setCurrent('paciente');
          else setCurrent(null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setStaffView(false);
          setInspectBanner(false);
          setCurrent(null);
          setReady(true);
        }
      }
    };
    void sync();
    const onFocus = () => void sync();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [demo]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-dental-800">
        Cargando portal del paciente…
      </main>
    );
  }

  if (staffView) {
    return (
      <>
        {inspectBanner ? (
          <div className="platform-inspect-banner platform-inspect-banner--patient" role="status">
            <strong>Revisión PdP (plataforma)</strong> — Quedan registrados usuario, rol, fecha/hora y clics.{' '}
            <a href="/platform/incidencias">Salir de inspección</a>
          </div>
        ) : null}
        {children}
      </>
    );
  }

  if (current !== 'paciente') {
    return <Restricted expected="paciente" current={current} live={!demo} />;
  }

  return <>{children}</>;
}
