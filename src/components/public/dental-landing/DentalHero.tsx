import { ArrowRight, CheckCircle2, Lock, Shield, Sparkles } from 'lucide-react'
import { DentalContainer } from './DentalContainer'
import { DentalHeroVisual } from './DentalHeroVisual'

const HIGHLIGHTS = [
  { label: 'Citas online', tone: 'teal' },
  { label: 'Disponibilidad real', tone: 'navy' },
  { label: 'Portal paciente', tone: 'sky' },
  { label: 'Agenda clínica', tone: 'mint' }
] as const

const BADGES = [
  { label: 'Sin llamadas innecesarias', Icon: Sparkles },
  { label: 'Horarios reales', Icon: CheckCircle2 },
  { label: 'Portal paciente', Icon: Shield },
  { label: 'Datos protegidos', Icon: Lock }
] as const

const STATS = [
  { value: '24/7', label: 'Reservas online' },
  { value: '100%', label: 'Huecos reales' },
  { value: 'RGPD', label: 'Datos protegidos' }
] as const

type Props = {
  onOpenDemo: () => void
}

export const DentalHero = ({ onOpenDemo }: Props) => (
  <section className="adb-hero pub-v2-hero" id="inicio" aria-labelledby="adb-hero-title">
    <DentalContainer wide className="adb-hero__grid">
      <div className="adb-hero__copy">
        <p className="adb-kicker pub-v2-reveal pub-v2-reveal--1">Citas dentales online</p>
        <h1 id="adb-hero-title" className="pub-v2-reveal pub-v2-reveal--2">
          La plataforma que conecta tu clínica con tus pacientes
        </h1>
        <p className="adb-lead pub-v2-reveal pub-v2-reveal--3">
          AgendaClinic unifica reservas online, agenda profesional, recordatorios y portal del paciente en una
          experiencia premium, segura y pensada para odontología.
        </p>
        <div className="adb-hero__highlights pub-v2-reveal pub-v2-reveal--3" aria-label="Ventajas principales">
          {HIGHLIGHTS.map((item) => (
            <span key={item.label} className={`adb-pill adb-pill--${item.tone}`}>
              {item.label}
            </span>
          ))}
        </div>
        <div className="adb-hero__actions pub-v2-reveal pub-v2-reveal--4">
          <a href="/citas-con-ia" className="adb-btn adb-btn--primary">
            Reservar cita online
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a href="#consulta-cita" className="adb-btn adb-btn--secondary">
            Consultar mi cita
          </a>
          <button type="button" className="adb-btn adb-btn--ghost" onClick={onOpenDemo}>
            Solicitar demo para clínica
          </button>
        </div>
        <ul className="pub-v2-hero__stats pub-v2-reveal pub-v2-reveal--5" aria-label="Indicadores clave">
          {STATS.map((stat) => (
            <li key={stat.label} className="pub-v2-hero__stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>
        <div className="adb-hero__badges pub-v2-reveal pub-v2-reveal--5">
          {BADGES.map((badge) => {
            const Icon = badge.Icon
            return (
              <span key={badge.label} className="adb-trust-badge">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {badge.label}
              </span>
            )
          })}
        </div>
      </div>
      <div className="pub-v2-reveal pub-v2-reveal--4">
        <DentalHeroVisual />
      </div>
    </DentalContainer>
  </section>
)
