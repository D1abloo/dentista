import { openAiAppointmentsWidget } from '@/lib/public/aiWidget'
import { ClipboardCheck, CreditCard, FileText, Stethoscope, UserRound } from 'lucide-react'
import { useState } from 'react'
import { ResponsiveContainer } from './ResponsiveContainer'

const STEPS = [
  {
    title: 'El paciente reserva',
    text: 'El paciente elige clínica, tratamiento, profesional, fecha y hora disponible.',
    Icon: UserRound,
    mini: 'Reserva online',
    previewTitle: 'Reserva online conectada con disponibilidad real',
    previewText:
      'AgendaClinic solo muestra huecos disponibles, respetando horarios, citas ocupadas, bloqueos y profesionales activos.',
    bullets: ['Disponibilidad real', 'Sin huecos duplicados', 'Bloqueos respetados', 'Confirmación automática o manual'],
    cta: { label: 'Reservar cita', widget: true as const }
  },
  {
    title: 'La clínica organiza',
    text: 'Recepción gestiona agenda, bloqueos horarios y disponibilidad.',
    Icon: ClipboardCheck,
    mini: 'Agenda · Bloqueos',
    previewTitle: 'Agenda clínica para recepción',
    previewText: 'Organiza el día con vistas por profesional, bloqueos visibles y recordatorios automáticos.',
    bullets: ['Vista día y semana', 'Bloqueos horarios', 'Recordatorios', 'Búsqueda rápida'],
    cta: { href: '/login/admin', label: 'Ver agenda clínica' }
  },
  {
    title: 'El doctor documenta',
    text: 'El profesional crea informes odontológicos y adjunta documentos.',
    Icon: Stethoscope,
    mini: 'Informes · Firma',
    previewTitle: 'Informes y documentación clínica',
    previewText: 'Plantillas, firma profesional e historial de visitas en un flujo unificado.',
    bullets: ['Informes odontológicos', 'Plantillas', 'Firma profesional', 'Historial'],
    cta: { href: '/login/admin', label: 'Ver módulo clínico' }
  },
  {
    title: 'Administración factura',
    text: 'La clínica genera facturas PDF, registra pagos y comparte recibos.',
    Icon: CreditCard,
    mini: 'Facturas · Pagos',
    previewTitle: 'Facturación y pagos integrados',
    previewText: 'Emite facturas, registra cobros y vincula cada pago con paciente y cita.',
    bullets: ['Facturas PDF', 'Pagos y recibos', 'Reportes', 'Exportaciones'],
    cta: { href: '/login/admin', label: 'Ver facturación' }
  },
  {
    title: 'El paciente lo consulta',
    text: 'Citas, informes, documentos, facturas y mensajes aparecen en el portal.',
    Icon: FileText,
    mini: 'Portal · Mensajes',
    previewTitle: 'Portal del paciente conectado',
    previewText: 'El paciente accede de forma segura a citas, documentos, facturas y consentimientos.',
    bullets: ['Mis citas', 'Informes', 'Facturas', 'Mensajes'],
    cta: { href: '/portal-paciente', label: 'Entrar al portal' }
  }
] as const

export function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0)
  const preview = STEPS[activeStep]

  return (
    <section id="como-funciona" className="ac-section ac-section--workflow" aria-labelledby="ac-workflow-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Cómo funciona</p>
          <h2 id="ac-workflow-title">Así trabaja una clínica con AgendaClinic</h2>
          <p>
            Desde la reserva de cita hasta el informe, la factura y el portal del paciente, todo queda conectado en
            una sola plataforma.
          </p>
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
                <small>{step.text}</small>
                <span className="ac-workflow__mini" aria-hidden>
                  {step.mini}
                </span>
              </button>
            )
          })}
        </div>

        <article className="ac-workflow-preview ac-workflow-preview--rich" aria-live="polite">
          <div>
            <p className="ac-kicker">Paso {activeStep + 1}</p>
            <h3>{preview.previewTitle}</h3>
            <p>{preview.previewText}</p>
            <ul>
              {preview.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {'widget' in preview.cta ? (
              <button type="button" className="ac-btn ac-btn--primary" onClick={() => openAiAppointmentsWidget()}>
                {preview.cta.label}
              </button>
            ) : (
              <a href={preview.cta.href} className="ac-btn ac-btn--primary">
                {preview.cta.label}
              </a>
            )}
          </div>
          <div className="ac-workflow-preview__visual" role="img" aria-label={preview.previewTitle}>
            <div className="ac-workflow-preview__screen">
              <header>{preview.title}</header>
              <div className="ac-workflow-preview__bars">
                <span style={{ width: '88%' }} />
                <span style={{ width: '72%' }} />
                <span style={{ width: '94%' }} />
                <span style={{ width: '65%' }} />
              </div>
              <footer>{preview.mini}</footer>
            </div>
          </div>
        </article>
      </ResponsiveContainer>
    </section>
  )
}
