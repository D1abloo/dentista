import { Bell } from 'lucide-react';
import { unreadCount } from '@/lib/clinicNotifications';
import { getStoredTenantId } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';

/** Campana del panel → centro de notificaciones (separado de Ajustes). */
export function AdminNotificationBell() {
  const { state } = useDemoStore();
  const n = unreadCount(state, getStoredTenantId());
  return (
    <a
      href="/admin/notificaciones"
      className={`admin-notif-bell${n > 0 ? ' admin-notif-bell--pulse' : ''}`}
      aria-label={n > 0 ? `${n} notificaciones sin leer` : 'Notificaciones'}
    >
      <Bell className="h-4 w-4" aria-hidden />
      {n > 0 ? <span className="admin-notif-bell__count">{n > 99 ? '99+' : n}</span> : null}
    </a>
  );
}
