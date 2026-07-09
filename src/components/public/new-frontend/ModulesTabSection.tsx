import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { FeatureVisualMocks } from './FeatureVisualMocks'
import { ResponsiveContainer } from './ResponsiveContainer'

const MODULES = [
  {
    key: 'agenda',
    tab: 'Agenda online',
    kicker: 'Agenda online',
    title: 'Agenda odontológica: citas por profesional y gabinete, sin huecos ni solapamientos',
    text: 'Organiza las citas de toda la clínica en una vista visual. Los recordatorios se envían solos antes de cada cita.',
    bullets: [
      'Vista diaria, semanal o mensual por profesional y gabinete',
      'Recordatorios automáticos por WhatsApp, SMS o email',
      'Citas recurrentes para ortodoncia y tratamientos por fases',
      'Sincronización con calendarios externos',
      'Disponible desde ordenador, tablet y móvil'
    ],
    cta: { href: '/login/admin', label: 'Ver agenda clínica' },
    variant: 'agenda' as const
  },
  {
    key: 'historia',
    tab: 'Historias clínicas',
    kicker: 'Historias clínicas',
    title: 'Historia clínica dental con la evolución de cada tratamiento',
    text: 'Plantillas pensadas para odontología. Registra anamnesis, evolutivos y consentimientos en segundos.',
    bullets: [
      'Anamnesis y exploración con campos personalizables',
      'Evolutivos por visita vinculados a cada cita',
      'Radiografías, fotos y archivos en la ficha del paciente',
      'Consentimiento informado integrado',
      'Datos cifrados y conformes al RGPD'
    ],
    cta: { href: '/login/admin', label: 'Ver módulo clínico' },
    variant: 'security' as const
  },
  {
    key: 'portal',
    tab: 'Portal del paciente',
    kicker: 'Portal del paciente',
    title: 'Portal del paciente: citas, presupuestos y documentos sin llamadas',
    text: 'Tus pacientes reservan, confirman y gestionan citas desde el móvil, con acceso a informes y facturas.',
    bullets: [
      'Reserva, cambio y cancelación online 24/7',
      'Confirmación de citas con un toque',
      'Acceso a presupuestos, facturas y consentimientos',
      'Documentos postoperatorios siempre a mano',
      'Comunicación con la clínica sin depender del teléfono'
    ],
    cta: { href: '/portal-paciente', label: 'Entrar al portal' },
    variant: 'portal' as const
  },
  {
    key: 'facturacion',
    tab: 'Facturación',
    kicker: 'Facturación y presupuestos',
    title: 'Presupuestos que se aceptan y facturación integrada',
    text: 'Crea el presupuesto en consulta, envíalo al móvil del paciente y factura en un clic desde la cita.',
    bullets: [
      'Presupuestos por tratamiento enviados al instante',
      'Seguimiento de presupuestos pendientes y aceptados',
      'Facturas en un clic con IVA por tratamiento',
      'Informes de ingresos y ocupación por profesional',
      'Historial de pagos visible para el paciente'
    ],
    cta: { href: '/login/admin', label: 'Ver facturación' },
    variant: 'billing' as const
  },
  {
    key: 'ia',
    tab: 'Citas con IA',
    kicker: 'Citas con IA',
    title: 'Asistente de citas con IA: reserva y consulta sin esperas',
    text: 'El paciente reserva, consulta o cambia citas conversando con el asistente. Disponibilidad real del backend.',
    bullets: [
      'Reserva guiada con huecos reales',
      'Consulta con email, DNI o NHC',
      'Reprogramación y cancelación verificada',
      'Gemini Pro solo en servidor',
      'Sin inventar citas ni disponibilidad'
    ],
    cta: { href: '/citas-con-ia', label: 'Probar asistente IA' },
    variant: 'portal' as const
  },
  {
    key: 'seguridad',
    tab: 'Seguridad',
    kicker: 'Seguridad',
    title: 'Multi-clínica con permisos, auditoría y datos en la UE',
    text: 'Cada clínica trabaja en su contexto aislado. Roles, permisos y trazabilidad para grupos dentales.',
    bullets: [
      'Aislamiento estricto por clínica',
      'Permisos por rol y sede',
      'Auditoría de accesos',
      'Copias de seguridad automáticas',
      'Cumplimiento RGPD'
    ],
    cta: { href: '/platform/login', label: 'Acceder a plataforma' },
    variant: 'security' as const
  }
] as const

export function ModulesTabSection() {
  const [active, setActive] = useState(0)
  const module = MODULES[active]

  return (
    <section id="para-clinicas" className="ac-section ac-section--modules" aria-labelledby="ac-modules-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <h2 id="ac-modules-title">Todo lo que necesitas para gestionar tu clínica dental</h2>
        </header>
        <div className="ac-module-tabs" role="tablist" aria-label="Módulos de AgendaClinic">
          {MODULES.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`ac-tab-${item.key}`}
              aria-selected={index === active}
              aria-controls={`ac-panel-${item.key}`}
              className={`ac-module-tabs__btn${index === active ? ' is-active' : ''}`}
              onClick={() => setActive(index)}
            >
              {item.tab}
            </button>
          ))}
        </div>
        <article
          id={`ac-panel-${module.key}`}
          role="tabpanel"
          aria-labelledby={`ac-tab-${module.key}`}
          className="ac-module-panel"
        >
          <div className="ac-module-panel__copy">
            <p className="ac-kicker">{module.kicker}</p>
            <h3>{module.title}</h3>
            <p>{module.text}</p>
            <ul className="ac-list ac-list--check">
              {module.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <a href={module.cta.href} className="ac-link-arrow">
              {module.cta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <FeatureVisualMocks variant={module.variant} title={module.title} />
        </article>
      </ResponsiveContainer>
    </section>
  )
}
