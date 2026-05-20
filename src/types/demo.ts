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
  createdAt: string;
}

export interface Dentist {
  id: string;
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
  createdAt: string;
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

export interface Message {
  id: string;
  tenantId: string;
  patientId: string;
  subject: string;
  body: string;
  channel: 'app' | 'email' | 'whatsapp' | 'sms';
  type: 'recordatorio' | 'confirmacion' | 'clinica' | 'general';
  read: boolean;
  sentAt: string;
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
}

export type ConsentStatus = 'pendiente' | 'firmado';

export interface InformedConsent {
  id: string;
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  treatmentName: string;
  title: string;
  body: string;
  status: ConsentStatus;
  requiredForPortal: boolean;
  fileRef?: string;
  fileName?: string;
  signatureRef?: string;
  signedAt?: string;
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
}
