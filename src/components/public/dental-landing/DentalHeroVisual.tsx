import {
  Calendar,
  CalendarCheck,
  Clock,
  MessageCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { LandingDashboardPreview } from '@/components/public/LandingDashboardPreview'

const FLOATING = [
  { label: 'Próxima cita confirmada', sub: 'Limpieza · 18 mar', icon: CalendarCheck, pos: 'tl' },
  { label: 'Hueco disponible 16:30', sub: 'Dr. Martínez', icon: Clock, pos: 'tr' },
  { label: 'Recordatorio enviado', sub: 'SMS + email', icon: MessageCircle, pos: 'bl' },
  { label: 'Horario bloqueado', sub: 'Formación', icon: Calendar, pos: 'br' },
  { label: 'Paciente informado', sub: 'Portal activo', icon: ShieldCheck, pos: 'mid' }
] as const

const PatientPhone = () => (
  <div className="adb-hero-phone" aria-hidden>
    <div className="adb-hero-phone__shell">
      <header>
        <span>EV</span>
        <div>
          <small>Portal paciente</small>
          <strong>Mis citas</strong>
        </div>
      </header>
      <div className="adb-hero-phone__card adb-hero-phone__card--accent">
        <Calendar className="h-3.5 w-3.5" aria-hidden />
        <div>
          <span>Próxima cita</span>
          <strong>18 mar · 10:30</strong>
        </div>
      </div>
      <div className="adb-hero-phone__grid">
        <span>Reservar cita</span>
        <span>Mis citas</span>
        <span>Cambiar cita</span>
        <span>Cancelar cita</span>
      </div>
      <footer>
        <Sparkles className="h-3 w-3" aria-hidden />
        Asistente IA
      </footer>
    </div>
  </div>
)

export const DentalHeroVisual = () => (
  <div className="adb-hero-visual" aria-label="Agenda clínica dental y portal del paciente en móvil">
    <div className="adb-hero-visual__laptop">
      <LandingDashboardPreview />
    </div>
    <div className="adb-hero-visual__phone">
      <PatientPhone />
    </div>
    {FLOATING.map((chip) => {
      const Icon = chip.icon
      return (
        <div key={chip.label} className={`adb-hero-visual__chip adb-hero-visual__chip--${chip.pos}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          <div>
            <strong>{chip.label}</strong>
            <span>{chip.sub}</span>
          </div>
        </div>
      )
    })}
  </div>
)
