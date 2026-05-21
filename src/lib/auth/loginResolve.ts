import type { SessionUser } from '@/lib/auth';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { completePortalLogin, displayNameFromIdentity } from '@/lib/auth/loginComplete';
import {
  authenticateCredentials,
  filterChoicesForClinicLogin,
  listPortalChoices,
  type PortalChoiceOption
} from '@/lib/auth/portalChoices';
import type { LoginInput } from '@/lib/validators';

export type PortalChoiceLoginResult = {
  choosePortal: true;
  email: string;
  name: string;
  options: PortalChoiceOption[];
};

export type LoginProductionResult = Omit<SessionUser, 'expiresAt'> | PortalChoiceLoginResult;

export function isPortalChoiceLogin(
  result: LoginProductionResult
): result is PortalChoiceLoginResult {
  return 'choosePortal' in result && result.choosePortal === true;
}

export async function resolveProductionLogin(input: LoginInput): Promise<LoginProductionResult | null> {
  const identity = await authenticateCredentials(input.email, input.password);
  if (!identity) return null;

  if (input.role === 'admin' || input.role === 'patient') {
    const clinicOptions = filterChoicesForClinicLogin(await listPortalChoices(identity));
    if (clinicOptions.length > 1) {
      return {
        choosePortal: true,
        email: identity.email,
        name: displayNameFromIdentity(identity),
        options: clinicOptions
      };
    }
    const wanted = input.role === 'patient' ? 'patient' : 'admin';
    const match = clinicOptions.find((o) => o.id === wanted);
    if (!match) return null;
    const user = await completePortalLogin(identity, match.id);
    return user;
  }

  const options = await listPortalChoices(identity);
  if (options.length > 1) {
    return {
      choosePortal: true,
      email: identity.email,
      name: displayNameFromIdentity(identity),
      options
    };
  }
  if (options.length === 1) {
    return completePortalLogin(identity, options[0].id);
  }

  return null;
}

export async function resolveProductionLoginWithPortal(
  input: LoginInput,
  portal: 'admin' | 'patient' | 'platform'
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const identity = await authenticateCredentials(input.email, input.password);
  if (!identity) return null;
  try {
    return await completePortalLogin(identity, portal);
  } catch (err) {
    if (err instanceof AccountNotActivatedError) throw err;
    return null;
  }
}
