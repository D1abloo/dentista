export type DemoRole = 'paciente' | 'admin';

export type TenantType = 'dentista' | 'clinica';

export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'completada'
  | 'cancelada'
  | 'no_asistio'
  | 'reprogramada';

export type InvoiceStatus = 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
export type PaymentStatus = 'pendiente' | 'completado' | 'fallido' | 'reembolsado';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'otro';
export type DocumentType = 'informe' | 'factura' | 'recibo' | 'consentimiento' | 'radiografia' | 'otro';
export type DocumentVisibility = 'paciente' | 'admin';
export type ReminderChannel = 'email' | 'whatsapp' | 'sms';

export interface DemoSession {
  role: DemoRole;
  patientId?: string;
  tenantId?: string;
  /** Prueba en memoria: no localStorage ni Supabase */
  ephemeral?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  active: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  /** Número de historia clínica (1, 2, 3… único por clínica). */
  nhc?: string;
  fullName: string;
  email: string;
  phone: string;
  dni?: string;
  birthDate?: string;
  allergies?: string;
  medication?: string;
  reminderChannels?: ReminderChannel[];
  primaryDentistId?: string;
  preferredClinicId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileUpdatedAt?: string;
  createdAt: string;
}

export interface Dentist {
  id: string;
  profileId?: string;
  tenantId: string;
  fullName: string;
  specialty: string;
  email: string;
  phone: string;
  schedule: string;
  active: boolean;
}

export interface Cabinet {
  id: string;
  name: string;
  equipment: string;
  active: boolean;
}

export interface Clinic {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  openingHours: string;
  imageUrl?: string;
  active: boolean;
  isMainBranch?: boolean;
  cabinets: Cabinet[];
}

export interface Treatment {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  dentistId: string;
  clinicId: string;
  treatmentId: string;
  cabinetId?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  /** La administración confirma asistencia; habilita justificante en portal paciente. */
  attendanceConfirmed?: boolean;
  attendanceConfirmedAt?: string;
  createdAt: string;
}

export interface ClinicalReport {
  id: string;
  tenantId: string;
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
  createdAt: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  concept: string;
  status: InvoiceStatus;
  dueDate?: string;
  issuedAt: string;
  fileName?: string;
  fileRef?: string;
  mimeType?: string;
  lines?: InvoiceLine[];
  discount?: number;
  portalVisible?: boolean;
  sentAt?: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  patientId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  receiptRef?: string;
  receiptFileName?: string;
  notes?: string;
  notifyPatient?: boolean;
  createdAt: string;
}

export type ClinicNotificationCategory =
  | 'citas'
  | 'pacientes'
  | 'documentos'
  | 'informes'
  | 'facturas'
  | 'pagos'
  | 'portal'
  | 'sistema';

export type ClinicNotificationPriority = 'normal' | 'importante' | 'urgente';

export type ClinicNotificationEntity =
  | 'appointment'
  | 'patient'
  | 'document'
  | 'report'
  | 'invoice'
  | 'payment'
  | 'portal';

export interface ClinicNotification {
  id: string;
  tenantId: string;
  category: ClinicNotificationCategory;
  title: string;
  description: string;
  patientId?: string;
  entityType?: ClinicNotificationEntity;
  entityId?: string;
  read: boolean;
  archived?: boolean;
  priority: ClinicNotificationPriority;
  createdAt: string;
}

export interface NotificationChannelPrefs {
  panel: boolean;
  email: boolean;
  whatsapp: boolean;
  portal: boolean;
}

export interface NotificationPrefs {
  categories: Partial<Record<ClinicNotificationCategory, boolean>>;
  channels: NotificationChannelPrefs;
  alertNewAppointment: boolean;
  alertInvoiceDue: boolean;
  alertPaymentFailed: boolean;
  alertDocumentDownload: boolean;
  alertUploadError: boolean;
  alertInvalidToken: boolean;
  dailyDigest: boolean;
  urgentImmediate: boolean;
}

export interface PatientDocument {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  type: DocumentType;
  title: string;
  description?: string;
  fileName?: string;
  fileRef?: string;
  mimeType?: string;
  visibility: DocumentVisibility;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  tenantId: string;
  patientId: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export type MessageType =
  | 'recordatorio'
  | 'confirmacion'
  | 'clinica'
  | 'general'
  | 'factura'
  | 'documento';

export interface Message {
  id: string;
  tenantId: string;
  patientId: string;
  subject: string;
  body: string;
  channel: 'app' | 'email' | 'whatsapp' | 'sms';
  type: MessageType;
  read: boolean;
  sentAt: string;
  appointmentId?: string;
  invoiceId?: string;
  documentId?: string;
  archived?: boolean;
  important?: boolean;
  fromPatient?: boolean;
  attachmentRef?: string;
  attachmentName?: string;
}

export interface NormativeText {
  id: string;
  title: string;
  body: string;
}

export interface AppSettings {
  clinicName: string;
  tagline: string;
  legalName: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  imageUrl: string;
  generalHours: string;
  defaultDuration: number;
  slotIntervalMinutes: number;
  minCancelHours: number;
  remindersEnabled: boolean;
  welcomeMessage: string;
  appointmentConfirmMessage: string;
  primaryColor?: string;
  accentColor?: string;
  /** Facturación España */
  nif?: string;
  vatRate?: number;
  invoiceSeries?: string;
  defaultInvoiceConcept?: string;
  logoUrl?: string;
  /** Sello o imagen de sello para justificantes (URL o data URL). */
  clinicStampUrl?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  openTime?: string;
  closeTime?: string;
  /** 1=Lun … 7=Dom (ISO weekday) */
  workDays?: number[];
  notificationPrefs?: NotificationPrefs;
}

export type ConsentStatus = 'pendiente' | 'firmado';
export type ConsentSignatureMethod = 'draw' | 'typed';

export interface InformedConsent {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  treatmentName: string;
  title: string;
  body: string;
  summary?: string;
  status: ConsentStatus;
  requiredForPortal: boolean;
  fileRef?: string;
  fileName?: string;
  signatureRef?: string;
  signatureMethod?: ConsentSignatureMethod;
  signedCopyRef?: string;
  signedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface BlockedSlot {
  id: string;
  tenantId: string;
  clinicId: string;
  dentistId: string;
  cabinetId: string;
  date: string;
  time: string;
  reason: string;
}

export interface DemoState {
  tenants: Tenant[];
  patients: Patient[];
  dentists: Dentist[];
  clinics: Clinic[];
  treatments: Treatment[];
  appointments: Appointment[];
  clinicalReports: ClinicalReport[];
  invoices: Invoice[];
  payments: Payment[];
  patientDocuments: PatientDocument[];
  adminNotes: AdminNote[];
  messages: Message[];
  settingsByTenant: Record<string, AppSettings>;
  normativeByTenant: Record<string, NormativeText[]>;
  blockedSlots: BlockedSlot[];
  informedConsents: InformedConsent[];
  clinicNotifications: ClinicNotification[];
}
