import { CalendarCheck2, HeartPulse, ShieldCheck, Sparkles } from 'lucide-react'

const TRUST_ITEMS = [
  {
    title: 'Citas inteligentes con IA',
    text: 'Reserva, consulta y cambia citas con un asistente guiado en español.',
    Icon: Sparkles
  },
  {
    title: 'Operativa clínica unificada',
    text: 'Agenda, pacientes, informes y facturación en una sola vista de trabajo.',
    Icon: CalendarCheck2
  },
  {
    title: 'Seguridad y verificación',
    text: 'Controles de identidad para cambios sensibles y acceso por roles.',
    Icon: ShieldCheck
  }
] as const

export function LandingTrustStrip() {
  return (
    <section className="ps-trust-strip" aria-labelledby="ps-trust-strip-title">
      <div className="ps-shell ps-shell--wide">
        <div className="ps-trust-strip__head">
          <p className="ps-trust-strip__kicker">NUEVA EXPERIENCIA PÚBLICA</p>
          <h2 id="ps-trust-strip-title">Todo lo importante de AgendaClinic, sin ruido</h2>
          <p>
            Hemos renovado la visualización para que pacientes y clínicas entiendan el flujo completo en segundos y
            actúen desde el primer clic.
          </p>
        </div>

        <div className="ps-trust-strip__grid">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.Icon
            return (
              <article key={item.title} className="ps-trust-strip__card">
                <span className="ps-trust-strip__icon" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>

        <div className="ps-trust-strip__actions">
          <a href="/citas-con-ia" className="ps-btn ps-btn--primary">
            Probar asistente de citas
          </a>
          <a href="/portal-paciente" className="ps-btn ps-btn--demo-outline">
            Ir al portal paciente
          </a>
        </div>
      </div>
    </section>
  )
}
