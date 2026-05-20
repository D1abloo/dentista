export type ClinicStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type SubscriptionPlan = 'essential' | 'professional' | 'enterprise';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type PlatformRole =
  | 'super_admin'
  | 'clinic_admin'
  | 'admin'
  | 'dentist'
  | 'receptionist'
  | 'patient';

export interface PlatformClinic {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: ClinicStatus;
  subscription_plan: SubscriptionPlan;
  tenant_id: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface ClinicRegistration {
  id: string;
  clinic_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  message: string | null;
  status: RegistrationStatus;
  clinic_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface SupportRequest {
  id: string;
  clinic_id: string | null;
  requester_name: string;
  requester_email: string;
  subject: string;
  body: string;
  category: string;
  status: SupportStatus;
  created_at: string;
}

export interface PlatformOverview {
  clinicsTotal: number;
  clinicsActive: number;
  clinicsPending: number;
  clinicsSuspended: number;
  registrationsPending: number;
  supportOpen: number;
  staffUsers: number;
  tenantsLinked: number;
}

export interface PlatformClinicUser {
  id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
  clinic_status: ClinicStatus;
  role: PlatformRole;
  full_name: string;
  email: string;
  tenant_id: string | null;
  created_at: string;
}

export interface PlatformSubscription {
  id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
  plan: SubscriptionPlan;
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  seats: number;
  renews_at: string | null;
  created_at: string;
}

export interface PlatformIsolationClinic {
  id: string;
  name: string;
  slug: string;
  status: ClinicStatus;
  tenant_id: string | null;
  staff_count: number;
  patient_profiles: number;
  has_tenant: boolean;
}

export interface PlatformIsolationReport {
  policy: string[];
  clinicsWithTenant: number;
  clinicsWithoutTenant: number;
  totalStaff: number;
  clinics: PlatformIsolationClinic[];
}

export interface PlatformSettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface PlatformUsageRow {
  clinic_id: string;
  clinic_name: string;
  day: string;
  appointments_count: number;
  patients_count: number;
  invoices_count: number;
}
