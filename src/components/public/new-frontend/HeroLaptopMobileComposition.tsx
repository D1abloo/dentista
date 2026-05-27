import {
  Calendar,
  CalendarCheck,
  FileText,
  MessageCircle,
  Receipt,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { LandingDashboardPreview } from '@/components/public/LandingDashboardPreview'

const FLOATING = [
  { label: 'Próxima cita', sub: 'Mar 18 · 10:30', icon: Calendar, pos: 'chip-tl' },
  { label: '3 pagos pendientes', sub: 'Portal paciente', icon: Receipt, pos: 'chip-tr' },
  { label: 'Informe disponible', sub: 'Odontología', icon: FileText, pos: 'chip-bl' },
  { label: 'Agenda actualizada', sub: 'Tiempo real', icon: CalendarCheck, pos: 'chip-br' },
  { label: 'Portal paciente activo', sub: 'Acceso seguro', icon: ShieldCheck, pos: 'chip-mid' }
] as const

function PatientPortalPhone() {
  return (
    <div className="ac-hero-phone" aria-hidden>
      <div className="ac-hero-phone__shell">
        <header className="ac-hero-phone__head">
          <span className="ac-hero-phone__avatar">EV</span>
          <div>
            <small>Portal paciente</small>
            <strong>Hola, Elena</strong>
          </div>
          <span className="ac-hero-phone__dot" title="Mensaje nuevo">
            <MessageCircle className="h-3 w-3" aria-hidden />
          </span>
        </header>
        <div className="ac-hero-phone__card ac-hero-phone__card--accent">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          <div>
            <span>Próxima cita</span>
            <strong>Mar 18 · 10:30</strong>
            <small>Limpieza · Dr. Martínez</small>
          </div>
        </div>
        <div className="ac-hero-phone__actions">
          <span>Reservar</span>
          <span>Mis citas</span>
          <span>Informes</span>
        </div>
        <div className="ac-hero-phone__rows">
          <div className="ac-hero-phone__row">
            <FileText className="h-3 w-3" aria-hidden />
            <span>Informe disponible</span>
          </div>
          <div className="ac-hero-phone__row">
            <Receipt className="h-3 w-3" aria-hidden />
            <span>Factura #204 · 85€</span>
          </div>
        </div>
        <footer className="ac-hero-phone__foot">
          <Sparkles className="h-3 w-3" aria-hidden />
          Consulta con IA
        </footer>
      </div>
    </div>
  )
}

export function HeroLaptopMobileComposition() {
  return (
    <div className="ac-hero-compose" aria-label="Panel clínica en portátil y portal del paciente en móvil">
      <div className="ac-hero-compose__laptop">
        <LandingDashboardPreview />
      </div>
      <div className="ac-hero-compose__phone">
        <PatientPortalPhone />
      </div>
      {FLOATING.map((chip) => {
        const Icon = chip.icon
        return (
          <div key={chip.label} className={`ac-hero-compose__chip ac-hero-compose__chip--${chip.pos}`}>
            <span className="ac-hero-compose__chip-icon">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <strong>{chip.label}</strong>
              <span>{chip.sub}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
