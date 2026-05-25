import { useEffect, useRef, useState } from 'react';
import { Bell, Calendar, ChevronDown, Shield } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { PlatformPageSearch } from './PlatformPageSearch';
import type { CriticalAlert } from '@/lib/platform/monitoringTypes';

type MeUser = { name?: string; email?: string; role?: string };

type Props = {
  alerts: CriticalAlert[];
  onOpenAlert: (alert: CriticalAlert) => void;
};

export function PlatformMonitoringToolbar({ alerts, onOpenAlert }: Props) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { data?: MeUser } | null) => setUser(j?.data ?? null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function onDoc(e: MouseEvent) {
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [notifOpen]);

  const displayName = user?.name?.trim() || 'Super Admin';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const onSecurity = path.startsWith('/platform/seguridad');

  return (
    <div className="plt-mon-toolbar">
      <PlatformPageSearch className="plt-mon-toolbar__search" />

      <div className="plt-mon-toolbar__actions">
        <div className="plt-mon-toolbar__notif" ref={notifRef}>
          <button
            type="button"
            className={`plt-mon-toolbar__icon${notifOpen ? ' plt-mon-toolbar__icon--open' : ''}`}
            aria-label="Alertas críticas de monitorización"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {alerts.length ? <span className="plt-mon-toolbar__badge">{alerts.length}</span> : null}
          </button>
          {notifOpen ? (
            <div className="plt-mon-toolbar__panel" role="dialog" aria-label="Notificaciones críticas">
              <header className="plt-mon-toolbar__panel-head">
                <h2>Alertas críticas</h2>
                <span>{alerts.length}</span>
              </header>
              {alerts.length ? (
                <ul>
                  {alerts.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => { setNotifOpen(false); onOpenAlert(a); }}>
                        <strong>{a.title}</strong>
                        <small>{a.time_label}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="plt-mon-toolbar__panel-empty">No hay alertas críticas activas.</p>
              )}
            </div>
          ) : null}
        </div>

        <a
          href="/platform/seguridad"
          className={`plt-mon-toolbar__icon plt-mon-toolbar__icon--shield${onSecurity ? ' plt-mon-toolbar__icon--active' : ''}`}
          aria-label="Seguridad de plataforma"
          title="Ir a Seguridad"
        >
          <Shield className="h-4 w-4" aria-hidden />
        </a>

        <button type="button" className="plt-mon-toolbar__date" aria-label="Rango de fechas (hoy)">
          <Calendar className="h-4 w-4" aria-hidden />
          <span>Hoy</span>
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>

        <div className="plt-mon-toolbar__user">
          <span className="plt-mon-toolbar__avatar" aria-hidden>
            <LogoMark size={28} />
          </span>
          <div>
            <strong>{displayName}</strong>
            <span>{user?.email ?? 'Plataforma AgendaClinic'}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        </div>
      </div>
    </div>
  );
}
