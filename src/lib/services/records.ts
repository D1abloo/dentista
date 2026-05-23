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

export async function createClinicalReportRecord(input: ReportInput) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const tenantId = await resolveTenantId(input.clinicId);
  const { data, error } = await db
    .from('clinical_reports')
    .insert({
      tenant_id: tenantId,
      patient_id: input.patientId,
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
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

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
