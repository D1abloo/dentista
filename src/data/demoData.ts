import type { AppSettings, DemoState, NormativeText } from '@/types/demo';
import { TENANT_CENTRO, TENANT_NORTE, TENANT_SUR } from '@/lib/tenantIds';

/** Paciente real ficticio único (demo/LIVE). */
const PATIENT = 'PAT-0001';

/** Fecha ISO relativa a hoy (agenda siempre con citas visibles). */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CLI_CENTRO = 'CLI-0001';
const CLI_NORTE = 'CLI-0002';
const CLI_SUR = 'CLI-0003';

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
  patients: [
    {
      id: PATIENT,
      nhc: '1',
      fullName: 'Elena Vidal Romero',
      email: 'maria@example.com',
      phone: '+34 612 345 678',
      dni: '45678912K',
      birthDate: '1988-07-14',
      allergies: 'Sin alergias declaradas',
      medication: 'Ninguna habitual',
      reminderChannels: ['email', 'whatsapp'],
      primaryDentistId: 'DEN-0001',
      preferredClinicId: CLI_CENTRO,
      emergencyContactName: 'Miguel Vidal',
      emergencyContactPhone: '+34 612 111 222',
      notes: 'Paciente principal · historial en Clínica Centro.',
      createdAt: '2024-03-10'
    }
  ],
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
      id: CLI_CENTRO,
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
      id: CLI_NORTE,
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
      id: CLI_SUR,
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
  appointments: [
    {
      id: 'CIT-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0001',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c1',
      treatmentId: 'TRA-0001',
      date: offsetDate(0),
      time: '09:00',
      status: 'confirmada',
      createdAt: offsetDate(-3)
    },
    {
      id: 'CIT-0002',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0001',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c2',
      treatmentId: 'TRA-0002',
      date: offsetDate(0),
      time: '10:15',
      status: 'confirmada',
      createdAt: offsetDate(-5)
    },
    {
      id: 'CIT-0003',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0004',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c1',
      treatmentId: 'TRA-0001',
      date: offsetDate(0),
      time: '12:30',
      status: 'pendiente',
      createdAt: offsetDate(-1)
    },
    {
      id: 'CIT-0004',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0001',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c2',
      treatmentId: 'TRA-0002',
      date: offsetDate(0),
      time: '17:00',
      status: 'confirmada',
      createdAt: offsetDate(-2)
    },
    {
      id: 'CIT-0005',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0001',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c2',
      treatmentId: 'TRA-0002',
      date: offsetDate(1),
      time: '11:00',
      status: 'pendiente',
      createdAt: offsetDate(-1)
    },
    {
      id: 'CIT-0006',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0004',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c1',
      treatmentId: 'TRA-0001',
      date: offsetDate(2),
      time: '10:30',
      status: 'confirmada',
      createdAt: offsetDate(0)
    },
    {
      id: 'CIT-0007',
      tenantId: TENANT_NORTE,
      patientId: PATIENT,
      dentistId: 'DEN-0002',
      clinicId: CLI_NORTE,
      cabinetId: 'g-n1',
      treatmentId: 'TRA-0003',
      date: offsetDate(-1),
      time: '16:00',
      status: 'completada',
      createdAt: offsetDate(-8)
    },
    {
      id: 'CIT-0008',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      dentistId: 'DEN-0003',
      clinicId: CLI_SUR,
      cabinetId: 'g-s1',
      treatmentId: 'TRA-0005',
      date: offsetDate(0),
      time: '09:30',
      status: 'pendiente',
      createdAt: offsetDate(-2)
    },
    {
      id: 'CIT-0009',
      tenantId: TENANT_NORTE,
      patientId: PATIENT,
      dentistId: 'DEN-0002',
      clinicId: CLI_NORTE,
      cabinetId: 'g-n1',
      treatmentId: 'TRA-0004',
      date: offsetDate(3),
      time: '15:00',
      status: 'pendiente',
      createdAt: offsetDate(-1)
    },
    {
      id: 'CIT-0010',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0004',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c1',
      treatmentId: 'TRA-0001',
      date: offsetDate(-2),
      time: '11:00',
      status: 'completada',
      createdAt: offsetDate(-10)
    },
    {
      id: 'CIT-0011',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      dentistId: 'DEN-0003',
      clinicId: CLI_SUR,
      cabinetId: 'g-s1',
      treatmentId: 'TRA-0006',
      date: offsetDate(7),
      time: '10:00',
      status: 'confirmada',
      createdAt: offsetDate(-3)
    },
    {
      id: 'CIT-0012',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      dentistId: 'DEN-0001',
      clinicId: CLI_CENTRO,
      cabinetId: 'g-c2',
      treatmentId: 'TRA-0002',
      date: offsetDate(-3),
      time: '09:45',
      status: 'no_asistio',
      createdAt: offsetDate(-12)
    }
  ],
  clinicalReports: [
    {
      id: 'INF-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0002',
      title: 'Informe ortodoncia',
      description: 'Control de alineación y tensión de arco.',
      diagnosis: 'Maloclusión clase I leve',
      recommendations: 'Control en 4 semanas',
      uploadedBy: 'Dra. Laura Sánchez',
      visibleToPatient: true,
      createdAt: offsetDate(-2)
    },
    {
      id: 'INF-0002',
      tenantId: TENANT_NORTE,
      patientId: PATIENT,
      appointmentId: 'CIT-0007',
      title: 'Informe valoración implantes',
      description: 'Estudio CBCT y plan quirúrgico.',
      diagnosis: 'Pérdida pieza 36',
      recommendations: 'Fase quirúrgica en 3 semanas',
      uploadedBy: 'Dr. Carlos Ramírez',
      visibleToPatient: true,
      createdAt: offsetDate(-1)
    },
    {
      id: 'INF-0003',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      appointmentId: 'CIT-0008',
      title: 'Informe blanqueamiento',
      description: 'Evaluación color y sensibilidad.',
      diagnosis: 'Color A2, sin sensibilidad',
      recommendations: 'Sesión en gabinete Sur',
      uploadedBy: 'Dra. Elena Martín',
      visibleToPatient: true,
      createdAt: offsetDate(-1)
    },
    {
      id: 'INF-0004',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0010',
      title: 'Informe limpieza dental',
      description: 'Profilaxis y encía.',
      diagnosis: 'Gingivitis leve resuelta',
      recommendations: 'Higiene interdental diaria',
      uploadedBy: 'Dr. Pablo Núñez',
      visibleToPatient: true,
      createdAt: offsetDate(-2)
    }
  ],
  invoices: [
    {
      id: 'FAC-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0002',
      amount: 120,
      concept: 'Ortodoncia · sesión control',
      status: 'pagada',
      issuedAt: offsetDate(-5),
      dueDate: offsetDate(5)
    },
    {
      id: 'FAC-0002',
      tenantId: TENANT_NORTE,
      patientId: PATIENT,
      appointmentId: 'CIT-0007',
      amount: 600,
      concept: 'Implantes · valoración y plan',
      status: 'pendiente',
      issuedAt: offsetDate(-1),
      dueDate: offsetDate(14)
    },
    {
      id: 'FAC-0003',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      appointmentId: 'CIT-0008',
      amount: 250,
      concept: 'Blanqueamiento dental',
      status: 'pendiente',
      issuedAt: offsetDate(-2),
      dueDate: offsetDate(10)
    },
    {
      id: 'FAC-0004',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0010',
      amount: 80,
      concept: 'Limpieza dental profesional',
      status: 'pagada',
      issuedAt: offsetDate(-3),
      dueDate: offsetDate(7)
    },
    {
      id: 'FAC-0005',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0001',
      amount: 80,
      concept: 'Limpieza dental · cita de hoy',
      status: 'pendiente',
      issuedAt: offsetDate(0),
      dueDate: offsetDate(15)
    }
  ],
  payments: [
    {
      id: 'PAG-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      invoiceId: 'FAC-0001',
      amount: 120,
      method: 'tarjeta',
      status: 'completado',
      paidAt: offsetDate(-4),
      createdAt: offsetDate(-4)
    },
    {
      id: 'PAG-0002',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      invoiceId: 'FAC-0004',
      amount: 80,
      method: 'transferencia',
      status: 'completado',
      paidAt: offsetDate(-2),
      createdAt: offsetDate(-2)
    }
  ],
  patientDocuments: [
    {
      id: 'DOC-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      type: 'consentimiento',
      title: 'Consentimiento ortodoncia',
      visibility: 'paciente',
      createdAt: '2026-05-16'
    },
    {
      id: 'DOC-0002',
      tenantId: TENANT_NORTE,
      patientId: PATIENT,
      type: 'radiografia',
      title: 'Radiografía panorámica Norte',
      visibility: 'paciente',
      createdAt: '2026-05-14'
    },
    {
      id: 'DOC-0003',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      type: 'otro',
      title: 'Nota interna Sur',
      visibility: 'admin',
      createdAt: '2026-05-15'
    }
  ],
  adminNotes: [
    {
      id: 'NOT-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      body: 'Prefiere recordatorios por WhatsApp.',
      createdAt: '2026-05-10',
      createdBy: 'Recepción Centro'
    }
  ],
  messages: [
    {
      id: 'MSG-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
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
      patientId: PATIENT,
      subject: 'Nueva factura',
      body: 'Tienes una factura pendiente de implantes en Clínica Norte.',
      channel: 'app',
      type: 'clinica',
      read: false,
      sentAt: '2026-05-20T10:00:00'
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
  informedConsents: [
    {
      id: 'CON-0001',
      tenantId: TENANT_CENTRO,
      patientId: PATIENT,
      appointmentId: 'CIT-0001',
      treatmentName: 'Ortodoncia',
      title: 'Consentimiento informado · Ortodoncia',
      body: 'Autorizo el plan de ortodoncia, revisiones periódicas y radiografías necesarias para el seguimiento del tratamiento.',
      status: 'firmado',
      requiredForPortal: true,
      signedAt: '2026-05-10T10:00:00',
      createdAt: '2026-05-10'
    },
    {
      id: 'CON-0002',
      tenantId: TENANT_SUR,
      patientId: PATIENT,
      appointmentId: 'CIT-0008',
      treatmentName: 'Blanqueamiento',
      title: 'Consentimiento informado · Blanqueamiento dental',
      body: 'He sido informada de riesgos, cuidados posteriores y alternativas del tratamiento de blanqueamiento. Autorizo su realización.',
      status: 'pendiente',
      requiredForPortal: true,
      createdAt: '2026-05-18'
    }
  ]
};

export const DEMO_PATIENT_LOGIN_ID = PATIENT;
export const demoState = demoSeed;
