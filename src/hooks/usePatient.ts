import { useEffect, useState } from 'react';
import { getStoredPatientId } from '@/lib/demoStore';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';
import { useDemoStore } from './useDemoStore';

export function usePatient() {
  const { state } = useDemoStore();
  const [overrideId, setOverrideId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/portal-access/me', { credentials: 'include' });
        const json = (await res.json()) as { data?: { active?: boolean; patientId?: string } };
        if (res.ok && json.data?.active && json.data.patientId) {
          setOverrideId(json.data.patientId);
          localStorage.setItem(STORAGE_PATIENT_ID, json.data.patientId);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const id = overrideId ?? getStoredPatientId();
  return state.patients.find((p) => p.id === id) ?? state.patients[0];
}
