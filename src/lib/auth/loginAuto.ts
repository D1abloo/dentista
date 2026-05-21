import type { LoginProductionResult } from '@/lib/auth/loginResolve';
import { resolveProductionLogin } from '@/lib/auth/loginResolve';

/** Inicio de sesión único: si hay varios portales, devuelve elección; si no, sesión directa. */
export async function loginAutoDetect(
  email: string,
  password: string
): Promise<LoginProductionResult | null> {
  return resolveProductionLogin({ email, password, role: 'auto' });
}
