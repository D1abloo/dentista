import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  FileStack,
  FileText,
  Globe
} from 'lucide-react';
import {
  ensureClinicNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount
} from '@/lib/clinicNotifications';
import { actionRoute, categoryLabel, priorityLabel } from '@/lib/notificationCenter';
import { formatPayTime } from '@/lib/paymentAdmin';
import { getStoredTenantId } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import type { ClinicNotification, ClinicNotificationCategory } from '@/types/demo';

const DROPDOWN_LIMIT = 8;

function CategoryIcon({ c }: { c: ClinicNotificationCategory }) {
  const cls = 'h-4 w-4';
  if (c === 'citas') return <Calendar className={cls} aria-hidden />;
  if (c === 'documentos') return <FileStack className={cls} aria-hidden />;
  if (c === 'informes' || c === 'facturas') return <FileText className={cls} aria-hidden />;
  if (c === 'pagos') return <CreditCard className={cls} aria-hidden />;
  if (c === 'portal') return <Globe className={cls} aria-hidden />;
  return <Bell className={cls} aria-hidden />;
}

/** Campana del panel → desplegable rápido + centro de notificaciones. */
export function AdminNotificationBell() {
  const { state, commit } = useDemoStore();
  const tenantId = getStoredTenantId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const count = unreadCount(state, tenantId);

  useEffect(() => {
    const next = ensureClinicNotifications(state, tenantId);
    if (next.clinicNotifications.length !== state.clinicNotifications.length) {
      commit(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const items = useMemo(() => {
    const list = state.clinicNotifications
      .filter((n) => n.tenantId === tenantId && !n.archived)
      .sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return b.createdAt.localeCompare(a.createdAt);
      });
    return list.slice(0, DROPDOWN_LIMIT);
  }, [state.clinicNotifications, tenantId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  function openItem(n: ClinicNotification) {
    if (!n.read) commit(markNotificationRead(state, n.id));
    setOpen(false);
    window.location.href = actionRoute(n);
  }

  function markAll() {
    commit(markAllNotificationsRead(state, tenantId));
  }

  return (
    <div className={`admin-notif-menu${open ? ' admin-notif-menu--open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`admin-notif-bell${count > 0 ? ' admin-notif-bell--pulse' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `${count} notificaciones sin leer` : 'Notificaciones'}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 ? <span className="admin-notif-bell__count">{count > 99 ? '99+' : count}</span> : null}
      </button>

      {open ? (
        <div className="admin-notif-panel" role="dialog" aria-label="Notificaciones recientes">
          <header className="admin-notif-panel__head">
            <div>
              <p className="admin-notif-panel__title">Notificaciones</p>
              <p className="admin-notif-panel__sub">
                {count > 0 ? `${count} sin leer` : 'Estás al día'}
              </p>
            </div>
            {count > 0 ? (
              <button type="button" className="admin-notif-panel__mark" onClick={markAll}>
                <Check className="h-3.5 w-3.5" aria-hidden />
                Marcar todas
              </button>
            ) : null}
          </header>

          <ul className="admin-notif-panel__list">
            {items.length ? (
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`admin-notif-item${n.read ? '' : ' admin-notif-item--unread'}${
                      n.priority === 'urgente' ? ' admin-notif-item--urgent' : ''
                    }`}
                    onClick={() => openItem(n)}
                  >
                    <span className={`admin-notif-item__icon admin-notif-item__icon--${n.category}`}>
                      <CategoryIcon c={n.category} />
                    </span>
                    <span className="admin-notif-item__body">
                      <span className="admin-notif-item__row">
                        <span className="admin-notif-item__title">{n.title}</span>
                        {!n.read ? <span className="admin-notif-item__dot" aria-hidden /> : null}
                      </span>
                      <span className="admin-notif-item__desc">{n.description}</span>
                      <span className="admin-notif-item__meta">
                        <span>{categoryLabel(n.category)}</span>
                        <span aria-hidden>·</span>
                        <span>{formatPayTime(n.createdAt)}</span>
                        {n.priority !== 'normal' ? (
                          <>
                            <span aria-hidden>·</span>
                            <span className="admin-notif-item__prio">{priorityLabel(n.priority)}</span>
                          </>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="admin-notif-panel__empty">
                <Bell className="h-8 w-8" aria-hidden />
                <p>No hay avisos recientes</p>
              </li>
            )}
          </ul>

          <footer className="admin-notif-panel__foot">
            <a href="/admin/notificaciones" className="admin-notif-panel__all" onClick={() => setOpen(false)}>
              Ver todas las notificaciones
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
