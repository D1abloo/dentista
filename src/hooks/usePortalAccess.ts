import { useCallback, useEffect, useState } from 'react';

export type PortalAccessState = {
  active: boolean;
  patientId?: string;
  patientName?: string;
  staffProfileId?: string;
  tokenId?: string;
  targetClinicId?: string;
  tokens: { id: string; label: string | null; expires_at: string; patient_id: string }[];
  loading: boolean;
};

export function usePortalAccess() {
  const [state, setState] = useState<PortalAccessState>({
    active: false,
    tokens: [],
    loading: true
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/portal-access/me', { credentials: 'include' });
      const json = (await res.json()) as {
        data?: PortalAccessState & { tokens?: PortalAccessState['tokens'] };
      };
      if (res.ok && json.data) {
        setState({
          active: Boolean(json.data.active),
          patientId: json.data.patientId,
          patientName: json.data.patientName,
          staffProfileId: json.data.staffProfileId,
          tokenId: json.data.tokenId,
          targetClinicId: json.data.targetClinicId,
          tokens: json.data.tokens ?? [],
          loading: false
        });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const closeAccess = useCallback(async () => {
    await fetch('/api/portal-access/me', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{}'
    });
    await refresh();
  }, [refresh]);

  return { ...state, refresh, closeAccess };
}

export async function logPortalAudit(event: {
  eventType: 'nav_click' | 'view_report' | 'view_document' | 'view_invoice' | 'view_consent' | 'other';
  pagePath?: string;
  resourceLabel?: string;
  resourceId?: string;
}) {
  try {
    await fetch('/api/portal-access/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(event)
    });
  } catch {
    /* no bloquear UI */
  }
}
