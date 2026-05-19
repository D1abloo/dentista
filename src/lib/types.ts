export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
export type UserRole = 'patient' | 'receptionist' | 'dentist' | 'admin' | 'owner';
export type ModuleStatus = 'live' | 'demo' | 'queued';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Treatment {
  id: string;
  clinicId: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
  color: string;
  description: string;
}

export interface Dentist {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  avatar: string;
  nextAvailable: string;
  active?: boolean;
}

export interface Room {
  id: string;
  clinicId: string;
  name: string;
  equipment: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface ClinicLocation {
  id: string;
  clinicId: string;
  name: string;
  shortName: 'Centro' | 'Norte' | 'Sur';
  address: string;
  phone: string;
  openingHours: string;
  imageUrl: string;
  roomName: string;
}

export interface AvailabilitySlot {
  id: string;
  clinicId: string;
  dentistId: string;
  treatmentId?: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'vip';
  outstandingBalanceCents: number;
  nextAppointmentAt?: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientName: string;
  patientId: string;
  dentistName: string;
  dentistId: string;
  treatmentName: string;
  treatmentId: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string;
}

export interface AdminMetric {
  label: string;
  value: string;
  delta: string;
  tone: 'blue' | 'green' | 'amber' | 'purple';
}

export interface AdminModule {
  id: string;
  label: string;
  description: string;
  owner: string;
  status: ModuleStatus;
  items: number;
  action: string;
}

export interface PatientPayment {
  id: string;
  clinicId: string;
  concept: string;
  amountCents: number;
  status: PaymentStatus;
  issuedAt: string;
}

export interface PatientMessage {
  id: string;
  clinicId: string;
  subject: string;
  preview: string;
  channel: 'app' | 'email' | 'whatsapp' | 'sms';
  unread: boolean;
  sentAt: string;
}

export interface PatientNotification {
  id: string;
  clinicId: string;
  title: string;
  detail: string;
  tone: 'blue' | 'green' | 'amber';
}

export interface Review {
  id: string;
  clinicId: string;
  patientName: string;
  dentistName: string;
  rating: number;
  comment: string;
  source: string;
}

export interface Campaign {
  id: string;
  clinicId: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms';
  audience: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt: string;
}

export interface SystemLog {
  id: string;
  clinicId: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  clinicId: string;
  role: UserRole;
  permission: string;
  enabled: boolean;
}

export interface Integration {
  id: string;
  clinicId: string;
  provider: string;
  category: 'calendar' | 'payments' | 'notifications' | 'analytics' | 'storage';
  status: 'connected' | 'mock' | 'disabled';
}
