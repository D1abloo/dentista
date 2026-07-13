import { PatientBookingSection } from '@/components/booking'
import { PageState } from '@/frontend/ds'

export const PatientReservarView = () => (
  <div className="space-y-6">
    <PatientBookingSection />
    <PageState
      variant="empty"
      title="¿Prefieres ayuda?"
      description="También puedes usar el asistente IA para consultas sobre tus citas existentes."
      action={
        <a
          href="/citas-con-ia"
          className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-brand-300"
        >
          Abrir asistente IA
        </a>
      }
    />
  </div>
)
