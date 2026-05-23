import type { ClinicalReport } from '@/types/demo';

export type ClinicalReportRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id?: string | null;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  recommendations?: string | null;
  file_name?: string | null;
  file_url?: string | null;
  mime_type?: string | null;
  uploaded_by?: string | null;
  visible_to_patient: boolean;
  created_at?: string | null;
};

export function mapClinicalReportRow(row: ClinicalReportRow, tenantId?: string): ClinicalReport {
  return {
    id: row.id,
    tenantId: tenantId ?? row.tenant_id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id ?? undefined,
    title: row.title,
    description: row.description ?? '',
    diagnosis: row.diagnosis ?? undefined,
    recommendations: row.recommendations ?? undefined,
    fileName: row.file_name ?? undefined,
    fileRef: row.file_url ?? undefined,
    mimeType: row.mime_type ?? undefined,
    uploadedBy: row.uploaded_by ?? 'Admin clínica',
    visibleToPatient: Boolean(row.visible_to_patient),
    createdAt: String(row.created_at ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  };
}
