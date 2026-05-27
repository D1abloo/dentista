import { Building2, FileText, Stethoscope, Users } from 'lucide-react'
import { ResponsiveContainer } from './ResponsiveContainer'

const MODULES = [
  {
    title: 'Recepción',
    intro: 'Control del día a día en mostrador: agenda, pacientes y recordatorios.',
    items: ['Agenda día, semana y mes', 'Pacientes y NHC', 'Bloqueos horarios', 'Recordatorios', 'Búsqueda rápida'],
    href: '/login/admin',
    Icon: Users
  },
  {
    title: 'Doctores',
    intro: 'Documentación clínica, plantillas y firma en el flujo de consulta.',
    items: ['Informes odontológicos', 'Plantillas clínicas', 'Documentos', 'Firma profesional', 'Historial de visitas'],
    href: '/login/admin',
    Icon: Stethoscope
  },
  {
    title: 'Administración',
    intro: 'Facturación, cobros y reportes vinculados a cada paciente y cita.',
    items: ['Facturas PDF', 'Pagos y recibos', 'Reportes', 'Suscripciones', 'Exportaciones'],
    href: '/login/admin',
    Icon: Building2
  },
  {
    title: 'Pacientes',
    intro: 'Portal privado para citas, documentos, pagos y comunicación con la clínica.',
    items: [
      'Reservar cita',
      'Mis citas',
      'Mis informes',
      'Mis documentos',
      'Mis facturas',
      'Consentimientos',
      'Mensajes'
    ],
    href: '/portal-paciente',
    Icon: FileText
  }
] as const

export function RoleModulesSection() {
  return (
    <section className="ac-section" aria-labelledby="ac-roles-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Módulos por rol</p>
          <h2 id="ac-roles-title">Cada equipo tiene su espacio</h2>
          <p>Recepción, clínica, administración y pacientes trabajan con las herramientas que necesitan.</p>
        </header>
        <div className="ac-grid ac-grid--4">
          {MODULES.map((module) => {
            const Icon = module.Icon
            return (
              <article key={module.title} className="ac-card ac-card--role">
                <span className="ac-card__icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{module.title}</h3>
                <p className="ac-card__intro">{module.intro}</p>
                <ul className="ac-list">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a href={module.href} className="ac-btn ac-btn--ghost ac-btn--sm">
                  Ver más
                </a>
              </article>
            )
          })}
        </div>
      </ResponsiveContainer>
    </section>
  )
}
