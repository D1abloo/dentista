import { useCallback, useEffect, useState } from 'react';
import { getActiveClinicId, setActiveClinicId } from '@/lib/activeClinic';
import { isClientLiveMode } from '@/lib/appMode';
import { useDemoStore } from '@/hooks/useDemoStore';
import type { Clinic } from '@/types/demo';

const ACTIVE_CLINIC_EVENT = 'dentista:active-clinic';

export function useActiveClinic(tenantId: string, clinics: Clinic[], fallbackClinicId?: string) {
  const { state } = useDemoStore();
  const resolve = useCallback(
    () => getActiveClinicId(state, tenantId, fallbackClinicId),
    [state, tenantId, fallbackClinicId]
  );

  const [clinicId, setClinicIdState] = useState(() => resolve());

  useEffect(() => {
    setClinicIdState(resolve());
  }, [resolve]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key?.includes('active_clinic')) setClinicIdState(resolve());
    }
    function onCustom() {
      setClinicIdState(resolve());
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener(ACTIVE_CLINIC_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ACTIVE_CLINIC_EVENT, onCustom);
    };
  }, [resolve]);

  const setClinicId = useCallback(
    (nextId: string) => {
      if (!clinics.some((c) => c.id === nextId)) return;
      setActiveClinicId(nextId);
      setClinicIdState(nextId);
      window.dispatchEvent(new CustomEvent(ACTIVE_CLINIC_EVENT, { detail: { clinicId: nextId } }));
    },
    [clinics]
  );

  const activeClinic = clinics.find((c) => c.id === clinicId) ?? clinics[0];

  return { clinicId, setClinicId, activeClinic, refreshOnSwitch: isClientLiveMode() };
}

export { ACTIVE_CLINIC_EVENT };
