import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LifeBuoy,
  Lock,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Button, Card, Empty, Field, Input, Select, Textarea } from '@/components/ui';
import type {
  ClinicRegistration,
  PlatformClinic,
  PlatformOrganization,
  PlatformOverview,
  PlatformSubscription,
} from '@/lib/platform/types';
import { PlatformShell } from './PlatformShell';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...init?.headers } });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

export { PlatformDashboard } from './PlatformDashboard';

export { PlatformClinics } from './PlatformClinics';

export { PlatformRegistrations } from './PlatformRegistrations';

export { PlatformSupport } from './PlatformSupport';

export { PlatformRegistrationHistory } from './PlatformRegistrationHistory';

export { PlatformSubscriptions } from './PlatformSubscriptions';

export { PlatformIsolation } from './PlatformIsolation';

export { PlatformSettings } from './PlatformSettings';

export { PlatformMetrics } from './PlatformMetrics';

export { PlatformSecurity } from './PlatformSecurity';

export { PlatformOrganizations } from './PlatformOrganizations';

