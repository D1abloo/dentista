import type {
  AdminMetric,
  AdminModule,
  Appointment,
  AvailabilitySlot,
  Campaign,
  ClinicLocation,
  Dentist,
  Integration,
  Patient,
  PatientMessage,
  PatientNotification,
  PatientPayment,
  Review,
  RolePermission,
  Room,
  SystemLog,
  Treatment
} from './types';

export const demoClinicId = 'demo-clinic';

export const treatments: Treatment[] = [
  { id: 't-clean', clinicId: demoClinicId, name: 'Limpieza Dental', durationMinutes: 45, priceCents: 80000, category: 'Preventiva', color: 'emerald', description: 'Profilaxis completa, pulido y recomendaciones de higiene.' },
  { id: 't-whitening', clinicId: demoClinicId, name: 'Blanqueamiento', durationMinutes: 60, priceCents: 250000, category: 'Estética', color: 'sky', description: 'Tratamiento profesional para aclarar el tono dental.' },
  { id: 't-ortho', clinicId: demoClinicId, name: 'Ortodoncia Invisible', durationMinutes: 30, priceCents: 0, category: 'Ortodoncia', color: 'violet', description: 'Consulta de valoración para alineadores invisibles.' },
  { id: 't-implant', clinicId: demoClinicId, name: 'Implante Dental', durationMinutes: 90, priceCents: 0, category: 'Cirugía', color: 'amber', description: 'Evaluación y planificación de implante dental.' }
];

export const dentists: Dentist[] = [
  { id: 'd-laura', clinicId: demoClinicId, name: 'Dra. Laura Sánchez', specialty: 'Ortodoncia', rating: 4.9, reviews: 126, avatar: 'LS', nextAvailable: 'Hoy 10:00', active: true },
  { id: 'd-carlos', clinicId: demoClinicId, name: 'Dr. Carlos Ramírez', specialty: 'Implantología', rating: 4.8, reviews: 98, avatar: 'CR', nextAvailable: 'Mañana 09:30', active: true },
  { id: 'd-ana', clinicId: demoClinicId, name: 'Dra. Ana Torres', specialty: 'Estética Dental', rating: 4.9, reviews: 74, avatar: 'AT', nextAvailable: 'Viernes 11:00', active: true },
  { id: 'd-miguel', clinicId: demoClinicId, name: 'Dr. Miguel Ángel', specialty: 'Endodoncia', rating: 4.7, reviews: 61, avatar: 'MA', nextAvailable: 'Lunes 13:00', active: true }
];

export const rooms: Room[] = [
  { id: 'r-1', clinicId: demoClinicId, name: 'Gabinete 1', equipment: 'Profilaxis + rayos intraorales', status: 'available' },
  { id: 'r-2', clinicId: demoClinicId, name: 'Gabinete 2', equipment: 'Ortodoncia digital', status: 'occupied' },
  { id: 'r-3', clinicId: demoClinicId, name: 'Gabinete 3', equipment: 'Cirugía e implantes', status: 'available' },
  { id: 'r-4', clinicId: demoClinicId, name: 'Gabinete 4', equipment: 'Estética y blanqueamiento', status: 'maintenance' }
];

export const clinicLocations: ClinicLocation[] = [
  {
    id: 'loc-center',
    clinicId: demoClinicId,
    name: 'Clínica Centro',
    shortName: 'Centro',
    address: 'Av. Principal 123, Centro',
    phone: '+34 555 123 567',
    openingHours: 'Lun-Vie 8:00-20:00',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
    roomName: 'Gabinete 1'
  },
  {
    id: 'loc-north',
    clinicId: demoClinicId,
    name: 'Clínica Norte',
    shortName: 'Norte',
    address: 'Paseo Norte 45',
    phone: '+34 555 221 778',
    openingHours: 'Lun-Sáb 9:00-19:00',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80',
    roomName: 'Gabinete 2'
  },
  {
    id: 'loc-south',
    clinicId: demoClinicId,
    name: 'Clínica Sur',
    shortName: 'Sur',
    address: 'Calle Jardines Sur 678',
    phone: '+34 555 901 442',
    openingHours: 'Lun-Vie 8:30-18:30',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
    roomName: 'Gabinete 3'
  }
];

export const patients: Patient[] = [
  { id: 'p-maria', clinicId: demoClinicId, name: 'María González', email: 'maria@example.com', phone: '+34 600 111 222', status: 'vip', outstandingBalanceCents: 0, nextAppointmentAt: '2026-05-24T10:00:00+02:00' },
  { id: 'p-jose', clinicId: demoClinicId, name: 'José María López', email: 'jose@example.com', phone: '+34 600 333 444', status: 'active', outstandingBalanceCents: 0, nextAppointmentAt: '2026-05-20T10:30:00+02:00' },
  { id: 'p-patricia', clinicId: demoClinicId, name: 'Patricia Gómez', email: 'patricia@example.com', phone: '+34 600 555 666', status: 'active', outstandingBalanceCents: 250000, nextAppointmentAt: '2026-05-20T11:00:00+02:00' },
  { id: 'p-roberto', clinicId: demoClinicId, name: 'Roberto Díaz', email: 'roberto@example.com', phone: '+34 600 777 888', status: 'inactive', outstandingBalanceCents: 0, nextAppointmentAt: '2026-05-20T12:00:00+02:00' }
];

export const appointments: Appointment[] = [
  { id: 'a-1', clinicId: demoClinicId, patientId: 'p-maria', patientName: 'María González', dentistId: 'd-laura', dentistName: 'Dra. Laura Sánchez', treatmentId: 't-clean', treatmentName: 'Limpieza Dental', roomName: 'Gabinete 2', startsAt: '2026-05-24T10:00:00+02:00', endsAt: '2026-05-24T10:45:00+02:00', status: 'confirmed' },
  { id: 'a-2', clinicId: demoClinicId, patientId: 'p-jose', patientName: 'José María López', dentistId: 'd-laura', dentistName: 'Dra. Laura Sánchez', treatmentId: 't-clean', treatmentName: 'Limpieza Dental', roomName: 'Gabinete 1', startsAt: '2026-05-20T10:30:00+02:00', endsAt: '2026-05-20T11:15:00+02:00', status: 'confirmed' },
  { id: 'a-3', clinicId: demoClinicId, patientId: 'p-patricia', patientName: 'Patricia Gómez', dentistId: 'd-carlos', dentistName: 'Dr. Carlos Ramírez', treatmentId: 't-ortho', treatmentName: 'Ortodoncia', roomName: 'Gabinete 2', startsAt: '2026-05-20T11:00:00+02:00', endsAt: '2026-05-20T11:30:00+02:00', status: 'pending' },
  { id: 'a-4', clinicId: demoClinicId, patientId: 'p-roberto', patientName: 'Roberto Díaz', dentistId: 'd-carlos', dentistName: 'Dr. Carlos Ramírez', treatmentId: 't-implant', treatmentName: 'Implante Dental', roomName: 'Gabinete 3', startsAt: '2026-05-20T12:00:00+02:00', endsAt: '2026-05-20T13:30:00+02:00', status: 'confirmed' },
  { id: 'a-5', clinicId: demoClinicId, patientId: 'p-fernando', patientName: 'Fernando Morales', dentistId: 'd-ana', dentistName: 'Dra. Ana Torres', treatmentId: 't-clean', treatmentName: 'Limpieza Dental', roomName: 'Gabinete 4', startsAt: '2026-05-20T13:30:00+02:00', endsAt: '2026-05-20T14:15:00+02:00', status: 'pending' }
];

export const availabilitySlots: AvailabilitySlot[] = [
  { id: 'slot-0900', clinicId: demoClinicId, dentistId: 'd-laura', treatmentId: 't-clean', roomName: 'Gabinete 2', startsAt: '2026-05-24T09:00:00+02:00', endsAt: '2026-05-24T09:45:00+02:00', available: true },
  { id: 'slot-0930', clinicId: demoClinicId, dentistId: 'd-carlos', treatmentId: 't-implant', roomName: 'Gabinete 3', startsAt: '2026-05-24T09:30:00+02:00', endsAt: '2026-05-24T11:00:00+02:00', available: true },
  { id: 'slot-1000', clinicId: demoClinicId, dentistId: 'd-laura', treatmentId: 't-clean', roomName: 'Gabinete 2', startsAt: '2026-05-24T10:00:00+02:00', endsAt: '2026-05-24T10:45:00+02:00', available: false },
  { id: 'slot-1030', clinicId: demoClinicId, dentistId: 'd-ana', treatmentId: 't-whitening', roomName: 'Gabinete 4', startsAt: '2026-05-24T10:30:00+02:00', endsAt: '2026-05-24T11:30:00+02:00', available: true },
  { id: 'slot-1100', clinicId: demoClinicId, dentistId: 'd-laura', treatmentId: 't-ortho', roomName: 'Gabinete 2', startsAt: '2026-05-24T11:00:00+02:00', endsAt: '2026-05-24T11:30:00+02:00', available: true },
  { id: 'slot-1200', clinicId: demoClinicId, dentistId: 'd-miguel', treatmentId: 't-clean', roomName: 'Gabinete 1', startsAt: '2026-05-24T12:00:00+02:00', endsAt: '2026-05-24T12:45:00+02:00', available: true },
  { id: 'slot-1600', clinicId: demoClinicId, dentistId: 'd-carlos', treatmentId: 't-implant', roomName: 'Gabinete 3', startsAt: '2026-05-24T16:00:00+02:00', endsAt: '2026-05-24T17:30:00+02:00', available: true }
];

export const adminMetrics: AdminMetric[] = [
  { label: 'Citas hoy', value: '28', delta: '+12% vs ayer', tone: 'blue' },
  { label: 'Ingresos hoy', value: '€28.450', delta: '+18% vs ayer', tone: 'green' },
  { label: 'Ocupación', value: '85%', delta: '+8% vs ayer', tone: 'amber' },
  { label: 'Nuevos pacientes', value: '7', delta: '+5% vs ayer', tone: 'purple' }
];

export const chartRevenue = [
  { hour: '08:00', value: 4200 },
  { hour: '10:00', value: 9800 },
  { hour: '12:00', value: 17500 },
  { hour: '14:00', value: 18800 },
  { hour: '16:00', value: 24600 },
  { hour: '18:00', value: 22400 },
  { hour: '20:00', value: 28450 }
];

export const treatmentShare = [
  { name: 'Limpieza', value: 40 },
  { name: 'Ortodoncia', value: 30 },
  { name: 'Implantes', value: 15 },
  { name: 'Blanqueamiento', value: 10 },
  { name: 'Otros', value: 5 }
];

export const waitingQueue = [
  { patient: 'Antonio Vargas', service: 'Limpieza', wait: '15 min' },
  { patient: 'Isabel Martínez', service: 'Ortodoncia', wait: '20 min' },
  { patient: 'Diego Salazar', service: 'Blanqueamiento', wait: '30 min' }
];

export const notifications = [
  { title: 'Recordatorio enviado', detail: 'A 45 pacientes', time: '10:00' },
  { title: 'Pago recibido', detail: 'María López · €2.500', time: '09:45' },
  { title: 'Nueva reseña ★★★★★', detail: 'Carlos Rivera', time: '09:30' },
  { title: 'Cita cancelada', detail: 'Daniela Ruiz', time: '09:15' }
];

export const adminModules: AdminModule[] = [
  { id: 'agenda', label: 'Agenda', description: 'Vista diaria, semanal y mensual por gabinete.', owner: 'Recepción', status: 'live', items: 28, action: 'Gestionar agenda' },
  { id: 'pacientes', label: 'Pacientes', description: 'Ficha, historial, consentimientos y preferencias.', owner: 'Clínica', status: 'live', items: 1248, action: 'Abrir pacientes' },
  { id: 'citas', label: 'Citas', description: 'Confirmación, reprogramación y no asistencias.', owner: 'Recepción', status: 'live', items: 86, action: 'Ver citas' },
  { id: 'odontologos', label: 'Odontólogos', description: 'Especialidades, agenda y rendimiento clínico.', owner: 'Dirección', status: 'live', items: 8, action: 'Configurar equipo' },
  { id: 'gabinetes', label: 'Gabinetes', description: 'Capacidad, equipamiento y estado operativo.', owner: 'Operaciones', status: 'live', items: 4, action: 'Ver gabinetes' },
  { id: 'disponibilidad', label: 'Disponibilidad', description: 'Reglas por profesional, sala y tratamiento.', owner: 'Operaciones', status: 'live', items: 36, action: 'Editar slots' },
  { id: 'recordatorios', label: 'Recordatorios', description: 'WhatsApp, email y SMS con cola auditable.', owner: 'CRM', status: 'demo', items: 45, action: 'Enviar prueba' },
  { id: 'comunicaciones', label: 'Comunicaciones', description: 'Mensajes bidireccionales y plantillas.', owner: 'Atención', status: 'demo', items: 19, action: 'Abrir bandeja' },
  { id: 'facturacion', label: 'Facturación', description: 'Facturas, vencimientos y estados.', owner: 'Finanzas', status: 'live', items: 64, action: 'Ver facturas' },
  { id: 'pagos', label: 'Pagos', description: 'Cobros manuales, TPV y conciliación.', owner: 'Finanzas', status: 'demo', items: 31, action: 'Revisar pagos' },
  { id: 'reportes', label: 'Reportes', description: 'Ingresos, ocupación, conversión y retención.', owner: 'Dirección', status: 'live', items: 12, action: 'Analizar' },
  { id: 'resenas', label: 'Reseñas', description: 'Valoraciones por profesional y fuente.', owner: 'Marketing', status: 'live', items: 298, action: 'Responder' },
  { id: 'marketing', label: 'Marketing', description: 'Campañas, audiencias y promociones.', owner: 'Marketing', status: 'demo', items: 7, action: 'Planificar' },
  { id: 'auditoria', label: 'Auditoría', description: 'Cambios críticos con actor y entidad.', owner: 'Seguridad', status: 'live', items: 142, action: 'Revisar' },
  { id: 'logs', label: 'Logs', description: 'Eventos de API, cache y notificaciones.', owner: 'Tech', status: 'live', items: 58, action: 'Inspeccionar' },
  { id: 'roles', label: 'Roles', description: 'Owner, admin, recepción, odontólogo y paciente.', owner: 'Seguridad', status: 'live', items: 5, action: 'Ver roles' },
  { id: 'permisos', label: 'Permisos', description: 'Matriz por módulo con mínimo privilegio.', owner: 'Seguridad', status: 'live', items: 24, action: 'Editar matriz' },
  { id: 'configuracion', label: 'Configuración', description: 'Políticas de reserva, facturación y avisos.', owner: 'Dirección', status: 'live', items: 9, action: 'Abrir ajustes' },
  { id: 'integraciones', label: 'Integraciones', description: 'Calendarios, pagos, Supabase y providers.', owner: 'Tech', status: 'demo', items: 6, action: 'Conectar' }
];

export const patientPayments: PatientPayment[] = [
  { id: 'pay-1', clinicId: demoClinicId, concept: 'Limpieza Dental', amountCents: 80000, status: 'paid', issuedAt: '2026-05-12T10:00:00+02:00' },
  { id: 'pay-2', clinicId: demoClinicId, concept: 'Blanqueamiento', amountCents: 250000, status: 'pending', issuedAt: '2026-05-14T11:30:00+02:00' },
  { id: 'pay-3', clinicId: demoClinicId, concept: 'Valoración Ortodoncia', amountCents: 0, status: 'paid', issuedAt: '2026-05-02T16:00:00+02:00' }
];

export const patientMessages: PatientMessage[] = [
  { id: 'msg-1', clinicId: demoClinicId, subject: 'Preparación para tu limpieza', preview: 'Recuerda evitar café justo antes de la cita.', channel: 'app', unread: true, sentAt: '2026-05-16T09:00:00+02:00' },
  { id: 'msg-2', clinicId: demoClinicId, subject: 'Presupuesto de blanqueamiento', preview: 'Tu presupuesto está listo para revisar.', channel: 'email', unread: true, sentAt: '2026-05-15T18:10:00+02:00' },
  { id: 'msg-3', clinicId: demoClinicId, subject: 'Recordatorio WhatsApp', preview: 'Confirmaremos tu cita 24 horas antes.', channel: 'whatsapp', unread: false, sentAt: '2026-05-14T10:25:00+02:00' }
];

export const patientNotifications: PatientNotification[] = [
  { id: 'nt-1', clinicId: demoClinicId, title: 'Cita confirmada', detail: '24 mayo a las 10:00 con Dra. Laura Sánchez.', tone: 'green' },
  { id: 'nt-2', clinicId: demoClinicId, title: 'Pago pendiente', detail: 'Blanqueamiento: €2.500 pendiente de confirmar.', tone: 'amber' },
  { id: 'nt-3', clinicId: demoClinicId, title: 'Consejo dental', detail: 'Renueva el cepillo cada 3 meses.', tone: 'blue' }
];

export const reviews: Review[] = [
  { id: 'rev-1', clinicId: demoClinicId, patientName: 'Carlos Rivera', dentistName: 'Dra. Ana Torres', rating: 5, comment: 'Proceso rápido y trato excelente.', source: 'Google' },
  { id: 'rev-2', clinicId: demoClinicId, patientName: 'Isabel Martínez', dentistName: 'Dr. Carlos Ramírez', rating: 5, comment: 'Me explicaron todo con mucha claridad.', source: 'Doctoralia' }
];

export const campaigns: Campaign[] = [
  { id: 'camp-1', clinicId: demoClinicId, name: 'Recall limpiezas semestrales', channel: 'whatsapp', audience: 'Pacientes activos', status: 'scheduled', scheduledAt: '2026-05-21T09:00:00+02:00' },
  { id: 'camp-2', clinicId: demoClinicId, name: 'Promoción blanqueamiento mayo', channel: 'email', audience: 'Interesados estética', status: 'draft', scheduledAt: '2026-05-22T10:00:00+02:00' }
];

export const systemLogs: SystemLog[] = [
  { id: 'log-1', clinicId: demoClinicId, level: 'info', source: 'api.appointments', message: 'Cita demo creada correctamente.', createdAt: '2026-05-16T10:30:00+02:00' },
  { id: 'log-2', clinicId: demoClinicId, level: 'warning', source: 'cache.redis', message: 'Redis no configurado, usando memoria.', createdAt: '2026-05-16T10:25:00+02:00' },
  { id: 'log-3', clinicId: demoClinicId, level: 'info', source: 'reminders.mock', message: 'Recordatorios simulados encolados.', createdAt: '2026-05-16T10:10:00+02:00' }
];

export const rolePermissions: RolePermission[] = [
  { id: 'perm-owner', clinicId: demoClinicId, role: 'owner', permission: 'admin:*', enabled: true },
  { id: 'perm-admin', clinicId: demoClinicId, role: 'admin', permission: 'clinic:manage', enabled: true },
  { id: 'perm-reception', clinicId: demoClinicId, role: 'receptionist', permission: 'appointments:write', enabled: true },
  { id: 'perm-dentist', clinicId: demoClinicId, role: 'dentist', permission: 'clinical_notes:write', enabled: true },
  { id: 'perm-patient', clinicId: demoClinicId, role: 'patient', permission: 'portal:read', enabled: true }
];

export const integrations: Integration[] = [
  { id: 'int-supabase', clinicId: demoClinicId, provider: 'Supabase', category: 'storage', status: 'mock' },
  { id: 'int-redis', clinicId: demoClinicId, provider: 'Redis', category: 'analytics', status: 'mock' },
  { id: 'int-google-calendar', clinicId: demoClinicId, provider: 'Google Calendar', category: 'calendar', status: 'disabled' },
  { id: 'int-stripe', clinicId: demoClinicId, provider: 'Stripe', category: 'payments', status: 'disabled' },
  { id: 'int-whatsapp', clinicId: demoClinicId, provider: 'WhatsApp Business', category: 'notifications', status: 'mock' },
  { id: 'int-email', clinicId: demoClinicId, provider: 'Email transaccional', category: 'notifications', status: 'mock' }
];
