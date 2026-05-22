import type { AppSettings, DemoState, NormativeText } from '@/types/demo';
import { TENANT_CENTRO, TENANT_NORTE, TENANT_SUR } from '@/lib/tenantIds';
import {
  DEMO_PATIENT_ID,
  demoAppointments,
  demoClinicalReports,
  demoInformedConsents,
  demoInvoices,
  demoPatientDocuments,
  demoPatients,
  demoPayments
} from '@/data/demoSeedRecords';

/** Fecha ISO relativa a hoy (agenda siempre con citas visibles). */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const defaultNormative = (): NormativeText[] => [
  { id: 'cancelacion', title: 'Política de cancelación', body: 'Cancela con al menos 24 horas de antelación.' },
  { id: 'reprogramacion', title: 'Política de reprogramación', body: 'Reprograma desde el portal si hay disponibilidad.' },
  { id: 'consentimiento', title: 'Consentimiento informado', body: 'Documentación firmada antes de tratamientos.' },
  { id: 'datos', title: 'Protección de datos', body: 'Tus datos se usan solo para gestión clínica.' },
  { id: 'recordatorios', title: 'Recordatorios', body: 'Email, WhatsApp o SMS según preferencias.' },
  { id: 'no_show', title: 'No presentación', body: 'Tres ausencias pueden limitar reservas online.' },
  { id: 'asistencia', title: 'Condiciones de asistencia', body: 'Llega 10 minutos antes de tu cita.' },
  { id: 'urgencias', title: 'Urgencias', body: 'Fuera de horario, acude a urgencias hospitalarias.' },
  {
    id: 'aviso',
    title: 'Aviso médico',
    body: 'Esta app no sustituye el diagnóstico ni tratamiento presencial.'
  }
];

function settings(name: string, address: string, phone: string, email: string): AppSettings {
  return {
    clinicName: name,
    tagline: 'Gestión dental premium',
    legalName: `${name} S.L.`,
    phone,
    email,
    whatsapp: phone,
    address,
    city: 'Madrid',
    imageUrl: '/images/login-dentista-paciente.jpg',
    generalHours: 'Lun–Vie 08:30–20:00',
    defaultDuration: 45,
    slotIntervalMinutes: 15,
    minCancelHours: 24,
    remindersEnabled: true,
    welcomeMessage: 'Bienvenido a tu portal Dentista+',
    appointmentConfirmMessage: 'Cita registrada correctamente.',
    primaryColor: '#0F2742',
    accentColor: '#14B8A6',
    nif: 'B12345678',
    vatRate: 21,
    invoiceSeries: 'FAC',
    defaultInvoiceConcept: 'Servicios odontológicos',
    logoUrl: '/brand/dentista-logo.svg'
  };
}

export const demoSeed: DemoState = {
  tenants: [
    {
      id: TENANT_CENTRO,
      name: 'Clínica Centro',
      type: 'clinica',
      ownerName: 'Dra. Laura Sánchez',
      email: 'centro@dentista.demo',
      phone: '+34 910 100 001',
      address: 'Calle Mayor 12, Madrid',
      active: true,
      createdAt: '2026-01-10'
    },
    {
      id: TENANT_NORTE,
      name: 'Clínica Norte',
      type: 'clinica',
      ownerName: 'Dr. Carlos Ramírez',
      email: 'norte@dentista.demo',
      phone: '+34 910 100 002',
      address: 'Av. del Norte 45, Madrid',
      active: true,
      createdAt: '2026-01-12'
    },
    {
      id: TENANT_SUR,
      name: 'Clínica Sur',
      type: 'clinica',
      ownerName: 'Dra. Elena Martín',
      email: 'sur@dentista.demo',
      phone: '+34 910 100 003',
      address: 'Plaza Sur 8, Madrid',
      active: true,
      createdAt: '2026-01-15'
    }
  ],
  patients: demoPatients,
  dentists: [
    {
      id: 'DEN-0001',
      tenantId: TENANT_CENTRO,
      fullName: 'Dra. Laura Sánchez',
      specialty: 'Ortodoncia',
      email: 'laura@centro.demo',
      phone: '+34 600 201 001',
      schedule: 'Lun–Vie 09:00–17:00',
      active: true
    },
    {
      id: 'DEN-0002',
      tenantId: TENANT_NORTE,
      fullName: 'Dr. Carlos Ramírez',
      specialty: 'Implantología',
      email: 'carlos@norte.demo',
      phone: '+34 600 201 002',
      schedule: 'Lun–Jue 10:00–18:00',
      active: true
    },
    {
      id: 'DEN-0003',
      tenantId: TENANT_SUR,
      fullName: 'Dra. Elena Martín',
      specialty: 'Estética dental',
      email: 'elena@sur.demo',
      phone: '+34 600 201 003',
      schedule: 'Mar–Sáb 09:00–14:00',
      active: true
    },
    {
      id: 'DEN-0004',
      tenantId: TENANT_CENTRO,
      fullName: 'Dr. Pablo Núñez',
      specialty: 'Endodoncia',
      email: 'pablo@centro.demo',
      phone: '+34 600 201 004',
      schedule: 'Lun–Mié 11:00–19:00',
      active: true
    }
  ],
  clinics: [
    {
      id: 'CLI-0001',
      tenantId: TENANT_CENTRO,
      name: 'Clínica Centro',
      address: 'Calle Mayor 12',
      city: 'Madrid',
      phone: '+34 910 100 001',
      email: 'centro@dentista.demo',
      whatsapp: '+34 600 100 001',
      openingHours: 'Lun–Vie 08:30–20:00',
      imageUrl: '/images/login-dentista-paciente.jpg',
      active: true,
      cabinets: [
        { id: 'g-c1', name: 'Gabinete 1', equipment: 'Diagnóstico', active: true },
        { id: 'g-c2', name: 'Gabinete 2', equipment: 'Ortodoncia', active: true }
      ]
    },
    {
      id: 'CLI-0002',
      tenantId: TENANT_NORTE,
      name: 'Clínica Norte',
      address: 'Av. del Norte 45',
      city: 'Madrid',
      phone: '+34 910 100 002',
      email: 'norte@dentista.demo',
      whatsapp: '+34 600 100 002',
      openingHours: 'Lun–Vie 09:00–19:00',
      active: true,
      cabinets: [{ id: 'g-n1', name: 'Gabinete A', equipment: 'Implantología', active: true }]
    },
    {
      id: 'CLI-0003',
      tenantId: TENANT_SUR,
      name: 'Clínica Sur',
      address: 'Plaza Sur 8',
      city: 'Madrid',
      phone: '+34 910 100 003',
      email: 'sur@dentista.demo',
      whatsapp: '+34 600 100 003',
      openingHours: 'Mar–Sáb 09:00–14:00',
      active: true,
      cabinets: [{ id: 'g-s1', name: 'Gabinete único', equipment: 'Estética', active: true }]
    }
  ],
  treatments: [
    { id: 'TRA-0001', tenantId: TENANT_CENTRO, name: 'Limpieza dental', description: 'Higiene profesional', durationMinutes: 45, price: 80, active: true },
    { id: 'TRA-0002', tenantId: TENANT_CENTRO, name: 'Ortodoncia', description: 'Control brackets', durationMinutes: 30, price: 120, active: true },
    { id: 'TRA-0003', tenantId: TENANT_NORTE, name: 'Implantes', description: 'Valoración', durationMinutes: 90, price: 600, active: true },
    { id: 'TRA-0004', tenantId: TENANT_NORTE, name: 'Revisión general', description: 'Chequeo', durationMinutes: 30, price: 55, active: true },
    { id: 'TRA-0005', tenantId: TENANT_SUR, name: 'Blanqueamiento', description: 'Estética', durationMinutes: 60, price: 250, active: true },
    { id: 'TRA-0006', tenantId: TENANT_SUR, name: 'Carillas', description: 'Estética avanzada', durationMinutes: 75, price: 450, active: true }
  ],
  appointments: demoAppointments,
  clinicalReports: demoClinicalReports,
  invoices: demoInvoices,
  payments: demoPayments,
  patientDocuments: demoPatientDocuments,
  adminNotes: [
    {
      id: 'NOT-0001',
      tenantId: TENANT_CENTRO,
      patientId: DEMO_PATIENT_ID,
      body: 'Prefiere recordatorios por WhatsApp.',
      createdAt: '2026-05-10',
      createdBy: 'Recepción Centro'
    },
    {
      id: 'NOT-0002',
      tenantId: TENANT_NORTE,
      patientId: 'PAT-0002',
      body: 'Valoración implantes pendiente de CBCT.',
      createdAt: offsetDate(-5),
      createdBy: 'Recepción Norte'
    }
  ],
  messages: [
    {
      id: 'MSG-0001',
      tenantId: TENANT_CENTRO,
      patientId: DEMO_PATIENT_ID,
      subject: 'Recordatorio de cita',
      body: 'Tu cita de ortodoncia en Clínica Centro está confirmada para hoy.',
      channel: 'whatsapp',
      type: 'recordatorio',
      read: false,
      sentAt: '2026-05-19T09:00:00'
    },
    {
      id: 'MSG-0002',
      tenantId: TENANT_NORTE,
      patientId: DEMO_PATIENT_ID,
      subject: 'Nueva factura',
      body: 'Tienes una factura pendiente de implantes en Clínica Norte.',
      channel: 'app',
      type: 'clinica',
      read: false,
      sentAt: '2026-05-20T10:00:00'
    },
    {
      id: 'MSG-0003',
      tenantId: TENANT_CENTRO,
      patientId: DEMO_PATIENT_ID,
      subject: 'Consentimiento pendiente',
      body: 'Firma el consentimiento de endodoncia antes de tu próxima cita.',
      channel: 'email',
      type: 'clinica',
      read: false,
      sentAt: '2026-05-20T14:00:00'
    },
    {
      id: 'MSG-0004',
      tenantId: TENANT_SUR,
      patientId: DEMO_PATIENT_ID,
      subject: 'Documentos disponibles',
      body: 'Ya puedes descargar el informe de blanqueamiento desde tu portal.',
      channel: 'app',
      type: 'general',
      read: true,
      sentAt: '2026-05-18T11:00:00'
    }
  ],
  settingsByTenant: {
    [TENANT_CENTRO]: settings('Clínica Centro', 'Calle Mayor 12', '+34 910 100 001', 'centro@dentista.demo'),
    [TENANT_NORTE]: settings('Clínica Norte', 'Av. del Norte 45', '+34 910 100 002', 'norte@dentista.demo'),
    [TENANT_SUR]: settings('Clínica Sur', 'Plaza Sur 8', '+34 910 100 003', 'sur@dentista.demo')
  },
  normativeByTenant: {
    [TENANT_CENTRO]: defaultNormative(),
    [TENANT_NORTE]: defaultNormative(),
    [TENANT_SUR]: defaultNormative()
  },
  blockedSlots: [],
  informedConsents: demoInformedConsents
};

export const DEMO_PATIENT_LOGIN_ID = DEMO_PATIENT_ID;
export const demoState = demoSeed;
