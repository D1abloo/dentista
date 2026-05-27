import { useEffect, useState } from 'react'
import { CookieBanner } from './CookieBanner'
import { type ProPlan } from './ProAccessForm'
import { AiAppointmentsSection } from './new-frontend/AiAppointmentsSection'
import { AppFooter } from './new-frontend/AppFooter'
import { AppHeader } from './new-frontend/AppHeader'
import { ArticleFeatureSection } from './new-frontend/ArticleFeatureSection'
import { DemoFormModal } from './new-frontend/DemoFormModal'
import { FinalCTA } from './new-frontend/FinalCTA'
import { HelpPreviewSection } from './new-frontend/HelpPreviewSection'
import { HeroSection } from './new-frontend/HeroSection'
import { PricingSection } from './new-frontend/PricingSection'
import { QuickAccessCards } from './new-frontend/QuickAccessCards'
import { RoleModulesSection } from './new-frontend/RoleModulesSection'
import { TrustStrip } from './new-frontend/TrustStrip'
import { WorkflowSection } from './new-frontend/WorkflowSection'

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
    <>
      <AppHeader onOpenDemo={() => openDemo('pro_clinica')} />
      <main className="ac-landing">
        <HeroSection onOpenDemo={() => openDemo('pro_clinica')} />
        <TrustStrip />
        <QuickAccessCards />
        <AiAppointmentsSection />
        <WorkflowSection />
        <ArticleFeatureSection />
        <RoleModulesSection />
        <PricingSection onOpenDemo={openDemo} />
        <HelpPreviewSection />
        <FinalCTA onOpenDemo={() => openDemo('pro_clinica')} />
      </main>

      <DemoFormModal open={demoOpen} plan={plan} onPlanChange={setPlan} onClose={() => setDemoOpen(false)} />
      <AppFooter />
      <CookieBanner />
    </>
  )
}
