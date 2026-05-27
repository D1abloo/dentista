import { ArrowRight, CheckCircle2, Lock, Shield, Users } from 'lucide-react'
import { HeroLaptopMobileComposition } from './HeroLaptopMobileComposition'
import { ResponsiveContainer } from './ResponsiveContainer'

const BULLETS = [
  'Reservas online con IA',
  'Portal del paciente conectado',
  'Agenda clínica en tiempo real',
  'Facturación y pagos integrados'
] as const

const BADGES = [
  { label: 'Acceso seguro', Icon: Lock },
  { label: 'Multi-clínica', Icon: Users },
  { label: 'Portal del paciente', Icon: Shield },
  { label: 'Disponibilidad real', Icon: CheckCircle2 }
] as const

type Props = {
  onOpenDemo: () => void
}

export function HeroSection({ onOpenDemo }: Props) {
  return (
    <section className="ac-hero ac-hero--editorial" id="inicio" aria-labelledby="ac-hero-title">
      <ResponsiveContainer wide className="ac-hero__layout">
        <div className="ac-hero__copy">
          <p className="ac-kicker">Software de citas clínicas</p>
          <h1 id="ac-hero-title">Gestiona citas, pacientes y agenda clínica desde una sola plataforma</h1>
          <p className="ac-hero__lead">
            AgendaClinic conecta reservas online, agenda clínica, portal del paciente, informes, documentos,
            facturación y pagos en un entorno seguro y fácil de usar.
          </p>
          <ul className="ac-hero__bullets" aria-label="Ventajas principales">
            {BULLETS.map((item) => (
              <li key={item}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <div className="ac-hero__actions">
            <a href="/citas-con-ia" className="ac-btn ac-btn--primary">
              Reservar con IA
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <button type="button" className="ac-btn ac-btn--secondary" onClick={onOpenDemo}>
              Solicitar demo
            </button>
            <a href="/citas-con-ia#consulta" className="ac-btn ac-btn--ghost">
              Consultar mis citas
            </a>
          </div>
          <div className="ac-hero__badges" aria-label="Garantías de la plataforma">
            {BADGES.map((badge) => {
              const Icon = badge.Icon
              return (
                <span key={badge.label} className="ac-hero__badge">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {badge.label}
                </span>
              )
            })}
          </div>
        </div>
        <div className="ac-hero__visual">
          <HeroLaptopMobileComposition />
        </div>
      </ResponsiveContainer>
    </section>
  )
}
