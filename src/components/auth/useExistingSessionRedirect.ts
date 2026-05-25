import { useEffect } from 'react';
import type { SessionUser } from '@/lib/auth';
import { ensureAdminAccessBeforeRedirect } from '@/lib/clinicCenters';
import {
  canAccessClinicPanel,
  homePathForPortal,
  inferSessionPortal,
  postLoginPathForUser
} from '@/lib/auth/sessionPortal';
import { getLoginNextParam, isPatientPortalPath, isSafeInternalPath } from '@/lib/loginIntent';

type MeData = {
  role?: string;
  baseRole?: SessionUser['role'];
  clinicId?: string;
  staffRole?: string;
  sessionPortal?: SessionUser['sessionPortal'];
  platformInspect?: boolean;
};

function resolveDest(data: MeData, forced: 'admin' | 'patient' | undefined): string | null {
  const baseRole = data.baseRole ?? data.role;
  if (!baseRole) return null;

  const portal = inferSessionPortal({
    role: baseRole,
    clinicId: data.clinicId,
    sessionPortal: data.sessionPortal,
    platformInspect: false
  });

  if (portal === 'platform' && forced !== 'patient' && forced !== 'admin') return '/platform';
  if (portal === 'patient' || baseRole === 'patient') return '/paciente';

  const next = getLoginNextParam();
  if (next && isSafeInternalPath(next)) {
    if (isPatientPortalPath(next) && baseRole === 'patient') return next;
    if (forced === 'admin' && next.startsWith('/admin')) return next;
  }

  if (forced === 'patient') return '/paciente';
  if (forced === 'admin') {
    if (
      !canAccessClinicPanel({
        role: baseRole as SessionUser['role'],
        clinicId: data.clinicId,
        staffRole: data.staffRole,
        sessionPortal: data.sessionPortal,
        platformInspect: false
      })
    ) {
      return null;
    }
    return postLoginPathForUser(
      {
        role: baseRole as 'admin' | 'super_admin' | 'patient',
        clinicId: data.clinicId,
        sessionPortal: data.sessionPortal,
        platformInspect: false
      },
      { preferAdmin: true }
    );
  }

  return homePathForPortal(portal, data.clinicId);
}

/** Si ya hay cookie de sesión, salir del formulario de login (evita bucles). */
export function useExistingSessionRedirect(forcedRole?: 'admin' | 'patient') {
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: MeData };
        const data = json.data;
        if (!data) return;

        const dest = resolveDest(data, forcedRole);
        if (!dest) return;

        if (dest.startsWith('/admin')) {
          await ensureAdminAccessBeforeRedirect(dest);
        }
        window.location.replace(dest);
      } catch {
        /* sin sesión */
      }
    })();
  }, [forcedRole]);
}
