import type { ClinicalReport } from '@/types/demo';

/** Informe bloqueado tras publicación en portal; solo editable si BBDD marca reopenedForEdit. */
export function isClinicalReportEditable(report: ClinicalReport): boolean {
  if (report.reopenedForEdit) return true;
  return !report.lockedAt;
}

export function applyReportPublishLock(report: ClinicalReport, visibleToPatient: boolean): ClinicalReport {
  if (!visibleToPatient) return report;
  return {
    ...report,
    lockedAt: report.lockedAt ?? new Date().toISOString(),
    reopenedForEdit: false
  };
}
