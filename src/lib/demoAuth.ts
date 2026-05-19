import { establishDemoSession } from '@/lib/demo-session';
import { isClientDemoMode } from '@/lib/appMode';
import { clearDemoSession, setDemoSession } from '@/lib/demoStore';
import { DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { TENANT_CENTRO } from '@/lib/tenantIds';
import type { DemoRole } from '@/types/demo';

export async function signInAs(
  role: DemoRole,
  opts?: { tenantId?: string; ephemeral?: boolean }
): Promise<string> {
  if (!isClientDemoMode()) {
    throw new Error('signInAs solo está disponible con PUBLIC_DEMO_MODE=true');
  }

  clearDemoSession();
  const tenantId = opts?.tenantId ?? TENANT_CENTRO;

  setDemoSession({
    role,
    patientId: role === 'paciente' ? DEMO_PATIENT_LOGIN_ID : undefined,
    tenantId: role === 'admin' ? tenantId : undefined,
    ephemeral: opts?.ephemeral ?? false
  });

  await establishDemoSession(role);
  return role === 'admin' ? '/admin' : '/paciente';
}
