import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  CalendarClock,
  CalendarX,
  HelpCircle,
  List,
  Sparkles,
  Stethoscope
} from 'lucide-react'

export type QuickReplyItem = {
  text: string
  icon: LucideIcon
}

export const AI_APPOINTMENTS_QUICK_REPLIES: QuickReplyItem[] = [
  { text: 'Reservar nueva cita', icon: Sparkles },
  { text: 'Ver mis citas', icon: List },
  { text: 'Cambiar una cita', icon: CalendarClock },
  { text: 'Cancelar una cita', icon: CalendarX },
  { text: 'Próxima cita', icon: Calendar },
  { text: 'Hablar con mi clínica', icon: HelpCircle }
]

export const AI_BOOKING_QUICK_REPLIES: QuickReplyItem[] = [
  { text: 'Reservar nueva cita', icon: Sparkles },
  { text: 'Limpieza dental', icon: Stethoscope },
  { text: 'Revisión', icon: Calendar },
  { text: 'Dolor dental', icon: CalendarX },
  { text: 'Esta semana', icon: CalendarClock },
  { text: 'Por la tarde', icon: Calendar }
]
