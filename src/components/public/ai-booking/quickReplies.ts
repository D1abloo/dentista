import type { LucideIcon } from 'lucide-react'
import { Calendar, CalendarClock, Frown, Sparkles, Stethoscope, Sun } from 'lucide-react'

export type QuickReplyItem = {
  text: string
  icon: LucideIcon
}

export const AI_BOOKING_QUICK_REPLIES: QuickReplyItem[] = [
  { text: 'Quiero reservar cita', icon: Sparkles },
  { text: 'Limpieza dental', icon: Stethoscope },
  { text: 'Revisión', icon: Calendar },
  { text: 'Dolor dental', icon: Frown },
  { text: 'Esta semana', icon: CalendarClock },
  { text: 'Por la tarde', icon: Sun }
]
