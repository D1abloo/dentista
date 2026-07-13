import { useMemo } from 'react'
import { Bot } from 'lucide-react'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Container, PageHeader } from '@/frontend/ds'
import { AiBookingExperience } from '@/frontend/features/ai/AiBookingExperience'

export const CitasConIaPage = () => {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('q') ?? undefined
  }, [])

  return (
    <PublicShell>
      <main id="main-content" className="py-10 sm:py-14">
        <Container>
          <PageHeader
            eyebrow="Citas dentales online"
            title="Asistente de citas con IA"
            description="Reserva, consulta, cambia o cancela con verificación de identidad. Gemini Pro en servidor."
          />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
            <Bot className="h-3.5 w-3.5" aria-hidden />
            Disponibilidad real · RGPD
          </div>
          <AiBookingExperience initialQuery={initialQuery} />
        </Container>
      </main>
    </PublicShell>
  )
}
