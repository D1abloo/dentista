import type { ProPlan } from '@/components/public/ProAccessForm'
import { Check } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const PLANS: Array<{
  key: string
  title: string
  price: string
  desc: string
  cta: string
  demoPlan?: ProPlan
  featured?: boolean
  bullets: string[]
}> = [
  {
    key: 'esencial',
    title: 'Esencial',
    price: 'Desde 79€/mes',
    desc: 'Para clínicas que empiezan a digitalizar citas y portal del paciente.',
    cta: 'Empezar gratis',
    demoPlan: 'pro_clinica',
    bullets: ['Agenda básica', 'Portal paciente', 'Reservas online', 'Recordatorios']
  },
  {
    key: 'profesional',
    title: 'Profesional',
    price: 'Desde 149€/mes',
    desc: 'Gestión completa con IA, informes, documentos y facturación integrada.',
    cta: 'Probar 14 días gratis',
    demoPlan: 'pro_clinica',
    featured: true,
    bullets: ['Asistente IA de citas', 'Informes y documentos', 'Facturación y pagos', 'Soporte prioritario']
  },
  {
    key: 'multi-sede',
    title: 'Multi-sede',
    price: 'Desde 299€/mes',
    desc: 'Varias clínicas bajo una misma organización con permisos por sede.',
    cta: 'Solicitar información',
    demoPlan: 'pro_multi',
    bullets: ['Gestión centralizada', 'Permisos por sede', 'Reportes consolidados', 'Onboarding guiado']
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    price: 'Personalizado',
    desc: 'Para grupos dentales y cadenas con requisitos avanzados de seguridad.',
    cta: 'Contactar ventas',
    demoPlan: 'pro_multi',
    bullets: ['Auditoría avanzada', 'SLA dedicado', 'Integraciones a medida', 'Formación del equipo']
  }
]

const INCLUDED_ALL = [
  'Cifrado y acceso seguro',
  'Actualizaciones incluidas',
  'Soporte en español',
  'Copias de seguridad'
] as const

type Props = {
  onOpenDemo: (plan?: ProPlan) => void
}

export function PricingSection({ onOpenDemo }: Props) {
  return (
    <section id="planes" className="ac-section ac-section--tint" aria-labelledby="ac-pricing-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Planes</p>
          <h2 id="ac-pricing-title">Elige cómo quieres empezar</h2>
          <p>Empieza con lo básico o activa la gestión completa de tu clínica con AgendaClinic.</p>
        </header>
        <div className="ac-grid ac-grid--4">
          {PLANS.map((plan) => (
            <article key={plan.key} className={`ac-card ac-card--pricing${plan.featured ? ' ac-card--featured' : ''}`}>
              {plan.featured ? <span className="ac-badge">Profesional</span> : null}
              <h3>{plan.title}</h3>
              <p className="ac-price">{plan.price}</p>
              <p className="ac-card__desc">{plan.desc}</p>
              <ul className="ac-list">
                {plan.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" className="ac-btn ac-btn--primary" onClick={() => onOpenDemo(plan.demoPlan)}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
        <div className="ac-pricing-included" aria-label="Incluido en todos los planes">
          <strong>Incluido en todos los planes</strong>
          <ul>
            {INCLUDED_ALL.map((item) => (
              <li key={item}>
                <Check className="h-3.5 w-3.5" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
