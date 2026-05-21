import type { APIRoute } from 'astro';
import { getPortalAccessSession, portalAccessCookieName } from '@/lib/auth/portalAccess';
import { getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { listTokensForStaff } from '@/lib/services/portalAccess';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  const pdp = getPortalAccessSession(cookies);

  if (pdp) {
    return ok({
      active: true,
      patientId: pdp.patientId,
      patientName: pdp.patientName,
      staffProfileId: pdp.staffProfileId,
      tokenId: pdp.tokenId,
      targetClinicId: pdp.targetClinicId
    });
  }

  if (!user?.profileId || !hasSupabaseConfig()) {
    return ok({ active: false, tokens: [] });
  }

  try {
    const tokens = await listTokensForStaff(user.profileId);
    return ok({ active: false, tokens });
  } catch {
    return ok({ active: false, tokens: [] });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete(portalAccessCookieName, { path: '/' });
  return ok({ closed: true });
};
