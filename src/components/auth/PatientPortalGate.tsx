import { useEffect, useState, type ReactNode } from 'react';
import { clearDemoSession } from '@/lib/demoStore';
import { Restricted } from './Restricted';
import { AppLoader } from '@/components/ui/AppLoader';
import type { DemoRole } from '@/types/demo';

export function PatientPortalGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [staffView, setStaffView] = useState(false);
  const [inspectBanner, setInspectBanner] = useState(false);
  const [current, setCurrent] = useState<DemoRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      clearDemoSession();
      try {
        const pdpRes = await fetch('/api/portal-access/me', { credentials: 'include', cache: 'no-store' });
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
        const meRes = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
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
  }, []);

  if (!ready) {
    return <AppLoader label="Cargando portal del paciente…" fullscreen />;
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
    return <Restricted expected="paciente" current={current} live />;
  }

  return <>{children}</>;
}
