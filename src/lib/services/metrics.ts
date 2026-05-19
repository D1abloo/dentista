import {
  adminMetrics,
  adminModules,
  appointments,
  campaigns,
  chartRevenue,
  integrations,
  notifications,
  reviews,
  rolePermissions,
  rooms,
  systemLogs,
  treatmentShare,
  waitingQueue
} from '../data';
import { getCached } from '../cache';

export async function getAdminMetrics(clinicId: string) {
  const ttl = Number(import.meta.env.CACHE_TTL_SECONDS ?? 60);
  return getCached(`clinic:${clinicId}:admin-metrics`, ttl, async () => ({
    cards: adminMetrics,
    revenue: chartRevenue,
    treatmentShare,
    waitingQueue,
    notifications,
    appointments: appointments.filter((item) => item.clinicId === clinicId).slice(0, 8),
    modules: adminModules,
    rooms: rooms.filter((item) => item.clinicId === clinicId),
    reviews: reviews.filter((item) => item.clinicId === clinicId),
    campaigns: campaigns.filter((item) => item.clinicId === clinicId),
    logs: systemLogs.filter((item) => item.clinicId === clinicId),
    rolePermissions: rolePermissions.filter((item) => item.clinicId === clinicId),
    integrations: integrations.filter((item) => item.clinicId === clinicId),
    computedAt: new Date().toISOString()
  }));
}
