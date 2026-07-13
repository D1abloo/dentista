import {
  BellRing,
  CalendarCheck,
  FileText,
  Receipt,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const BENEFITS = [
  {
    title: 'Ahorra tiempo cada semana',
    text: 'Las citas se confirman solas, los recordatorios se envían solos y las facturas se generan en un clic.',
    Icon: CalendarCheck
  },
  {
    title: 'Menos sillones vacíos',
    text: 'Recordatorios automáticos por WhatsApp, SMS y email antes de cada cita reducen las ausencias.',
    Icon: BellRing
  },
  {
    title: 'Historia clínica dental unificada',
    text: 'Ficha por paciente con tratamientos, evolutivos, imágenes y documentos accesibles en segundos.',
    Icon: FileText
  },
  {
    title: 'Facturación tranquila',
    text: 'Facturas conformes, series y numeración automáticas. Presupuestos vinculados a cada tratamiento.',
    Icon: Receipt
  },
  {
    title: 'Reservas sin llamadas',
    text: 'Portal y asistente para que el paciente reserve, cambie o confirme su cita 24/7.',
    Icon: Sparkles
  },
  {
    title: 'Datos protegidos RGPD',
    text: 'Cifrado, aislamiento por clínica y auditoría. Servidores en la UE con copias de seguridad.',
    Icon: ShieldCheck
  }
] as const

type Props = {
  onOpenDemo: () => void
}

export function BenefitsSection({ onOpenDemo }: Props) {
  return (
    <section className="ac-section ac-section--tint" id="citas-online" aria-labelledby="ac-benefits-title">
      <ResponsiveContainer wide>
        <div id="consulta-cita" className="ac-benefits-anchor" aria-hidden />
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-benefits-title">Lo que cambia cuando gestionas tu clínica desde un único programa</h2>
        </header>
        <div className="ac-grid ac-grid--3 ac-benefits-grid">
          {BENEFITS.map((item) => {
            const Icon = item.Icon
            return (
              <article key={item.title} className="ac-card ac-card--benefit">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            )
          })}
        </div>
        <div className="ac-section__cta-row">
          <button type="button" className="ac-btn ac-btn--primary ac-btn--pill" onClick={onOpenDemo}>
            Probar AgendaClinic gratis
          </button>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
