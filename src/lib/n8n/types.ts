export type N8nAppointmentChannel = 'portal' | 'panel' | 'assistant' | 'whatsapp' | 'email'

export type N8nAppointmentIntent =
  | 'check_availability'
  | 'create_appointment'
  | 'get_appointments'
  | 'cancel_appointment'
  | 'reschedule_appointment'
  | 'clarify'
  | 'confirm_action'
  | 'unknown'

export type AutomationActor = {
  userId: string
  companyId: string
  tenantId: string | null
  role: string
  patientId: string | null
  staffRole: string | null
  dentistId: string | null
  email: string | null
  fullName: string | null
  agendaScope: 'own' | 'clinic'
}

export type N8nWebhookPayload = {
  userId: string
  companyId: string
  message: string
  channel: N8nAppointmentChannel
  timezone: string
  metadata?: {
    verificationToken?: string
    confirmation?: boolean
    pendingIntent?: N8nAppointmentIntent
    pendingPayload?: Record<string, unknown>
    conversationId?: string
    role?: string
  }
}

export type N8nWebhookResponse = {
  reply: string
  intent?: N8nAppointmentIntent
  needsConfirmation?: boolean
  missingFields?: string[]
  data?: Record<string, unknown>
  error?: string | null
}
