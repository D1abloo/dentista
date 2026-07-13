import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Calendar,
  CalendarClock,
  CalendarX,
  HelpCircle,
  List,
  Sparkles,
  Stethoscope,
  Sun,
  UserRound
} from 'lucide-react'
import type { SuggestedOption, SuggestedOptionKind } from '@/lib/ai/suggestedOptions'

export type QuickReplyItem = {
  text: string
  icon: LucideIcon
  kind?: SuggestedOptionKind
}

export const AI_APPOINTMENTS_QUICK_REPLIES: QuickReplyItem[] = [
  { text: 'Reservar nueva cita', icon: Sparkles, kind: 'intent' },
  { text: 'Ver mis citas', icon: List, kind: 'manage' },
  { text: 'Cambiar una cita', icon: CalendarClock, kind: 'manage' },
  { text: 'Cancelar una cita', icon: CalendarX, kind: 'manage' },
  { text: 'Próxima cita', icon: Calendar, kind: 'manage' },
  { text: 'Hablar con mi clínica', icon: HelpCircle, kind: 'help' }
]

const KIND_ICON: Record<SuggestedOptionKind, LucideIcon> = {
  intent: Sparkles,
  treatment: Stethoscope,
  professional: UserRound,
  clinic: Building2,
  date: Calendar,
  time: Sun,
  manage: List,
  help: HelpCircle
}

export function suggestedOptionsToQuickReplies(options: SuggestedOption[]): QuickReplyItem[] {
  return options.map((option) => ({
    text: option.label,
    icon: KIND_ICON[option.kind] ?? Sparkles,
    kind: option.kind
  }))
}

export const AI_BOOKING_QUICK_REPLIES: QuickReplyItem[] = [
  { text: 'Reservar nueva cita', icon: Sparkles },
  { text: 'Limpieza dental', icon: Stethoscope },
  { text: 'Revisión', icon: Calendar },
  { text: 'Dolor dental', icon: CalendarX },
  { text: 'Esta semana', icon: CalendarClock },
  { text: 'Por la tarde', icon: Calendar }
]

export type { SuggestedOption }
