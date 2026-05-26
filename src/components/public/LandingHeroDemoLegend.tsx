import { Calendar, LayoutDashboard, UserRound } from 'lucide-react'

const LEGEND_ITEMS = [
  {
    icon: LayoutDashboard,
    label: 'Panel de clínica',
    text: 'Agenda, pacientes, informes y facturación en tiempo real.'
  },
  {
    icon: UserRound,
    label: 'Portal del paciente',
    text: 'Citas, documentos, facturas y mensajes desde el móvil.'
  },
  {
    icon: Calendar,
    label: 'Reserva conectada',
    text: 'Huecos reales y asistente de citas con IA en la web pública.'
  }
] as const

export function LandingHeroDemoLegend() {
  return (
    <div className="ps-hero-mocks__legend" aria-label="Qué muestra la demostración visual">
      {LEGEND_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <article key={item.label} className="ps-hero-mocks__legend-item">
            <span className="ps-hero-mocks__legend-icon" aria-hidden>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.text}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
