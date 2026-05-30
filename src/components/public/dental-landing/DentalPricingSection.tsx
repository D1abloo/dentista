import type { ProPlan } from '@/components/public/ProAccessForm'
import { Check } from 'lucide-react'
import { DentalContainer } from './DentalContainer'

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
    desc: 'Reservas online y portal del paciente para empezar.',
    cta: 'Empezar gratis',
    demoPlan: 'pro_clinica',
    bullets: ['Citas online', 'Agenda básica', 'Portal paciente', 'Recordatorios']
  },
  {
    key: 'profesional',
    title: 'Profesional',
    price: 'Desde 149€/mes',
    desc: 'Gestión completa con IA, informes y facturación.',
    cta: 'Probar 14 días gratis',
    demoPlan: 'pro_clinica',
    featured: true,
    bullets: ['Asistente IA', 'Disponibilidad real', 'Facturación', 'Informes clínicos']
  },
  {
    key: 'multi-sede',
    title: 'Multi-sede',
    price: 'Desde 299€/mes',
    desc: 'Varias clínicas bajo una organización.',
    cta: 'Solicitar información',
    demoPlan: 'pro_multi',
    bullets: ['Multi-clínica', 'Permisos por sede', 'Reportes', 'Onboarding']
  },
  {
    key: 'enterprise',
    title: 'Enterprise',
    price: 'Personalizado',
    desc: 'Grupos dentales con requisitos avanzados.',
    cta: 'Contactar ventas',
    demoPlan: 'pro_multi',
    bullets: ['SLA dedicado', 'Auditoría', 'Integraciones', 'Formación']
  }
]

type Props = {
  onOpenDemo: (plan?: ProPlan) => void
}

export const DentalPricingSection = ({ onOpenDemo }: Props) => (
  <section id="planes" className="adb-section" aria-labelledby="adb-pricing-title">
    <DentalContainer wide>
      <header className="adb-section-head adb-section-head--center">
        <p className="adb-kicker">Planes</p>
        <h2 id="adb-pricing-title">Planes para gestionar citas online</h2>
        <p>Elige el plan que mejor se adapte a tu clínica dental.</p>
      </header>
      <div className="adb-grid adb-grid--4">
        {PLANS.map((plan) => (
          <article key={plan.key} className={`adb-price-card${plan.featured ? ' is-featured' : ''}`}>
            {plan.featured ? <span className="adb-badge">Profesional</span> : null}
            <h3>{plan.title}</h3>
            <p className="adb-price">{plan.price}</p>
            <p className="adb-price-card__desc">{plan.desc}</p>
            <ul className="adb-list">
              {plan.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button type="button" className="adb-btn adb-btn--primary adb-btn--block" onClick={() => onOpenDemo(plan.demoPlan)}>
              {plan.cta}
            </button>
          </article>
        ))}
      </div>
      <div className="adb-included">
        <strong>Incluido en todos los planes</strong>
        <ul>
          {['Cifrado HTTPS', 'Soporte en español', 'Actualizaciones', 'Copias de seguridad'].map((item) => (
            <li key={item}>
              <Check className="h-3.5 w-3.5" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </DentalContainer>
  </section>
)
