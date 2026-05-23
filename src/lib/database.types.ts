export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          slug: string;
          timezone: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          timezone?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          clinic_id: string;
          role: Database['public']['Enums']['user_role'];
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          clinic_id: string;
          role?: Database['public']['Enums']['user_role'];
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      dentists: {
        Row: {
          id: string;
          clinic_id: string;
          profile_id: string | null;
          name: string;
          specialty: string;
          rating: number;
          reviews_count: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          profile_id?: string | null;
          name: string;
          specialty: string;
          rating?: number;
          reviews_count?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['dentists']['Insert']>;
      };
      treatments: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          category: string;
          description: string | null;
          duration_minutes: number;
          price_cents: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          category: string;
          description?: string | null;
          duration_minutes: number;
          price_cents?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['treatments']['Insert']>;
      };
      rooms: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          dentist_id: string;
          treatment_id: string;
          room_name: string;
          starts_at: string;
          ends_at: string;
          status: Database['public']['Enums']['appointment_status'];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          dentist_id: string;
          treatment_id: string;
          room_name: string;
          starts_at: string;
          ends_at: string;
          status?: Database['public']['Enums']['appointment_status'];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          appointment_id: string | null;
          amount_cents: number;
          status: string;
          due_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          appointment_id?: string | null;
          amount_cents: number;
          status?: string;
          due_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          clinic_id: string;
          invoice_id: string | null;
          amount_cents: number;
          provider: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          invoice_id?: string | null;
          amount_cents: number;
          provider?: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          sender_role: Database['public']['Enums']['user_role'];
          subject: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          sender_role: Database['public']['Enums']['user_role'];
          subject: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      reminders: {
        Row: {
          id: string;
          clinic_id: string;
          appointment_id: string | null;
          channel: string;
          status: string;
          scheduled_at: string;
          sent_at: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          appointment_id?: string | null;
          channel: string;
          status?: string;
          scheduled_at: string;
          sent_at?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          clinic_id: string | null;
          actor_profile_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          event_type: string | null;
          module: string | null;
          severity: string | null;
          result: string | null;
          message: string | null;
          user_id: string | null;
          user_email: string | null;
          user_role: string | null;
          tenant_id: string | null;
          patient_id: string | null;
          professional_id: string | null;
          resource_type: string | null;
          route: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          actor_profile_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          event_type?: string | null;
          module?: string | null;
          severity?: string | null;
          result?: string | null;
          message?: string | null;
          user_id?: string | null;
          user_email?: string | null;
          user_role?: string | null;
          tenant_id?: string | null;
          patient_id?: string | null;
          professional_id?: string | null;
          resource_type?: string | null;
          route?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      login_events: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          user_role: string | null;
          tenant_id: string | null;
          clinic_id: string | null;
          patient_id: string | null;
          login_at: string;
          logout_at: string | null;
          ip_address: string | null;
          user_agent: string | null;
          device: string | null;
          status: string;
          failure_reason: string | null;
          route: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          user_role?: string | null;
          tenant_id?: string | null;
          clinic_id?: string | null;
          patient_id?: string | null;
          login_at?: string;
          logout_at?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device?: string | null;
          status: string;
          failure_reason?: string | null;
          route?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['login_events']['Insert']>;
      };
      availability_rules: {
        Row: {
          id: string;
          clinic_id: string;
          dentist_id: string | null;
          room_id: string | null;
          weekday: number;
          starts_at: string;
          ends_at: string;
          slot_minutes: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          dentist_id?: string | null;
          room_id?: string | null;
          weekday: number;
          starts_at: string;
          ends_at: string;
          slot_minutes?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['availability_rules']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          clinic_id: string;
          name: string;
          channel: string;
          audience: string;
          status: string;
          scheduled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          name: string;
          channel: string;
          audience: string;
          status?: string;
          scheduled_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          dentist_id: string | null;
          rating: number;
          comment: string | null;
          source: string;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          patient_id?: string | null;
          dentist_id?: string | null;
          rating: number;
          comment?: string | null;
          source?: string;
          published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      system_logs: {
        Row: {
          id: string;
          clinic_id: string | null;
          level: string;
          source: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id?: string | null;
          level: string;
          source: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['system_logs']['Insert']>;
      };
      role_permissions: {
        Row: {
          id: string;
          clinic_id: string;
          role: Database['public']['Enums']['user_role'];
          permission: string;
          enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          role: Database['public']['Enums']['user_role'];
          permission: string;
          enabled?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>;
      };
      clinic_settings: {
        Row: {
          clinic_id: string;
          booking_policy: Json;
          billing_policy: Json;
          notification_policy: Json;
          updated_at: string;
        };
        Insert: {
          clinic_id: string;
          booking_policy?: Json;
          billing_policy?: Json;
          notification_policy?: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clinic_settings']['Insert']>;
      };
      integrations: {
        Row: {
          id: string;
          clinic_id: string;
          provider: string;
          category: string;
          status: string;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: string;
          provider: string;
          category: string;
          status?: string;
          config?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['integrations']['Insert']>;
      };
    };
    Views: {
      appointments_view: {
        Row: {
          id: string;
          clinic_id: string;
          patient_id: string | null;
          patient_name: string;
          dentist_id: string;
          dentist_name: string;
          treatment_id: string;
          treatment_name: string;
          room_name: string;
          starts_at: string;
          ends_at: string;
          status: Database['public']['Enums']['appointment_status'];
          notes: string | null;
        };
      };
    };
    Functions: {
      current_profile_clinic_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database['public']['Enums']['user_role'];
      };
    };
    Enums: {
      appointment_status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show';
      user_role: 'patient' | 'receptionist' | 'dentist' | 'admin' | 'owner';
    };
  };
}
