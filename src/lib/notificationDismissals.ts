import type { ClinicNotification } from '@/types/demo';

const STORAGE_PREFIX = 'dentista:dismissed-notifications:';

export function notificationDismissKey(n: Pick<ClinicNotification, 'entityType' | 'entityId' | 'title' | 'id'>): string {
  if (n.entityType && n.entityId) return `${n.entityType}:${n.entityId}:${n.title}`;
  return `id:${n.id}`;
}

function storageKey(tenantId: string) {
  return `${STORAGE_PREFIX}${tenantId}`;
}

export function loadDismissedKeys(tenantId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey(tenantId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === 'string'));
  } catch {
    return new Set();
  }
}

export function saveDismissedKeys(tenantId: string, keys: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(tenantId), JSON.stringify([...keys].slice(-500)));
}

export function dismissNotificationKey(tenantId: string, key: string) {
  const keys = loadDismissedKeys(tenantId);
  keys.add(key);
  saveDismissedKeys(tenantId, keys);
}

export function isNotificationDismissed(
  tenantId: string,
  n: Pick<ClinicNotification, 'entityType' | 'entityId' | 'title' | 'id'>
): boolean {
  return loadDismissedKeys(tenantId).has(notificationDismissKey(n));
}

export function filterUndismissedNotifications(
  list: ClinicNotification[],
  tenantId: string
): ClinicNotification[] {
  const dismissed = loadDismissedKeys(tenantId);
  return list.filter((n) => !dismissed.has(notificationDismissKey(n)));
}
