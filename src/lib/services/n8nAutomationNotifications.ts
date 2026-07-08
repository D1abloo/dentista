import { addHours, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { logEvent } from '@/lib/audit/logEvent'
import { sendMail } from '@/lib/email/send'
import { sendAppointmentNotifications } from '@/lib/notifications'
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer'

function adminEmail() {
  return (
    import.meta.env.N8N_ADMIN_EMAIL?.trim() ||
    import.meta.env.CONTACT_NOTIFY_EMAIL?.trim() ||
    import.meta.env.PUBLIC_CONTACT_EMAIL?.trim() ||
    ''
  )
}

function baseUrl() {
  return import.meta.env.PUBLIC_APP_URL?.trim() || 'http://localhost:4321'
}

async function loadAppointmentBundle(appointmentId: string, clinicId: string) {
  if (!hasSupabaseConfig()) throw new Error('Supabase no configurado.')
  const db = getSupabaseAdmin()
  const { data: row, error } = await db
    .from('appointments')
    .select('id, clinic_id, patient_id, dentist_id, treatment_id, starts_at, ends_at, status, room_name, notes')
    .eq('id', appointmentId)
    .eq('clinic_id', clinicId)
    .maybeSingle()

  if (error || !row) throw new Error('Cita no encontrada.')

  const [patientRes, dentistRes, treatmentRes, clinicRes] = await Promise.all([
    row.patient_id
      ? db.from('profiles').select('full_name, email, phone').eq('id', row.patient_id).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from('dentists').select('name, profile_id').eq('id', row.dentist_id).maybeSingle(),
    db.from('treatments').select('name').eq('id', row.treatment_id).maybeSingle(),
    db.from('clinics').select('name, address').eq('id', row.clinic_id).maybeSingle()
  ])

  let dentistEmail: string | undefined
  const dentistProfileId = dentistRes.data?.profile_id as string | undefined
  if (dentistProfileId) {
    const { data: dentistProfile } = await db
      .from('profiles')
      .select('email')
      .eq('id', dentistProfileId)
      .maybeSingle()
    dentistEmail = dentistProfile?.email ? String(dentistProfile.email) : undefined
  }

  const patient = patientRes.data
  const dentist = dentistRes.data
  const treatment = treatmentRes.data
  const clinic = clinicRes.data

  return {
    id: String(row.id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    patientName: patient?.full_name ? String(patient.full_name) : 'Paciente',
    patientEmail: patient?.email ? String(patient.email) : undefined,
    patientPhone: patient?.phone ? String(patient.phone) : undefined,
    dentistId: String(row.dentist_id),
    dentistName: dentist?.name ? String(dentist.name) : 'Profesional',
    dentistEmail,
    treatmentName: treatment?.name ? String(treatment.name) : 'Tratamiento',
    clinicName: clinic?.name ? String(clinic.name) : 'Clínica',
    clinicAddress: clinic?.address ? String(clinic.address) : '',
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    status: String(row.status),
    roomName: String(row.room_name ?? 'Gabinete'),
    notes: row.notes ? String(row.notes) : undefined
  }
}

export async function notifyAppointmentCreatedByAutomation(input: {
  clinicId: string
  appointmentId: string
  channel?: string
}) {
  const appt = await loadAppointmentBundle(input.appointmentId, input.clinicId)
  const date = format(parseISO(appt.startsAt), 'yyyy-MM-dd')
  const time = format(parseISO(appt.startsAt), 'HH:mm')

  const channels = [
    appt.patientEmail ? 'email' as const : null,
    appt.patientPhone ? 'whatsapp' as const : null
  ].filter(Boolean)

  const patientNotify = channels.length
    ? await sendAppointmentNotifications(
        {
          channels,
          appointmentId: appt.id,
          patientId: appt.patientId,
          patientName: appt.patientName,
          patientEmail: appt.patientEmail,
          patientPhone: appt.patientPhone,
          treatmentName: appt.treatmentName,
          dentistName: appt.dentistName,
          clinicName: appt.clinicName,
          cabinetName: appt.roomName,
          date,
          time
        },
        baseUrl()
      )
    : null

  const staff = await notifyStaffAssignment({
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    kind: 'created',
    channel: input.channel
  })

  await logEvent({
    event_type: 'n8n.notification.created',
    module: 'n8n_automation',
    action: 'notify_appointment_created',
    clinic_id: input.clinicId,
    resource_type: 'appointment',
    resource_id: input.appointmentId,
    metadata: { channel: input.channel, patientNotify, staff }
  })

  return { patientNotify, staff, calendar: buildCalendarEventPayload(appt) }
}

export async function notifyAppointmentCancelledByAutomation(input: {
  clinicId: string
  appointmentId: string
  channel?: string
  reason?: string
}) {
  const appt = await loadAppointmentBundle(input.appointmentId, input.clinicId)
  const date = format(parseISO(appt.startsAt), "EEEE d 'de' MMMM", { locale: es })
  const time = format(parseISO(appt.startsAt), 'HH:mm')

  let patientResult = null
  if (appt.patientEmail) {
    patientResult = await sendMail({
      to: appt.patientEmail,
      subject: `Cita cancelada — ${appt.clinicName}`,
      text: [
        `Hola ${appt.patientName},`,
        `Tu cita del ${date} a las ${time} ha sido cancelada.`,
        input.reason ? `Motivo: ${input.reason}` : '',
        'Si necesitas una nueva cita, responde a este correo o usa el portal.'
      ]
        .filter(Boolean)
        .join('\n'),
      requireDelivery: false
    })
  }

  const staff = await notifyStaffAssignment({
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    kind: 'cancelled',
    channel: input.channel,
    reason: input.reason
  })

  await logEvent({
    event_type: 'n8n.notification.cancelled',
    module: 'n8n_automation',
    action: 'notify_appointment_cancelled',
    clinic_id: input.clinicId,
    resource_type: 'appointment',
    resource_id: input.appointmentId,
    metadata: { channel: input.channel, reason: input.reason }
  })

  return { patientResult, staff }
}

export async function notifyStaffAssignment(input: {
  clinicId: string
  appointmentId: string
  kind: 'created' | 'cancelled' | 'rescheduled'
  channel?: string
  reason?: string
}) {
  const appt = await loadAppointmentBundle(input.appointmentId, input.clinicId)
  const recipients = new Set<string>()
  if (appt.dentistEmail) recipients.add(appt.dentistEmail)
  const admin = adminEmail()
  if (admin) recipients.add(admin)

  if (!recipients.size) {
    return { sent: 0, skipped: true, reason: 'Sin emails de staff configurados.' }
  }

  const date = format(parseISO(appt.startsAt), "EEEE d 'de' MMMM", { locale: es })
  const time = format(parseISO(appt.startsAt), 'HH:mm')
  const actionLabel =
    input.kind === 'created'
      ? 'Nueva cita asignada'
      : input.kind === 'cancelled'
        ? 'Cita cancelada'
        : 'Cita reprogramada'

  const results = []
  for (const to of recipients) {
    const result = await sendMail({
      to,
      subject: `${actionLabel} — ${appt.patientName} · ${date} ${time}`,
      text: [
        actionLabel,
        `Paciente: ${appt.patientName}`,
        `Tratamiento: ${appt.treatmentName}`,
        `Profesional: ${appt.dentistName}`,
        `Fecha: ${date} · ${time}`,
        `Gabinete: ${appt.roomName}`,
        input.reason ? `Notas: ${input.reason}` : '',
        `Canal: ${input.channel ?? 'automation'}`,
        `Panel: ${baseUrl()}/admin/agenda`
      ]
        .filter(Boolean)
        .join('\n'),
      requireDelivery: false
    })
    results.push({ to, ...result })
  }

  return { sent: results.length, results }
}

export async function notifyAdminAutomationFailure(input: {
  clinicId?: string
  workflow: string
  message: string
  error?: string
  metadata?: Record<string, unknown>
}) {
  const to = adminEmail()
  if (!to) {
    return { sent: false, reason: 'N8N_ADMIN_EMAIL no configurado.' }
  }

  const result = await sendMail({
    to,
    subject: `[AgendaClinic] Fallo automatización n8n — ${input.workflow}`,
    text: [
      'Se ha detectado un error en una automatización de citas.',
      `Workflow: ${input.workflow}`,
      input.clinicId ? `Clínica: ${input.clinicId}` : '',
      `Mensaje: ${input.message}`,
      input.error ? `Error: ${input.error}` : '',
      input.metadata ? `Detalle: ${JSON.stringify(input.metadata)}` : ''
    ]
      .filter(Boolean)
      .join('\n'),
    requireDelivery: false
  })

  await logEvent({
    event_type: 'n8n.workflow.error',
    module: 'n8n_automation',
    action: 'admin_alert',
    clinic_id: input.clinicId,
    severity: 'high',
    result: 'error',
    message: input.message,
    metadata: { workflow: input.workflow, error: input.error, ...input.metadata }
  })

  return { sent: true, result }
}

export async function listDueAppointmentReminders(input: {
  clinicId?: string
  hoursBefore?: number
  limit?: number
}) {
  if (!hasSupabaseConfig()) return []
  const hours = input.hoursBefore ?? 24
  const windowStart = addHours(new Date(), hours - 1)
  const windowEnd = addHours(new Date(), hours + 1)
  const db = getSupabaseAdmin()

  let query = db
    .from('appointments')
    .select('id, clinic_id, patient_id, dentist_id, treatment_id, starts_at, ends_at, status')
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', windowStart.toISOString())
    .lte('starts_at', windowEnd.toISOString())
    .order('starts_at', { ascending: true })
    .limit(input.limit ?? 100)

  if (input.clinicId) query = query.eq('clinic_id', input.clinicId)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const results = []
  for (const row of rows) {
    const bundle = await loadAppointmentBundle(String(row.id), String(row.clinic_id))
    results.push({
      appointmentId: bundle.id,
      clinicId: bundle.clinicId,
      patientId: bundle.patientId,
      patientName: bundle.patientName,
      patientEmail: bundle.patientEmail,
      patientPhone: bundle.patientPhone,
      dentistName: bundle.dentistName,
      treatmentName: bundle.treatmentName,
      clinicName: bundle.clinicName,
      startsAt: bundle.startsAt,
      date: format(parseISO(bundle.startsAt), 'yyyy-MM-dd'),
      time: format(parseISO(bundle.startsAt), 'HH:mm'),
      hoursBefore: hours
    })
  }
  return results
}

export async function sendAppointmentReminderBatch(input: {
  clinicId: string
  appointmentIds: string[]
  channel?: 'email' | 'whatsapp' | 'sms'
  template?: string
}) {
  const channel = input.channel ?? 'email'
  const due = await listDueAppointmentReminders({ clinicId: input.clinicId, hoursBefore: 48, limit: 200 })
  const selected = due.filter((row) => input.appointmentIds.includes(row.appointmentId))
  const results = []

  for (const row of selected) {
    if (channel === 'email' && row.patientEmail) {
      const dateLabel = format(parseISO(row.startsAt), "EEEE d 'de' MMMM", { locale: es })
      const mail = await sendMail({
        to: row.patientEmail,
        subject: `Recordatorio de cita — ${row.clinicName}`,
        text:
          input.template ??
          [
            `Hola ${row.patientName},`,
            `Te recordamos tu cita de ${row.treatmentName} mañana (${dateLabel}) a las ${row.time}.`,
            `Profesional: ${row.dentistName}.`,
            'Si no puedes asistir, cancela o cambia la cita desde el portal.'
          ].join('\n'),
        requireDelivery: false
      })
      results.push({ appointmentId: row.appointmentId, channel, ...mail })
    } else {
      const notify = await sendAppointmentNotifications(
        {
          channels: [channel],
          appointmentId: row.appointmentId,
          patientId: row.patientId,
          patientName: row.patientName,
          patientEmail: row.patientEmail,
          patientPhone: row.patientPhone,
          treatmentName: row.treatmentName,
          dentistName: row.dentistName,
          clinicName: row.clinicName,
          cabinetName: '—',
          date: row.date,
          time: row.time
        },
        baseUrl()
      )
      results.push({ appointmentId: row.appointmentId, channel, notify })
    }
  }

  await logEvent({
    event_type: 'n8n.reminder.sent',
    module: 'n8n_automation',
    action: 'send_reminders',
    clinic_id: input.clinicId,
    metadata: { count: results.length, channel }
  })

  return { sent: results.length, results }
}

export function buildCalendarEventPayload(appt: Awaited<ReturnType<typeof loadAppointmentBundle>>) {
  const title = `${appt.treatmentName} — ${appt.patientName}`
  const description = [
    `Paciente: ${appt.patientName}`,
    `Profesional: ${appt.dentistName}`,
    `Clínica: ${appt.clinicName}`,
    appt.notes ? `Notas: ${appt.notes}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  return {
    summary: title,
    description,
    location: appt.clinicAddress || appt.clinicName,
    start: { dateTime: appt.startsAt, timeZone: 'Europe/Madrid' },
    end: { dateTime: appt.endsAt, timeZone: 'Europe/Madrid' },
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
    googleCalendarNodeHint: 'Usa este payload en n8n Google Calendar → Create Event'
  }
}
