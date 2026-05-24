import { format } from 'date-fns';
import type { SessionUser } from '@/lib/auth';
import { createEmptyDemoState } from '@/lib/emptyState';
import { logInfo } from '@/lib/logger';
import { listScheduleBlocksForClinics } from '@/lib/services/scheduleBlocks';
import { listAssignedClinicIdsForSession } from '@/lib/services/staffContext';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import type { AppointmentStatus, DemoState, InvoiceStatus } from '@/types/demo';

function mapApptStatus(status: string): AppointmentStatus {
  const map: Record<string, AppointmentStatus> = {
    pending: 'pendiente',
    confirmed: 'confirmada',
    completed: 'completada',
    cancelled: 'cancelada',
    no_show: 'no_asistio'
  };
  return map[status] ?? 'pendiente';
}

function mapInvoiceStatus(status: string): InvoiceStatus {
  const map: Record<string, InvoiceStatus> = {
    draft: 'pendiente',
    issued: 'pendiente',
    paid: 'pagada',
    overdue: 'vencida'
  };
  return map[status] ?? 'pendiente';
}

export async function loadClinicDemoState(user: SessionUser): Promise<DemoState> {
  if (!user.clinicId) return createEmptyDemoState();

  const db = getSupabaseAdmin();
  const { data: anchorClinic } = await db.from('clinics').select('*').eq('id', user.clinicId).single();
  if (!anchorClinic) return createEmptyDemoState();

  const assignedClinicIds = await listAssignedClinicIdsForSession(user);
  const activeClinicId = user.clinicId;
  const { data: assignedRows } = await db.from('clinics').select('*').in('id', assignedClinicIds);
  const clinicRows = (assignedRows ?? []).length ? assignedRows! : [anchorClinic];
  const clinicIds = [activeClinicId];
  const tenantId = anchorClinic.tenant_id ?? user.tenantId ?? user.clinicId;
  const tenantHint = anchorClinic.tenant_id ?? tenantId;
  if (!clinicIds.length) return createEmptyDemoState();

  const [
    { data: rooms },
    { data: dentists },
    { data: treatments },
    { data: profiles },
    { data: appointments },
    { data: invoices },
    { data: payments },
    { data: reports },
    { data: documents },
    { data: messages },
    { data: consents }
  ] = await Promise.all([
    db.from('rooms').select('*').eq('clinic_id', activeClinicId),
    db.from('dentists').select('*').eq('clinic_id', activeClinicId),
    db.from('treatments').select('*').eq('clinic_id', activeClinicId),
    db.from('profiles').select('*').eq('clinic_id', activeClinicId),
    db.from('appointments_view').select('*').eq('clinic_id', activeClinicId).order('starts_at'),
    db.from('invoices').select('*').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }),
    db.from('payments').select('*').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }),
    db.from('clinical_reports').select('*').eq('tenant_id', tenantHint).order('created_at', { ascending: false }),
    db.from('patient_documents').select('*').eq('tenant_id', tenantHint).order('created_at', { ascending: false }),
    db.from('messages').select('*').eq('tenant_id', tenantHint).order('created_at', { ascending: false }),
    db.from('informed_consents').select('*').eq('tenant_id', tenantHint).order('created_at', { ascending: false })
  ]);

  let tenantRow: Record<string, unknown> | null = null;
  if (anchorClinic.tenant_id) {
    const { data } = await db.from('tenants').select('*').eq('id', anchorClinic.tenant_id).maybeSingle();
    tenantRow = data;
  }

  const mainClinic = clinicRows.find((c) => c.is_main_branch) ?? clinicRows[0];

  const state = createEmptyDemoState();

  state.tenants = tenantRow
    ? [
        {
          id: String(tenantRow.id),
          name: String(tenantRow.name ?? mainClinic.name),
          type: (tenantRow.type as 'dentista' | 'clinica') ?? 'clinica',
          ownerName: String(tenantRow.owner_name ?? mainClinic.name),
          email: String(tenantRow.email ?? mainClinic.email ?? ''),
          phone: String(tenantRow.phone ?? mainClinic.phone ?? ''),
          address: String(tenantRow.address ?? mainClinic.address ?? ''),
          active: Boolean(tenantRow.active ?? true),
          createdAt: String(tenantRow.created_at ?? new Date().toISOString()).slice(0, 10)
        }
      ]
    : [
        {
          id: tenantId,
          name: mainClinic.name,
          type: 'clinica',
          ownerName: mainClinic.name,
          email: mainClinic.email ?? '',
          phone: mainClinic.phone ?? '',
          address: mainClinic.address ?? '',
          active: mainClinic.status === 'active',
          createdAt: String(mainClinic.created_at ?? '').slice(0, 10)
        }
      ];

  const roomsByClinic = new Map<string, typeof rooms>();
  for (const r of rooms ?? []) {
    const list = roomsByClinic.get(r.clinic_id) ?? [];
    list.push(r);
    roomsByClinic.set(r.clinic_id, list);
  }

  state.clinics = clinicRows.map((clinic) => ({
    id: clinic.id,
    tenantId: (clinic.tenant_id as string) ?? tenantId,
    name: clinic.name,
    address: clinic.address ?? '',
    city: clinic.city ?? 'Madrid',
    phone: clinic.phone ?? '',
    email: clinic.email ?? '',
    whatsapp: clinic.phone ?? '',
    openingHours: 'Lun–Vie 09:00–20:00',
    active: clinic.status === 'active',
    isMainBranch: Boolean(clinic.is_main_branch),
    cabinets: (roomsByClinic.get(clinic.id) ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      equipment: 'General',
      active: r.active
    }))
  }));

  state.dentists = (dentists ?? []).map((d) => {
    const mapped = {
      id: d.id,
      clinicId: d.clinic_id as string,
      profileId: d.profile_id ?? undefined,
      tenantId: tenantHint,
      fullName: d.name,
      specialty: d.specialty,
      visibleTitle: (d.visible_title as string | null) ?? undefined,
      collegiateNumber: (d.collegiate_number as string | null) ?? undefined,
      professionalCollege: (d.professional_college as string | null) ?? undefined,
      secondarySpecialties: (d.secondary_specialties as string[] | null) ?? [],
      languages: (d.languages as string[] | null) ?? [],
      reportBio: (d.report_bio as string | null) ?? undefined,
      agendaColor: (d.agenda_color as string | null) ?? '#14b8a6',
      photoRef: (d.photo_url as string | null) ?? undefined,
      signatureRef: (d.signature_url as string | null) ?? undefined,
      email: (d.email as string | null)?.trim() || `${d.id.slice(0, 8)}@clinic.local`,
      phone: (d.phone as string | null)?.trim() || mainClinic.phone || '',
      schedule: 'Lun–Vie 09:00–17:00',
      active: d.active,
      profileCompletion: (d.profile_completion as number | null) ?? undefined,
      updatedAt: (d.updated_at as string | null) ?? undefined
    };
    return mapped;
  });

  state.treatments = (treatments ?? []).map((t) => ({
    id: t.id,
    clinicId: t.clinic_id as string,
    tenantId: tenantHint,
    name: t.name,
    description: t.description ?? '',
    durationMinutes: t.duration_minutes,
    price: Math.round((t.price_cents ?? 0) / 100),
    active: t.active
  }));

  const patientProfiles = (profiles ?? []).filter((p) => p.role === 'patient');
  state.patients = patientProfiles.map((p) => ({
    id: p.id,
    nhc: (p.nhc as string | null) ?? undefined,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone ?? '',
    dni: (p.dni as string | null) ?? undefined,
    preferredClinicId: p.clinic_id ?? mainClinic.id,
    createdAt: String(p.created_at ?? '').slice(0, 10)
  }));

  let appts = (appointments ?? []).map((a) => {
    const starts = new Date(a.starts_at);
    return {
      id: a.id,
      tenantId,
      patientId: a.patient_id,
      dentistId: a.dentist_id,
      clinicId: a.clinic_id,
      treatmentId: a.treatment_id,
      cabinetId: (rooms ?? [])[0]?.id ?? 'room-1',
      date: format(starts, 'yyyy-MM-dd'),
      time: format(starts, 'HH:mm'),
      status: mapApptStatus(a.status),
      notes: a.notes ?? '',
      createdAt: format(starts, 'yyyy-MM-dd')
    };
  });

  if (user.role === 'patient' && user.patientId) {
    appts = appts.filter((a) => a.patientId === user.patientId);
    state.patients = state.patients.filter((p) => p.id === user.patientId);
  }

  state.appointments = appts;

  state.invoices = (invoices ?? [])
    .filter((i) => user.role !== 'patient' || i.patient_id === user.patientId)
    .map((i) => ({
      id: i.id,
      tenantId,
      patientId: i.patient_id,
      appointmentId: i.appointment_id ?? undefined,
      amount: Math.round((i.amount_cents ?? 0) / 100),
      concept: i.concept ?? 'Servicios odontológicos',
      status: mapInvoiceStatus(i.status),
      issuedAt: String(i.created_at ?? '').slice(0, 10),
      dueDate: i.due_at ? String(i.due_at).slice(0, 10) : undefined
    }));

  state.payments = (payments ?? [])
    .filter((p) => user.role !== 'patient' || p.patient_id === user.patientId)
    .map((p) => ({
      id: p.id,
      tenantId,
      patientId: p.patient_id,
      invoiceId: p.invoice_id ?? undefined,
      amount: Math.round((p.amount_cents ?? 0) / 100),
      method: p.provider === 'stripe' ? 'tarjeta' : 'otro',
      status: p.status === 'paid' ? 'completado' : p.status === 'pending' ? 'pendiente' : 'fallido',
      paidAt: p.created_at ? String(p.created_at).slice(0, 10) : undefined,
      createdAt: String(p.created_at ?? '').slice(0, 10)
    }));

  const reportRows = (reports ?? []).filter(
    (r) => user.role !== 'patient' || (r.patient_id === user.patientId && r.visible_to_patient)
  );

  if (import.meta.env.DEV && user.role === 'patient') {
    logInfo('bootstrap.patient_reports', {
      sessionPatientId: user.patientId,
      tenantId: tenantHint,
      totalInDb: reports?.length ?? 0,
      visibleForPatient: reportRows.length,
      reportIds: reportRows.map((r) => r.id)
    });
  }

  state.clinicalReports = reportRows.map((r) => ({
      id: r.id,
      tenantId,
      patientId: r.patient_id,
      appointmentId: r.appointment_id ?? undefined,
      title: r.title,
      description: r.description ?? '',
      diagnosis: r.diagnosis ?? undefined,
      recommendations: r.recommendations ?? undefined,
      fileName: r.file_name ?? undefined,
      fileRef: r.file_url ?? undefined,
      mimeType: r.mime_type ?? undefined,
      uploadedBy: r.uploaded_by ?? 'Admin clínica',
      visibleToPatient: Boolean(r.visible_to_patient),
      lockedAt: r.locked_at ?? (r.visible_to_patient ? String(r.created_at ?? '') : undefined),
      reopenedForEdit: Boolean(r.reopened_for_edit),
      createdAt: String(r.created_at ?? '').slice(0, 10)
    }));

  state.patientDocuments = (documents ?? [])
    .filter((d) => user.role !== 'patient' || (d.patient_id === user.patientId && d.visibility === 'paciente'))
    .map((d) => ({
      id: d.id,
      tenantId,
      patientId: d.patient_id,
      appointmentId: d.appointment_id ?? undefined,
      type: d.type,
      title: d.title,
      description: d.description ?? undefined,
      fileName: d.file_name ?? undefined,
      fileRef: d.file_url ?? undefined,
      mimeType: d.mime_type ?? undefined,
      visibility: d.visibility,
      createdAt: String(d.created_at ?? '').slice(0, 10)
    }));

  state.messages = (messages ?? [])
    .filter((m) => user.role !== 'patient' || m.patient_id === user.patientId)
    .map((m) => ({
      id: m.id,
      tenantId,
      patientId: m.patient_id,
      subject: m.subject,
      body: m.body,
      channel: m.channel ?? 'app',
      type: m.type ?? 'clinica',
      read: Boolean(m.read),
      fromPatient: Boolean(m.from_patient),
      sentAt: String(m.created_at ?? '').slice(0, 10)
    }));

  state.informedConsents = (consents ?? [])
    .filter((c) => user.role !== 'patient' || c.patient_id === user.patientId)
    .map((c) => ({
      id: c.id,
      tenantId,
      patientId: c.patient_id,
      appointmentId: c.appointment_id ?? undefined,
      treatmentName: c.treatment_name,
      title: c.title,
      body: c.body,
      status: c.status === 'firmado' ? 'firmado' : 'pendiente',
      requiredForPortal: Boolean(c.required_for_portal),
      fileRef: c.file_url ?? undefined,
      fileName: c.file_name ?? undefined,
      signatureRef: c.signature_ref ?? undefined,
      signedAt: c.signed_at ? String(c.signed_at).slice(0, 10) : undefined,
      createdAt: String(c.created_at ?? '').slice(0, 10)
    }));

  try {
    const blocks = await listScheduleBlocksForClinics(clinicIds);
    state.blockedSlots = blocks.map((b) => ({
      id: b.id,
      tenantId,
      clinicId: b.clinicId,
      dentistId: b.dentistId,
      dentistIds: b.dentistIds,
      cabinetId: state.clinics.find((c) => c.id === b.clinicId)?.cabinets[0]?.id ?? 'room-1',
      date: b.date,
      time: b.time,
      endTime: b.endTime,
      reason: b.reason,
      blockGroupId: b.blockGroupId,
      allDay: b.allDay
    }));
  } catch {
    state.blockedSlots = [];
  }

  state.settingsByTenant = {
    [tenantId]: {
      clinicName: mainClinic.name,
      tagline: 'Gestión dental premium',
      legalName: mainClinic.name,
      phone: mainClinic.phone ?? '',
      email: mainClinic.email ?? '',
      whatsapp: mainClinic.phone ?? '',
      address: mainClinic.address ?? '',
      city: mainClinic.city ?? 'Madrid',
      imageUrl: '/images/logo.webp',
      generalHours: 'Lun–Vie 09:00–20:00',
      defaultDuration: 45,
      slotIntervalMinutes: 15,
      minCancelHours: 24,
      remindersEnabled: true,
      welcomeMessage: `Bienvenido a ${mainClinic.name}`,
      appointmentConfirmMessage: 'Cita registrada correctamente.',
      primaryColor: '#2d8b7d',
      accentColor: '#2d8b7d',
      openTime: '08:30',
      closeTime: '20:00',
      workDays: [1, 2, 3, 4, 5],
      website: '',
      instagram: '',
      facebook: '',
      nif: 'B00000000',
      vatRate: 21,
      invoiceSeries: 'FAC',
      defaultInvoiceConcept: 'Servicios odontológicos',
      logoUrl: (mainClinic.logo_url as string | null) || '/images/logo.webp'
    }
  };

  state.clinicNotifications = state.clinicNotifications ?? [];

  return state;
}
