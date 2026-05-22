import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  Calendar,
  Check,
  CreditCard,
  FileStack,
  FileText,
  Globe,
  Settings,
  User,
  X
} from 'lucide-react';
import {
  archiveNotification,
  ensureClinicNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount
} from '@/lib/clinicNotifications';
import {
  actionRoute,
  categoryLabel,
  filterNotifications,
  notificationKpis,
  priorityLabel,
  type NotificationDateRange,
  type NotificationListFilter
} from '@/lib/notificationCenter';
import { formatPayTime, patientLine } from '@/lib/paymentAdmin';
import { getStoredTenantId, saveSettings, settingsFor } from '@/lib/demoStore';
import { defaultNotificationPrefs } from '@/lib/clinicNotifications';
import { useCountUp } from '@/hooks/useCountUp';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { ClinicNotification, ClinicNotificationCategory, NotificationPrefs } from '@/types/demo';

const FILTERS: { id: NotificationListFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'no_leidas', label: 'No leídas' },
  { id: 'urgentes', label: 'Urgentes' },
  { id: 'citas', label: 'Citas' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'informes', label: 'Informes' },
  { id: 'facturas', label: 'Facturas' },
  { id: 'pagos', label: 'Pagos' },
  { id: 'portal', label: 'Portal paciente' },
  { id: 'sistema', label: 'Sistema' }
];

function CategoryIcon({ c }: { c: ClinicNotificationCategory }) {
  const cls = 'h-4 w-4';
  if (c === 'citas') return <Calendar className={cls} />;
  if (c === 'pacientes') return <User className={cls} />;
  if (c === 'documentos') return <FileStack className={cls} />;
  if (c === 'informes') return <FileText className={cls} />;
  if (c === 'facturas') return <FileText className={cls} />;
  if (c === 'pagos') return <CreditCard className={cls} />;
  if (c === 'portal') return <Globe className={cls} />;
  return <Bell className={cls} />;
}

export function AdminNotifications() {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();
  const settings = settingsFor(state, tenantId);
  const prefs = settings.notificationPrefs ?? defaultNotificationPrefs();

  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<NotificationListFilter>('todas');
  const [range, setRange] = useState<NotificationDateRange>('7d');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [prefsDraft, setPrefsDraft] = useState<NotificationPrefs>(prefs);
  const [archiving, setArchiving] = useState<string | null>(null);

  useEffect(() => {
    const next = ensureClinicNotifications(state, tenantId);
    if (next.clinicNotifications.length !== state.clinicNotifications.length) {
      commit(next);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const tenantNotes = useMemo(
    () => state.clinicNotifications.filter((n) => n.tenantId === tenantId),
    [state.clinicNotifications, tenantId]
  );

  const filtered = useMemo(
    () => filterNotifications(tenantNotes, state, filter, range, query),
    [tenantNotes, state, filter, range, query]
  );

  const kpis = useMemo(() => notificationKpis(tenantNotes), [tenantNotes]);
  const unreadAnim = useCountUp(kpis.unread);
  const selected = filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  function markRead(n: ClinicNotification) {
    commit(markNotificationRead(state, n.id));
    setNotice({ type: 'ok', message: 'Notificación marcada como leída.' });
  }

  function markAll() {
    commit(markAllNotificationsRead(state, tenantId));
    setNotice({ type: 'ok', message: 'Todas las notificaciones se marcaron como leídas.' });
  }

  function archive(n: ClinicNotification) {
    setArchiving(n.id);
    window.setTimeout(() => {
      commit(archiveNotification(state, n.id));
      setArchiving(null);
      if (selectedId === n.id) setSelectedId(null);
      setNotice({ type: 'ok', message: 'Notificación archivada.' });
    }, 280);
  }

  function savePrefs() {
    commit(saveSettings(state, tenantId, { ...settings, notificationPrefs: prefsDraft }));
    setConfigOpen(false);
    setNotice({ type: 'ok', message: 'Preferencias de notificación guardadas.' });
  }

  function quickActions(n: ClinicNotification) {
    const go = () => {
      markRead(n);
      window.location.href = actionRoute(n);
    };
    if (n.category === 'facturas') {
      return (
        <>
          <button type="button" className="ntf-btn-ghost" onClick={go}>
            Ver factura
          </button>
          <button type="button" className="ntf-btn-ghost" onClick={() => setNotice({ type: 'ok', message: 'Recordatorio enviado correctamente.' })}>
            Enviar recordatorio
          </button>
        </>
      );
    }
    if (n.category === 'citas') {
      return (
        <>
          <button type="button" className="ntf-btn-ghost" onClick={go}>
            Ver cita
          </button>
          <button type="button" className="ntf-btn-ghost" onClick={go}>
            Confirmar
          </button>
        </>
      );
    }
    if (n.category === 'pagos') {
      return (
        <button type="button" className="ntf-btn-ghost" onClick={go}>
          Ver pago
        </button>
      );
    }
    return (
      <button type="button" className="ntf-btn-ghost" onClick={go}>
        Abrir módulo
      </button>
    );
  }

  return (
    <div className="ntf-module">
      <header className="ntf-module__head">
        <div>
          <h1>Notificaciones</h1>
          <p>Consulta y gestiona los avisos generados por pacientes, citas, documentos, facturas, pagos y portal del paciente.</p>
        </div>
        <div className="ntf-module__actions">
          <button type="button" className="ntf-btn-secondary" onClick={markAll}>
            <Check className="h-4 w-4" /> Marcar todas como leídas
          </button>
          <button type="button" className="ntf-btn-secondary" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4" /> Configurar avisos
          </button>
        </div>
      </header>

      <div className="ntf-toolbar">
        <div className="ntf-toolbar__filters">
          {(['hoy', '7d', 'mes'] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={`ntf-chip${range === r ? ' ntf-chip--active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'hoy' ? 'Hoy' : r === '7d' ? 'Últimos 7 días' : 'Este mes'}
            </button>
          ))}
        </div>
        <select className="ntf-select" defaultValue={settings.clinicName}>
          <option>{settings.clinicName}</option>
        </select>
        <select className="ntf-select">
          <option>Todo el equipo</option>
        </select>
      </div>

      <div className="ntf-kpis">
        {[
          { label: 'No leídas', value: unreadAnim, tone: 'teal' },
          { label: 'Urgentes', value: kpis.urgent, tone: 'red' },
          { label: 'Pacientes', value: kpis.pacientes, tone: 'blue' },
          { label: 'Citas', value: kpis.citas, tone: 'blue' },
          { label: 'Facturación', value: kpis.facturas, tone: 'amber' },
          { label: 'Pagos', value: kpis.pagos, tone: 'green' }
        ].map((k) => (
          <div key={k.label} className={`ntf-kpi ntf-kpi--${k.tone}`}>
            <p>{k.label}</p>
            <strong>{k.value}</strong>
          </div>
        ))}
      </div>

      <div className="ntf-chips-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`ntf-chip${filter === f.id ? ' ntf-chip--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="ntf-layout">
        <section className="ntf-list">
          {!ready ? (
            <div className="ntf-skeleton" />
          ) : filtered.length === 0 ? (
            <div className="ntf-empty">
              <Bell className="h-10 w-10 text-teal-600" />
              <h2>No tienes notificaciones pendientes</h2>
              <p>Cuando tus pacientes soliciten citas, realicen pagos, consulten documentos o haya facturas pendientes, aparecerán aquí.</p>
              <button type="button" className="ntf-btn-primary" onClick={() => setConfigOpen(true)}>
                Configurar avisos
              </button>
            </div>
          ) : (
            filtered.map((n) => (
              <article
                key={n.id}
                className={`ntf-item${!n.read ? ' ntf-item--unread' : ''}${n.priority === 'urgente' ? ' ntf-item--urgent' : ''}${n.priority === 'importante' ? ' ntf-item--important' : ''}${archiving === n.id ? ' ntf-item--out' : ''}`}
                onClick={() => setSelectedId(n.id)}
              >
                <span className={`ntf-item__icon ntf-item__icon--${n.category}`}>
                  <CategoryIcon c={n.category} />
                </span>
                <div className="ntf-item__body">
                  <div className="ntf-item__top">
                    <span className="ntf-item__cat">{categoryLabel(n.category)}</span>
                    {!n.read ? <span className="ntf-pill">No leída</span> : null}
                    {n.priority !== 'normal' ? <span className={`ntf-pill ntf-pill--${n.priority}`}>{priorityLabel(n.priority)}</span> : null}
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.description}</p>
                  {n.patientId ? <p className="ntf-item__patient">{patientLine(state, n.patientId)}</p> : null}
                  <p className="ntf-item__time">{formatPayTime(n.createdAt)}</p>
                  <div className="ntf-item__actions" onClick={(e) => e.stopPropagation()}>
                    {quickActions(n)}
                    {!n.read ? (
                      <button type="button" className="ntf-btn-ghost" onClick={() => markRead(n)}>
                        Marcar como leída
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {selected ? (
          <aside className={`ntf-detail${selected ? ' ntf-detail--open' : ''}`}>
            <button type="button" className="ntf-detail__close" aria-label="Cerrar" onClick={() => setSelectedId(null)}>
              <X className="h-5 w-5" />
            </button>
            <p className="ntf-item__cat">{categoryLabel(selected.category)}</p>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            {selected.patientId ? <p>{patientLine(state, selected.patientId)}</p> : null}
            <p className="ntf-item__time">{formatPayTime(selected.createdAt)}</p>
            <p>
              Módulo: <strong>{categoryLabel(selected.category)}</strong>
            </p>
            <div className="ntf-detail__history">
              <h4>Historial del evento</h4>
              <p>Registrado en el panel administrativo · {selected.entityType ?? 'evento'} {selected.entityId ?? ''}</p>
            </div>
            <div className="ntf-detail__actions">{quickActions(selected)}</div>
            <button type="button" className="ntf-btn-secondary" onClick={() => markRead(selected)}>
              Marcar como leída
            </button>
            <button type="button" className="ntf-btn-secondary" onClick={() => archive(selected)}>
              <Archive className="h-4 w-4" /> Archivar
            </button>
          </aside>
        ) : null}
      </div>

      {configOpen ? (
        <div className="ntf-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ntf-modal">
            <header>
              <h2>Configuración de notificaciones</h2>
              <button type="button" onClick={() => setConfigOpen(false)} aria-label="Cerrar">
                <X />
              </button>
            </header>
            <p className="ntf-modal__sub">Activa avisos por categoría y canal. También disponible en Ajustes → Notificaciones.</p>
            <div className="ntf-pref-grid">
              {(
                ['citas', 'pacientes', 'documentos', 'informes', 'facturas', 'pagos', 'portal', 'sistema'] as ClinicNotificationCategory[]
              ).map((cat) => (
                <label key={cat}>
                  <input
                    type="checkbox"
                    checked={prefsDraft.categories[cat] !== false}
                    onChange={(e) =>
                      setPrefsDraft({
                        ...prefsDraft,
                        categories: { ...prefsDraft.categories, [cat]: e.target.checked }
                      })
                    }
                  />
                  {categoryLabel(cat)}
                </label>
              ))}
            </div>
            <h3>Canales</h3>
            <div className="ntf-pref-grid">
              {(['panel', 'email', 'whatsapp', 'portal'] as const).map((ch) => (
                <label key={ch}>
                  <input
                    type="checkbox"
                    checked={prefsDraft.channels[ch]}
                    onChange={(e) =>
                      setPrefsDraft({
                        ...prefsDraft,
                        channels: { ...prefsDraft.channels, [ch]: e.target.checked }
                      })
                    }
                  />
                  {ch === 'panel' ? 'Panel administrativo' : ch === 'portal' ? 'Portal interno' : ch}
                </label>
              ))}
            </div>
            <footer>
              <button type="button" className="ntf-btn-secondary" onClick={() => setConfigOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="ntf-btn-primary" onClick={savePrefs}>
                Guardar preferencias
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Contador para campana del panel */
export function useAdminUnreadNotifications() {
  const { state } = useDemoStore();
  return unreadCount(state, getStoredTenantId());
}
