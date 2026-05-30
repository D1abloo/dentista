import { useEffect, useState } from 'react'
import { CookieBanner } from './CookieBanner'
import { type ProPlan } from './ProAccessForm'
import { DemoFormModal } from './new-frontend/DemoFormModal'
import { BookingWorkflowSection } from './dental-landing/BookingWorkflowSection'
import { ClinicFeaturesSection } from './dental-landing/ClinicFeaturesSection'
import { ClinicManagementSection } from './dental-landing/ClinicManagementSection'
import { DentalAiSection } from './dental-landing/DentalAiSection'
import { DentalFinalCta } from './dental-landing/DentalFinalCta'
import { DentalFooter } from './dental-landing/DentalFooter'
import { DentalHeader } from './dental-landing/DentalHeader'
import { DentalHero } from './dental-landing/DentalHero'
import { DentalPricingSection } from './dental-landing/DentalPricingSection'
import { HelpFaqSection } from './dental-landing/HelpFaqSection'
import { PatientExperienceSection } from './dental-landing/PatientExperienceSection'
import { PublicLookupSection } from './dental-landing/PublicLookupSection'
import { QuickAppointmentActions } from './dental-landing/QuickAppointmentActions'
import { SecuritySection } from './dental-landing/SecuritySection'

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
      <DentalHeader onOpenDemo={() => openDemo('pro_clinica')} />
      <main className="adb-landing">
        <DentalHero onOpenDemo={() => openDemo('pro_clinica')} />
        <QuickAppointmentActions />
        <PublicLookupSection />
        <DentalAiSection />
        <ClinicFeaturesSection />
        <BookingWorkflowSection />
        <PatientExperienceSection />
        <ClinicManagementSection />
        <SecuritySection />
        <DentalPricingSection onOpenDemo={openDemo} />
        <HelpFaqSection />
        <DentalFinalCta onOpenDemo={() => openDemo('pro_clinica')} />
      </main>
      <DemoFormModal open={demoOpen} plan={plan} onPlanChange={setPlan} onClose={() => setDemoOpen(false)} />
      <DentalFooter />
      <CookieBanner />
    </>
  )
}
