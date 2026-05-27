import { useState } from 'react'
import { CookieBanner } from './CookieBanner'
import { type ProPlan } from './ProAccessForm'
import { AiAppointmentsAssistant } from './new-frontend/AiAppointmentsAssistant'
import { AppFooter } from './new-frontend/AppFooter'
import { AppHeader } from './new-frontend/AppHeader'
import { DemoFormModal } from './new-frontend/DemoFormModal'
import { HelpPreviewSection } from './new-frontend/HelpPreviewSection'
import { HeroSection } from './new-frontend/HeroSection'
import { PricingSection } from './new-frontend/PricingSection'
import { QuickAccessCards } from './new-frontend/QuickAccessCards'
import { ResponsiveContainer } from './new-frontend/ResponsiveContainer'
import { RoleModulesSection } from './new-frontend/RoleModulesSection'
import { WorkflowSection } from './new-frontend/WorkflowSection'

export function LandingPage() {
  const [plan, setPlan] = useState<ProPlan>('pro_clinica')
  const [demoOpen, setDemoOpen] = useState(false)

  const openDemo = (nextPlan: ProPlan = 'pro_clinica') => {
    setPlan(nextPlan)
    setDemoOpen(true)
  }

  return (
    <>
      <AppHeader onOpenDemo={() => openDemo('pro_clinica')} />
      <main className="ac-landing">
        <HeroSection onOpenDemo={() => openDemo('pro_clinica')} />
        <QuickAccessCards />
        <AiAppointmentsAssistant />
        <WorkflowSection />
        <RoleModulesSection />
        <PricingSection onOpenDemo={openDemo} />
        <HelpPreviewSection />

        <section className="ac-final-cta" aria-labelledby="ac-final-cta-title">
          <ResponsiveContainer wide className="ac-final-cta__inner">
            <h2 id="ac-final-cta-title">AgendaClinic te ayuda a operar mejor desde hoy</h2>
            <p>Activa tu flujo de citas con IA y conecta a todo tu equipo clínico.</p>
            <div className="ac-final-cta__actions">
              <a href="/citas-con-ia" className="ac-btn ac-btn--primary">
                Reservar con IA
              </a>
              <button type="button" className="ac-btn ac-btn--secondary" onClick={() => openDemo('pro_clinica')}>
                Solicitar demo
              </button>
            </div>
          </ResponsiveContainer>
        </section>
      </main>

      <DemoFormModal open={demoOpen} plan={plan} onPlanChange={setPlan} onClose={() => setDemoOpen(false)} />
      <AppFooter />
      <CookieBanner />
    </>
  )
}
