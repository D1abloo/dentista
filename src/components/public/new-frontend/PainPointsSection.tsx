import { FileStack, PhoneCall, Receipt } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const PAINS = [
  {
    title: 'El teléfono no para y la agenda tampoco',
    text: 'Llamadas para dar cita, cambios de última hora, huecos que nadie rellena. Cada gestión manual es tiempo que no pasas con un paciente.',
    Icon: PhoneCall
  },
  {
    title: 'Presupuestos que se quedan en un cajón',
    text: 'El paciente "se lo piensa", el plan de tratamiento se enfría y nadie hace seguimiento. Cada presupuesto sin respuesta es facturación perdida.',
    Icon: Receipt
  },
  {
    title: 'Historia clínica repartida en mil sitios',
    text: 'Fichas en papel, radiografías sueltas, consentimientos en carpetas. Encontrar la evolución de un tratamiento es una expedición.',
    Icon: FileStack
  }
] as const

export function PainPointsSection() {
  return (
    <section className="ac-section ac-section--pain" aria-labelledby="ac-pain-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-pain-title">¿Pasas más tiempo gestionando tu consulta que atendiendo pacientes?</h2>
        </header>
        <div className="ac-grid ac-grid--3 ac-pain-grid">
          {PAINS.map((pain) => {
            const Icon = pain.Icon
            return (
              <article key={pain.title} className="ac-card ac-card--pain">
                <span className="ac-card__icon ac-card__icon--pain">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{pain.title}</h3>
                <p>{pain.text}</p>
              </article>
            )
          })}
        </div>
      </ResponsiveContainer>
    </section>
  )
}
