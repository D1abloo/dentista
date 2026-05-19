import { getStoredPatientId } from '@/lib/demoStore';
import { useDemoStore } from './useDemoStore';

export function usePatient() {
  const { state } = useDemoStore();
  const id = getStoredPatientId();
  return state.patients.find((p) => p.id === id) ?? state.patients[0];
}
