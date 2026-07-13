import { useEffect, useState } from 'react'
import { type ProPlan } from './ProAccessForm'
import { BenefitsSection } from './new-frontend/BenefitsSection'
import { DemoFormModal } from './new-frontend/DemoFormModal'
import { FaqSection } from './new-frontend/FaqSection'
import { FinalCTA } from './new-frontend/FinalCTA'
import { HeroSection } from './new-frontend/HeroSection'
import { ModulesTabSection } from './new-frontend/ModulesTabSection'
import { PainPointsSection } from './new-frontend/PainPointsSection'
import { PricingSection } from './new-frontend/PricingSection'
import { SecurityTrustSection } from './new-frontend/SecurityTrustSection'
import { TestimonialsSection } from './new-frontend/TestimonialsSection'
import { WorkflowSection } from './new-frontend/WorkflowSection'
import { AiAppointmentsSection } from './new-frontend/AiAppointmentsSection'
import { PublicSiteShell } from './PublicSiteShell'

export function LandingPage() {
  const [plan, setPlan] = useState<ProPlan>('pro_clinica')
  const [demoOpen, setDemoOpen] = useState(false)

  const openDemo = (nextPlan: ProPlan = 'pro_clinica') => {
    setPlan(nextPlan)
    setDemoOpen(true)
  }

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'contacto-pro') setDemoOpen(true)
    const q = new URLSearchParams(window.location.search).get('plan')
    if (q === 'pro_multi' || q === 'pro_clinica') setPlan(q)
  }, [])

  return (
    <PublicSiteShell onOpenDemo={() => openDemo('pro_clinica')}>
      <main className="ac-landing ac-landing--docfav" id="main-content">
        <HeroSection onOpenDemo={() => openDemo('pro_clinica')} />
        <PainPointsSection />
        <BenefitsSection onOpenDemo={() => openDemo('pro_clinica')} />
        <ModulesTabSection />
        <WorkflowSection />
        <AiAppointmentsSection />
        <SecurityTrustSection />
        <TestimonialsSection onOpenDemo={() => openDemo('pro_clinica')} />
        <PricingSection onOpenDemo={openDemo} />
        <FaqSection />
        <FinalCTA onOpenDemo={() => openDemo('pro_clinica')} />
      </main>
      <DemoFormModal open={demoOpen} plan={plan} onPlanChange={setPlan} onClose={() => setDemoOpen(false)} />
    </PublicSiteShell>
  )
}
