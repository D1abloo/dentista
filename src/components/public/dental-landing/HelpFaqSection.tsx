import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { DentalContainer } from './DentalContainer'

const HELP = [
  { title: 'Cómo reservar cita', href: '/ayuda', text: 'Guía paso a paso para reservar online.' },
  { title: 'Cómo consultar mi cita', href: '/ayuda', text: 'Usa email, DNI o NHC.' },
  { title: 'Cómo cambiar una cita', href: '/ayuda', text: 'Reprogramación con verificación.' },
  { title: 'Cómo cancelar una cita', href: '/ayuda', text: 'Política y pasos de cancelación.' },
  { title: 'Ayuda para clínicas', href: '/ayuda', text: 'Agenda, pacientes y facturación.' },
  { title: 'Ayuda para pacientes', href: '/ayuda', text: 'Portal, citas y documentos.' }
] as const

const FAQ = [
  {
    q: '¿Puedo reservar cita sin llamar?',
    a: 'Sí. Puedes reservar online con el asistente IA o el formulario de reserva, eligiendo tratamiento, profesional y hueco disponible.'
  },
  {
    q: '¿Cómo sé si tengo una cita?',
    a: 'Introduce tu email, DNI o NHC en la consulta rápida o accede al Portal del Paciente.'
  },
  {
    q: '¿Puedo cambiar una cita online?',
    a: 'Sí, con verificación de identidad reforzada o iniciando sesión en el portal paciente.'
  },
  {
    q: '¿Qué hago si no encuentro mi cita?',
    a: 'Comprueba los datos introducidos, reserva una nueva cita o contacta con tu clínica.'
  },
  {
    q: '¿Cómo bloquea horarios la clínica?',
    a: 'Desde el panel clínica puedes crear bloqueos por profesional, sala o clínica completa.'
  },
  {
    q: '¿Los pacientes ven horarios bloqueados?',
    a: 'No. Solo se muestran huecos realmente disponibles para reservar.'
  }
] as const

export const HelpFaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="ayuda" className="adb-section adb-section--tint" aria-labelledby="adb-help-title">
      <DentalContainer wide>
        <header className="adb-section-head adb-section-head--center">
          <p className="adb-kicker">Ayuda</p>
          <h2 id="adb-help-title">Centro de ayuda para citas online</h2>
        </header>
        <div className="adb-grid adb-grid--3 adb-help-grid">
          {HELP.map((card) => (
            <article key={card.title} className="adb-help-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <a href={card.href} className="adb-btn adb-btn--ghost adb-btn--sm">
                Leer guía
              </a>
            </article>
          ))}
        </div>

        <div className="adb-faq">
          <h3 className="adb-faq__title">Preguntas frecuentes</h3>
          {FAQ.map((item, index) => {
            const open = openIndex === index
            return (
              <div key={item.q} className={`adb-faq__item${open ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="adb-faq__trigger"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                >
                  {item.q}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
                {open ? <p className="adb-faq__answer">{item.a}</p> : null}
              </div>
            )
          })}
        </div>

        <div className="adb-help-cta">
          <a href="/ayuda" className="adb-btn adb-btn--primary">
            Ir al centro de ayuda
          </a>
        </div>
      </DentalContainer>
    </section>
  )
}
