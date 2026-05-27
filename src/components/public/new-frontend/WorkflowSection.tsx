import { ClipboardCheck, CreditCard, FileText, Stethoscope, UserRound } from 'lucide-react'
import { useState } from 'react'
import { ResponsiveContainer } from './ResponsiveContainer'

const STEPS = [
  {
    title: 'El paciente reserva',
    description: 'Reserva online con IA o desde recepción.',
    Icon: UserRound,
    detail:
      'El paciente reserva desde web o asistente IA. Se registran motivo, preferencia de fecha y disponibilidad real.'
  },
  {
    title: 'La clínica organiza',
    description: 'La agenda coordina recursos y profesionales.',
    Icon: ClipboardCheck,
    detail:
      'Recepción revisa conflictos, asigna profesional y activa recordatorios para reducir ausencias.'
  },
  {
    title: 'El doctor documenta',
    description: 'Todo el historial queda actualizado.',
    Icon: Stethoscope,
    detail:
      'El doctor completa informe, sube documentos y deja trazabilidad para próximas visitas.'
  },
  {
    title: 'Administración factura',
    description: 'Facturas y cobros sincronizados.',
    Icon: CreditCard,
    detail:
      'Administración emite factura, registra pagos y controla saldos sin salir del flujo clínico.'
  },
  {
    title: 'El paciente lo consulta',
    description: 'Acceso seguro desde su portal.',
    Icon: FileText,
    detail:
      'El paciente visualiza sus citas, documentos y facturas, con acceso protegido en portal privado.'
  }
] as const

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section id="como-funciona" className="ac-section ac-section--light" aria-labelledby="ac-workflow-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Cómo funciona</p>
          <h2 id="ac-workflow-title">Así trabaja una clínica con AgendaClinic</h2>
        </header>

        <div className="ac-workflow">
          {STEPS.map((step, index) => {
            const Icon = step.Icon
            return (
              <button
                key={step.title}
                type="button"
                className={`ac-workflow__step${index === activeStep ? ' is-active' : ''}`}
                onClick={() => setActiveStep(index)}
                aria-pressed={index === activeStep}
              >
                <span className="ac-workflow__number">{index + 1}</span>
                <span className="ac-workflow__icon">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <strong>{step.title}</strong>
                <small>{step.description}</small>
              </button>
            )
          })}
        </div>

        <article className="ac-workflow-preview" aria-live="polite">
          <h3>{STEPS[activeStep]?.title}</h3>
          <p>{STEPS[activeStep]?.detail}</p>
        </article>
      </ResponsiveContainer>
    </section>
  )
}
