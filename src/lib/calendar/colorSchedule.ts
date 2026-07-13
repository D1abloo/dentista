export const SCHEDULE_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
] as const

export type ScheduleColorTone = 'sky' | 'mint' | 'amber' | 'rose' | 'violet' | 'teal'

export const SCHEDULE_COLOR_TONES: Record<
  ScheduleColorTone,
  { bg: string; border: string; accent: string; text: string }
> = {
  sky: { bg: '#e0f2fe', border: '#7dd3fc', accent: '#0284c7', text: '#0c4a6e' },
  mint: { bg: '#d1fae5', border: '#6ee7b7', accent: '#059669', text: '#064e3b' },
  amber: { bg: '#ffedd5', border: '#fdba74', accent: '#ea580c', text: '#7c2d12' },
  rose: { bg: '#fce7f3', border: '#f9a8d4', accent: '#db2777', text: '#831843' },
  violet: { bg: '#ede9fe', border: '#c4b5fd', accent: '#7c3aed', text: '#4c1d95' },
  teal: { bg: '#ccfbf1', border: '#5eead4', accent: '#0d9488', text: '#134e4a' }
}

const TONE_KEYS = Object.keys(SCHEDULE_COLOR_TONES) as ScheduleColorTone[]

export function toneForKey(key: string): ScheduleColorTone {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * (i + 1)) % 997
  return TONE_KEYS[hash % TONE_KEYS.length]
}

export function hourKeyFromIso(iso: string) {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  return `${h}:00`
}

export function formatTimeRange(startsAt: string, endsAt: string) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${fmt(startsAt)} - ${fmt(endsAt)}`
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
