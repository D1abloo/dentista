import { useEffect, useMemo, useState } from 'react';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { getStoredPatientId } from '@/lib/demoStore';
import { STORAGE_PATIENT_ID } from '@/lib/storage/keys';
import type { Patient } from '@/types/demo';
import { useDemoStore } from './useDemoStore';

const FALLBACK_PATIENT: Patient = {
  id: DEMO_PATIENT_LOGIN_ID,
  fullName: 'Paciente',
  email: '',
  phone: '',
  reminderChannels: ['email'],
  createdAt: '2026-01-01'
};

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

  return useMemo(() => {
    const stored = getStoredPatientId();
    const id = overrideId ?? stored;
    if (id) {
      const match = state.patients.find((p) => p.id === id);
      if (match) return match;
    }
    if (state.patients.length === 1) return state.patients[0];
    return (
      state.patients.find((p) => p.id === DEMO_PATIENT_LOGIN_ID) ??
      state.patients[0] ??
      FALLBACK_PATIENT
    );
  }, [state.patients, overrideId]);
}
