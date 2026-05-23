import { mapClinicalReportRow, type ClinicalReportRow } from '@/lib/records/clinicalReportMapper';
import { logInfo } from '@/lib/logger';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

type ReportInput = {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  title: string;
  description: string;
  diagnosis?: string;
  recommendations?: string;
  fileName?: string;
  fileRef?: string;
  mimeType?: string;
  uploadedBy: string;
  visibleToPatient: boolean;
};

type DocumentInput = {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  type: string;
  title: string;
  description?: string;
  fileName?: string;
  fileRef?: string;
  mimeType?: string;
  visibility: 'paciente' | 'admin';
};

type MessageInput = {
  clinicId: string;
  patientId: string;
  subject: string;
  body: string;
  channel: 'app' | 'email' | 'whatsapp' | 'sms';
  type: 'recordatorio' | 'confirmacion' | 'clinica' | 'general' | 'factura' | 'documento';
};

type ConsentInput = {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  treatmentName: string;
  title: string;
  body: string;
  requiredForPortal: boolean;
  fileRef?: string;
  fileName?: string;
};

async function resolveTenantId(clinicId: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('clinics').select('tenant_id').eq('id', clinicId).single();
  if (error || !data?.tenant_id) throw error ?? new Error('Clínica sin tenant_id.');
  return data.tenant_id as string;
}

async function resolvePatientProfileId(patientId: string) {
  const db = getSupabaseAdmin();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('id', patientId)
    .maybeSingle();
  if (profile?.id && profile.role === 'patient') return profile.id as string;

  const { data: legacy } = await db.from('patients').select('id').eq('id', patientId).maybeSingle();
  if (legacy?.id) {
    const { data: linked } = await db
      .from('profiles')
      .select('id')
      .eq('id', patientId)
      .eq('role', 'patient')
      .maybeSingle();
    if (linked?.id) return linked.id as string;
    return legacy.id as string;
  }

  throw new Error(
    'Paciente no encontrado. Usa el perfil del paciente vinculado a la clínica (recarga el panel si acabas de crearlo).'
  );
}

function mapInsertError(error: { message?: string; code?: string; details?: string }) {
  const msg = error.message ?? 'Error al insertar informe.';
  if (msg.includes('tenant_id') || error.code === '42703') {
    return `${msg} — Ejecuta la migración supabase/migrations/0012_clinical_reports_align.sql en tu proyecto.`;
  }
  if (msg.includes('foreign key') || msg.includes('patient_id')) {
    return 'El paciente o la cita no son válidos para esta clínica. Vuelve a seleccionar paciente y cita.';
  }
  return msg;
}

async function notifyPatientNewReport(
  tenantId: string,
  patientId: string,
  title: string,
  description: string
) {
  const db = getSupabaseAdmin();
  const { error } = await db.from('messages').insert({
    tenant_id: tenantId,
    patient_id: patientId,
    subject: `Nuevo informe disponible: ${title}`,
    body: description.slice(0, 2000),
    channel: 'app',
    type: 'clinica',
    read: false
  });
  if (error) {
    logInfo('records.report.notify_failed', { patientId, message: error.message });
  }
}

export async function createClinicalReportRecord(input: ReportInput) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const patientProfileId = await resolvePatientProfileId(input.patientId);
  const reportId = crypto.randomUUID();

  if (import.meta.env.DEV) {
    logInfo('records.report.create', {
      patientId: patientProfileId,
      clinicId: input.clinicId,
      tenantId,
      visibleToPatient: input.visibleToPatient,
      title: input.title
    });
  }

  const row: Record<string, unknown> = {
    id: reportId,
    tenant_id: tenantId,
    patient_id: patientProfileId,
    appointment_id: input.appointmentId ?? null,
    title: input.title,
    description: input.description,
    diagnosis: input.diagnosis ?? null,
    recommendations: input.recommendations ?? null,
    file_name: input.fileName ?? null,
    file_url: input.fileRef ?? null,
    mime_type: input.mimeType ?? null,
    uploaded_by: input.uploadedBy,
    visible_to_patient: input.visibleToPatient
  };

  const { data, error } = await db.from('clinical_reports').insert(row).select('*').single();
  if (error) throw new Error(mapInsertError(error));

  if (input.visibleToPatient) {
    try {
      await notifyPatientNewReport(tenantId, patientProfileId, input.title, input.description);
    } catch (notifyErr) {
      logInfo('records.report.notify_skipped', {
        patientId: patientProfileId,
        message: notifyErr instanceof Error ? notifyErr.message : String(notifyErr)
      });
    }
  }

  if (import.meta.env.DEV && data) {
    logInfo('records.report.created', {
      reportId: data.id,
      patientId: data.patient_id,
      visibleToPatient: data.visible_to_patient
    });
  }

  return data as ClinicalReportRow;
}

export { mapClinicalReportRow };

export async function toggleClinicalReportVisibility(clinicId: string, id: string, visibleToPatient: boolean) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(clinicId);
  const { data, error } = await db
    .from('clinical_reports')
    .update({ visible_to_patient: visibleToPatient })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createPatientDocumentRecord(input: DocumentInput) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const { data, error } = await db
    .from('patient_documents')
    .insert({
      tenant_id: tenantId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId ?? null,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      file_name: input.fileName ?? null,
      file_url: input.fileRef ?? null,
      mime_type: input.mimeType ?? null,
      visibility: input.visibility
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createPatientMessageRecord(input: MessageInput) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const { data, error } = await db
    .from('messages')
    .insert({
      tenant_id: tenantId,
      patient_id: input.patientId,
      subject: input.subject,
      body: input.body,
      channel: input.channel,
      type: input.type,
      read: false
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createInformedConsentRecord(input: ConsentInput) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const { data, error } = await db
    .from('informed_consents')
    .insert({
      tenant_id: tenantId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId ?? null,
      treatment_name: input.treatmentName,
      title: input.title,
      body: input.body,
      status: 'pendiente',
      required_for_portal: input.requiredForPortal,
      file_url: input.fileRef ?? null,
      file_name: input.fileName ?? null
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function signInformedConsentRecord(input: {
  clinicId: string;
  consentId: string;
  signatureRef: string;
  fileRef?: string;
  fileName?: string;
}) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const { data, error } = await db
    .from('informed_consents')
    .update({
      status: 'firmado',
      signature_ref: input.signatureRef,
      file_url: input.fileRef ?? null,
      file_name: input.fileName ?? null,
      signed_at: new Date().toISOString()
    })
    .eq('id', input.consentId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
