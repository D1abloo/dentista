import { useEffect, useState } from 'react';
import { getStaffProfile } from '@/lib/organization';
import { getStaffAvatarUrl } from '@/lib/staffAvatar';
import { getStoredTenantId } from '@/lib/demoStore';
import { useStaffContext } from '@/hooks/useStaffContext';

export type AdminSessionInfo = {
  displayName: string;
  email: string;
  roleLabel: string;
  initials: string;
  avatarUrl: string | null;
};

function initialsFrom(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function roleLabelFrom(staffRole?: string) {
  if (staffRole === 'recepcion') return 'Recepción';
  if (staffRole === 'super_admin') return 'Super admin';
  if (staffRole === 'admin') return 'Administrador';
  return 'Panel clínica';
}

export function useAdminSession(fallbackName = 'Usuario conectado') {
  const tenantId = getStoredTenantId();
  const { staff } = useStaffContext();
  const [info, setInfo] = useState<AdminSessionInfo>(() => {
    const staffLocal = getStaffProfile(tenantId);
    const name = staffLocal?.fullName?.trim() || fallbackName;
    return {
      displayName: name,
      email: '',
      roleLabel: roleLabelFrom(staff?.role ?? staffLocal?.role),
      initials: initialsFrom(name) || 'AD',
      avatarUrl: getStaffAvatarUrl(tenantId)
    };
  });

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then(
        (j: {
          data?: { name?: string; email?: string; staffRole?: string; role?: string };
        }) => {
          const staffLocal = getStaffProfile(tenantId);
          const name = j.data?.name?.trim() || staffLocal?.fullName?.trim() || fallbackName;
          const email = j.data?.email?.trim() ?? '';
          const role = j.data?.staffRole ?? j.data?.role ?? staff?.role ?? staffLocal?.role;
          setInfo({
            displayName: name,
            email,
            roleLabel: roleLabelFrom(role),
            initials: initialsFrom(name) || 'AD',
            avatarUrl: getStaffAvatarUrl(tenantId)
          });
        }
      )
      .catch(() => {
        const staffLocal = getStaffProfile(tenantId);
        const name = staffLocal?.fullName?.trim() || fallbackName;
        setInfo({
          displayName: name,
          email: '',
          roleLabel: roleLabelFrom(staff?.role ?? staffLocal?.role),
          initials: initialsFrom(name) || 'AD',
          avatarUrl: getStaffAvatarUrl(tenantId)
        });
      });
  }, [tenantId, staff?.role, fallbackName]);

  function refreshAvatar() {
    setInfo((prev) => ({ ...prev, avatarUrl: getStaffAvatarUrl(tenantId) }));
  }

  return { ...info, tenantId, refreshAvatar };
}
