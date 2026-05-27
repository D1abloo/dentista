import type { ProPlan } from '@/components/public/ProAccessForm'
import { ResponsiveContainer } from './ResponsiveContainer'

const PLANS: Array<{
  key: string
  title: string
  price: string
  cta: string
  demoPlan?: ProPlan
  featured?: boolean
  bullets: string[]
}> = [
  {
    key: 'esencial',
    title: 'Esencial',
    price: 'Desde 79€/mes',
    cta: 'Solicitar demo esencial',
    demoPlan: 'pro_clinica',
    bullets: ['Agenda básica', 'Portal paciente', 'Citas online']
  },
  {
    key: 'profesional',
    title: 'Profesional',
    price: 'Desde 149€/mes',
    cta: 'Solicitar demo profesional',
    demoPlan: 'pro_clinica',
    featured: true,
    bullets: ['Asistente IA', 'Facturación', 'Documentos e informes']
  },
  {
    key: 'multi-sede',
    title: 'Multi-sede',
    price: 'Desde 299€/mes',
    cta: 'Solicitar demo multi-sede',
    demoPlan: 'pro_multi',
    bullets: ['Varias clínicas', 'Gestión centralizada', 'Permisos por sede']
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    price: 'Personalizado',
    cta: 'Hablar con ventas',
    demoPlan: 'pro_multi',
    bullets: ['Auditoría avanzada', 'Soporte prioritario', 'Monitorización']
  }
]

type Props = {
  onOpenDemo: (plan?: ProPlan) => void
}

export function PricingSection({ onOpenDemo }: Props) {
  return (
    <section id="planes" className="ac-section ac-section--light" aria-labelledby="ac-pricing-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Planes</p>
          <h2 id="ac-pricing-title">Escala AgendaClinic al ritmo de tu clínica</h2>
        </header>
        <div className="ac-grid ac-grid--4">
          {PLANS.map((plan) => (
            <article key={plan.key} className={`ac-card${plan.featured ? ' ac-card--featured' : ''}`}>
              {plan.featured ? <span className="ac-badge">Recomendado</span> : null}
              <h3>{plan.title}</h3>
              <p className="ac-price">{plan.price}</p>
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
      </ResponsiveContainer>
    </section>
  )
}
