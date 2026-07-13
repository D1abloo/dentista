import { openAiAppointmentsWidget } from '@/lib/public/aiWidget'
import {
  ArrowRight,
  CalendarClock,
  Cloud,
  FileCheck2,
  Smartphone
} from 'lucide-react'
import { ClinicTrustLogos } from './ClinicTrustLogos'
import { HeroProductShowcase } from './HeroProductShowcase'
import { ResponsiveContainer } from './ResponsiveContainer'

const HIGHLIGHTS = [
  {
    text: 'Presupuestos y facturas que el paciente consulta y firma desde el móvil',
    Icon: FileCheck2
  },
  {
    text: 'Migración asistida: importamos pacientes desde Excel u otro programa',
    Icon: Cloud
  },
  {
    text: 'Funciona en la nube — ordenador, tablet y móvil, sin instalaciones',
    Icon: Smartphone
  }
] as const

const PROOF = [
  { label: 'Trustpilot', score: '4.5/5', tone: 'trust' },
  { label: 'Google', score: '4.8/5', tone: 'google' }
] as const

type Props = {
  onOpenDemo: () => void
}

export function HeroSection({ onOpenDemo }: Props) {
  return (
    <section className="ac-hero ac-hero--docfav" id="inicio" aria-labelledby="ac-hero-title">
      <ResponsiveContainer wide className="ac-hero__layout">
        <div className="ac-hero__copy">
          <h1 id="ac-hero-title" className="ac-reveal">
            Software para odontólogos y clínicas dentales: toda tu clínica en un solo lugar
          </h1>
          <p className="ac-hero__lead ac-reveal ac-reveal--1">
            Agenda con recordatorios, portal del paciente, informes clínicos, presupuestos y facturación
            en un único programa. AgendaClinic automatiza la gestión para que estés en el sillón, no en el
            papeleo.
          </p>
          <ul className="ac-hero__highlights" aria-label="Ventajas principales">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.Icon
              return (
                <li key={item.text} className="ac-reveal ac-reveal--2">
                  <span className="ac-hero__highlight-icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ul>
          <div className="ac-hero__actions ac-reveal ac-reveal--3">
            <button type="button" className="ac-btn ac-btn--primary ac-btn--pill" onClick={onOpenDemo}>
              Empezar gratis
            </button>
            <button type="button" className="ac-btn ac-btn--outline ac-btn--pill" onClick={onOpenDemo}>
              Solicitar demo
            </button>
            <button
              type="button"
              className="ac-btn ac-btn--ghost ac-btn--pill"
              onClick={() => openAiAppointmentsWidget()}
            >
              Reservar cita
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="ac-hero__visual ac-reveal ac-reveal--4">
          <HeroProductShowcase />
        </div>
      </ResponsiveContainer>
      <div className="ac-hero-proof" aria-label="Valoraciones y clínicas de confianza">
        <ResponsiveContainer wide className="ac-hero-proof__inner">
          <div className="ac-hero-proof__scores">
            {PROOF.map((item) => (
              <div key={item.label} className={`ac-hero-proof__score ac-hero-proof__score--${item.tone}`}>
                <strong>{item.score}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="ac-hero-proof__metric">
            <CalendarClock className="h-4 w-4" aria-hidden />
            Más de 50 clínicas dentales ya gestionan citas, pacientes y facturación con AgendaClinic
          </p>
        </ResponsiveContainer>
        <ResponsiveContainer wide className="ac-hero-proof__logos-wrap">
          <ClinicTrustLogos compact />
        </ResponsiveContainer>
      </div>
    </section>
  )
}
