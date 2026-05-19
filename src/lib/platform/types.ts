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
  registrationsPending: number;
  supportOpen: number;
}
