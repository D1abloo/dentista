import { format } from 'date-fns';
import type { SessionUser } from '@/lib/auth';
import { createEmptyDemoState } from '@/lib/emptyState';
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
  const clinicId = user.clinicId;

  const [
    { data: clinic },
    { data: rooms },
    { data: dentists },
    { data: treatments },
    { data: profiles },
    { data: appointments },
    { data: invoices }
  ] = await Promise.all([
    db.from('clinics').select('*').eq('id', clinicId).single(),
    db.from('rooms').select('*').eq('clinic_id', clinicId),
    db.from('dentists').select('*').eq('clinic_id', clinicId),
    db.from('treatments').select('*').eq('clinic_id', clinicId),
    db.from('profiles').select('*').eq('clinic_id', clinicId),
    db.from('appointments_view').select('*').eq('clinic_id', clinicId).order('starts_at'),
    db.from('invoices').select('*').eq('clinic_id', clinicId).order('created_at', { ascending: false })
  ]);

  if (!clinic) return createEmptyDemoState();

  let tenantRow: Record<string, unknown> | null = null;
  if (clinic.tenant_id) {
    const { data } = await db.from('tenants').select('*').eq('id', clinic.tenant_id).maybeSingle();
    tenantRow = data;
  }

  const tenantId = user.tenantId ?? clinic.tenant_id ?? clinicId;

  const state = createEmptyDemoState();

  state.tenants = tenantRow
    ? [
        {
          id: String(tenantRow.id),
          name: String(tenantRow.name ?? clinic.name),
          type: (tenantRow.type as 'dentista' | 'clinica') ?? 'clinica',
          ownerName: String(tenantRow.owner_name ?? clinic.name),
          email: String(tenantRow.email ?? clinic.email ?? ''),
          phone: String(tenantRow.phone ?? clinic.phone ?? ''),
          address: String(tenantRow.address ?? clinic.address ?? ''),
          active: Boolean(tenantRow.active ?? true),
          createdAt: String(tenantRow.created_at ?? new Date().toISOString()).slice(0, 10)
        }
      ]
    : [
        {
          id: tenantId,
          name: clinic.name,
          type: 'clinica',
          ownerName: clinic.name,
          email: clinic.email ?? '',
          phone: clinic.phone ?? '',
          address: clinic.address ?? '',
          active: clinic.status === 'active',
          createdAt: String(clinic.created_at ?? '').slice(0, 10)
        }
      ];

  state.clinics = [
    {
      id: clinic.id,
      tenantId,
      name: clinic.name,
      address: clinic.address ?? '',
      city: 'Madrid',
      phone: clinic.phone ?? '',
      email: clinic.email ?? '',
      whatsapp: clinic.phone ?? '',
      openingHours: 'Lun–Vie 09:00–20:00',
      active: clinic.status === 'active',
      cabinets: (rooms ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        equipment: 'General',
        active: r.active
      }))
    }
  ];

  state.dentists = (dentists ?? []).map((d) => ({
    id: d.id,
    tenantId,
    fullName: d.name,
    specialty: d.specialty,
    email: `${d.id.slice(0, 8)}@clinic.local`,
    phone: clinic.phone ?? '',
    schedule: 'Lun–Vie 09:00–17:00',
    active: d.active
  }));

  state.treatments = (treatments ?? []).map((t) => ({
    id: t.id,
    tenantId,
    name: t.name,
    description: t.description ?? '',
    durationMinutes: t.duration_minutes,
    price: Math.round((t.price_cents ?? 0) / 100),
    active: t.active
  }));

  const patientProfiles = (profiles ?? []).filter((p) => p.role === 'patient');
  state.patients = patientProfiles.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone ?? '',
    preferredClinicId: clinicId,
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
      concept: 'Servicios odontológicos',
      status: mapInvoiceStatus(i.status),
      issuedAt: String(i.created_at ?? '').slice(0, 10),
      dueDate: i.due_at ? String(i.due_at).slice(0, 10) : undefined
    }));

  state.settingsByTenant = {
    [tenantId]: {
      clinicName: clinic.name,
      tagline: 'Gestión dental premium',
      legalName: clinic.name,
      phone: clinic.phone ?? '',
      email: clinic.email ?? '',
      whatsapp: clinic.phone ?? '',
      address: clinic.address ?? '',
      city: 'Madrid',
      imageUrl: '/brand/dentista-logo.svg',
      generalHours: 'Lun–Vie 09:00–20:00',
      defaultDuration: 45,
      slotIntervalMinutes: 15,
      minCancelHours: 24,
      remindersEnabled: true,
      welcomeMessage: `Bienvenido a ${clinic.name}`,
      appointmentConfirmMessage: 'Cita registrada correctamente.',
      primaryColor: '#2563EB',
      accentColor: '#14B8A6',
      nif: 'B00000000',
      vatRate: 21,
      invoiceSeries: 'FAC',
      defaultInvoiceConcept: 'Servicios odontológicos',
      logoUrl: '/brand/dentista-logo.svg'
    }
  };

  return state;
}
