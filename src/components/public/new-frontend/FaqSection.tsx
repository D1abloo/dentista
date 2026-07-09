import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const FAQS = [
  {
    q: '¿Cómo protege AgendaClinic la seguridad de los datos en clínicas dentales?',
    a: 'La información clínica se almacena en servidores de la UE con cifrado, políticas RLS por clínica y cumplimiento estricto del RGPD. Solo el personal autorizado accede a cada expediente.'
  },
  {
    q: '¿Puedo migrar pacientes desde otro programa?',
    a: 'Sí. Ofrecemos migración asistida desde Excel, Gesden u otros sistemas. Nuestro equipo te acompaña en la importación de pacientes, citas e historial básico.'
  },
  {
    q: '¿Hay prueba gratuita para evaluar el software?',
    a: 'Sí. Puedes solicitar una demo o prueba gratuita para probar agenda, portal del paciente, informes, facturación y el asistente de citas con IA antes de contratar.'
  },
  {
    q: '¿El asistente de citas con IA inventa huecos o citas?',
    a: 'No. El asistente consulta disponibilidad real del backend y nunca expone datos sensibles sin verificación. Gemini Pro opera solo en servidor.'
  },
  {
    q: '¿Funciona en móvil y tablet?',
    a: 'Sí. AgendaClinic es 100% responsive: recepción, clínicos y pacientes pueden usar ordenador, tablet o móvil sin instalar nada.'
  },
  {
    q: '¿Qué soporte ofrecéis a clínicas nuevas?',
    a: 'Soporte en español con onboarding guiado, formación del equipo y resolución de incidencias. Contacta desde el centro de ayuda o el formulario de demo.'
  }
] as const

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section id="ayuda" className="ac-section ac-section--faq" aria-labelledby="ac-faq-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-faq-title">Preguntas frecuentes</h2>
        </header>
        <div className="ac-faq">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <article key={item.q} className={`ac-faq__item${isOpen ? ' is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="ac-faq__trigger"
                    aria-expanded={isOpen}
                    onClick={() => handleToggle(index)}
                  >
                    {item.q}
                    <ChevronDown className={`ac-faq__chev${isOpen ? ' ac-faq__chev--open' : ''}`} aria-hidden />
                  </button>
                </h3>
                {isOpen ? <p className="ac-faq__answer">{item.a}</p> : null}
              </article>
            )
          })}
        </div>
        <div className="ac-section__cta-row">
          <a href="/ayuda" className="ac-btn ac-btn--secondary ac-btn--pill">
            Ir al centro de ayuda
          </a>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
