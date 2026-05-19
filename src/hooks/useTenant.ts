import { getStoredTenantId } from '@/lib/demoStore';
import { adminScope } from '@/lib/tenant';
import { useDemoStore } from './useDemoStore';

export function useTenant() {
  const { state } = useDemoStore();
  const tenantId = getStoredTenantId();
  return adminScope(state, tenantId);
}
