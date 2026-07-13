import type { DataColumn } from '@/frontend/ds/DataTable'
import type { PlatformView } from './nav'

type Row = Record<string, unknown>

const col = <K extends string>(key: K, label: string, format?: 'status' | 'text'): DataColumn<Row> => ({
  key,
  label,
  format
})

export const platformColumns: Partial<Record<PlatformView, DataColumn<Row>[]>> = {
  usuarios: [
    col('full_name', 'Nombre'),
    col('email', 'Email'),
    col('role_label', 'Rol'),
    col('clinic_name', 'Clínica'),
    col('access_label', 'Acceso'),
    col('status', 'Estado', 'status'),
    col('last_access', 'Último acceso')
  ],
  clinicas: [
    col('name', 'Clínica'),
    col('city', 'Ciudad'),
    col('plan_label', 'Plan'),
    col('status', 'Estado', 'status'),
    col('staff_count', 'Staff'),
    col('patients_count', 'Pacientes'),
    col('activity_label', 'Actividad')
  ],
  organizaciones: [
    col('name', 'Organización'),
    col('admin_email', 'Admin'),
    col('plan_label', 'Plan'),
    col('status', 'Estado', 'status'),
    col('last_activity', 'Última actividad')
  ],
  incidencias: [
    col('event_label', 'Evento'),
    col('clinic_name', 'Clínica'),
    col('actor_name', 'Actor'),
    col('risk', 'Riesgo', 'status'),
    col('status', 'Estado', 'status'),
    col('date_label', 'Fecha')
  ],
  registros: [
    col('clinic_name', 'Clínica'),
    col('contact_email', 'Contacto'),
    col('city', 'Ciudad'),
    col('status_label', 'Estado', 'status'),
    col('submitted_at', 'Solicitud')
  ],
  historial: [
    col('clinic_name', 'Clínica'),
    col('processed_at', 'Procesado'),
    col('decision_label', 'Decisión'),
    col('processed_by', 'Por')
  ],
  suscripciones: [
    col('clinic_name', 'Clínica'),
    col('plan_label', 'Plan'),
    col('status_label', 'Estado', 'status'),
    col('mrr', 'MRR'),
    col('renewal_at', 'Renovación')
  ],
  soporte: [
    col('subject', 'Asunto'),
    col('clinic_name', 'Clínica'),
    col('priority_label', 'Prioridad', 'status'),
    col('status_label', 'Estado', 'status'),
    col('updated_at', 'Actualizado')
  ],
  auditoria: [
    col('title', 'Evento'),
    col('module', 'Módulo'),
    col('actor', 'Actor'),
    col('severity', 'Severidad', 'status'),
    col('at', 'Fecha')
  ],
  monitorizacion: [
    col('title', 'Evento'),
    col('service', 'Servicio'),
    col('severity', 'Severidad', 'status'),
    col('status', 'Estado', 'status'),
    col('at', 'Hora')
  ]
}

const HIDDEN_KEYS = new Set([
  'id',
  'permissions',
  'portal_token_hint',
  'initials',
  'clinic_id',
  'clinic_slug',
  'tenant_id',
  'user_type',
  'access_type',
  'credentials_sent',
  'active_sessions',
  'role',
  'created_at'
])

const humanize = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export const inferColumns = (rows: Row[], preset?: DataColumn<Row>[]): DataColumn<Row>[] => {
  if (preset?.length) return preset
  const sample = rows[0]
  if (!sample) return []
  return Object.keys(sample)
    .filter((key) => !HIDDEN_KEYS.has(key) && typeof sample[key] !== 'object')
    .slice(0, 7)
    .map((key) => ({
      key,
      label: humanize(key),
      format: key.includes('status') ? ('status' as const) : undefined
    }))
}
