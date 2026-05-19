export const TENANT_CENTRO = 'TEN-0001';
export const TENANT_NORTE = 'TEN-0002';
export const TENANT_SUR = 'TEN-0003';

export const DEMO_TENANTS = [
  { id: TENANT_CENTRO, label: 'Clínica Centro' },
  { id: TENANT_NORTE, label: 'Clínica Norte' },
  { id: TENANT_SUR, label: 'Clínica Sur' }
] as const;

export const VALID_TENANT_IDS = new Set<string>([TENANT_CENTRO, TENANT_NORTE, TENANT_SUR]);
