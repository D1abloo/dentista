import { useEffect, useState } from 'react';
import type { StaffContext } from '@/lib/services/staffContext';

export function useStaffContext() {
  const [staff, setStaff] = useState<StaffContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/clinic/staff-context', { credentials: 'include' });
        const json = (await res.json()) as { data?: StaffContext };
        if (!cancelled) setStaff(res.ok ? (json.data ?? null) : null);
      } catch {
        if (!cancelled) setStaff(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { staff, loading };
}
