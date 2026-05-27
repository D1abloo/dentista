import { FeatureVisualMocks } from './FeatureVisualMocks'
import { ResponsiveContainer } from './ResponsiveContainer'

const ARTICLES = [
  {
    title: 'Agenda clínica pensada para recepción',
    text: 'Organiza el día de la clínica con vistas por día, semana y mes, disponibilidad por profesional, búsqueda rápida y bloqueos horarios visibles.',
    bullets: [
      'Agenda por profesional',
      'Bloqueos horarios',
      'Estados de cita',
      'Recordatorios',
      'Recepción más ágil'
    ],
    cta: { href: '/login/admin', label: 'Ver agenda clínica' },
    variant: 'agenda' as const
  },
  {
    title: 'Portal del paciente conectado',
    text: 'El paciente puede consultar sus citas, informes, documentos, facturas, pagos, consentimientos y mensajes desde un espacio privado.',
    bullets: ['Mis citas', 'Informes clínicos', 'Documentos', 'Facturas y pagos', 'Mensajes y consentimientos'],
    cta: { href: '/portal-paciente', label: 'Entrar al portal' },
    variant: 'portal' as const,
    reverse: true
  },
  {
    title: 'Facturación y pagos integrados',
    text: 'Genera facturas PDF, registra pagos, comparte recibos y vincula cada factura con el paciente y la cita correspondiente.',
    bullets: ['Facturas PDF', 'Pagos y recibos', 'Estado visible para el paciente', 'Historial por paciente'],
    cta: { href: '/login/admin', label: 'Ver facturación' },
    variant: 'billing' as const
  },
  {
    title: 'Seguridad y organización multi-clínica',
    text: 'Cada clínica, paciente y usuario trabaja dentro de su propio contexto de datos, con roles, permisos y auditoría.',
    bullets: ['Aislamiento por clínica', 'Permisos por rol', 'Auditoría', 'Gestión multi-sede'],
    cta: { href: '/platform/login', label: 'Acceder a plataforma' },
    variant: 'security' as const,
    reverse: true
  }
]

export function ArticleFeatureSection() {
  return (
    <section className="ac-section ac-section--editorial" aria-labelledby="ac-articles-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Funciones detalladas</p>
          <h2 id="ac-articles-title">Módulos con contenido útil y vistas reales del producto</h2>
          <p>
            Cada área de AgendaClinic incluye herramientas concretas para recepción, clínica, administración y
            pacientes, con mockups que muestran el flujo real.
          </p>
        </header>

        {ARTICLES.map((article) => (
          <article
            key={article.title}
            className={`ac-article ac-article--rich${article.reverse === true ? ' ac-article--reverse' : ''}`}
          >
            <div className="ac-article__copy">
              <h3>{article.title}</h3>
              <p>{article.text}</p>
              <ul className="ac-list ac-list--check">
                {article.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href={article.cta.href} className="ac-btn ac-btn--secondary">
                {article.cta.label}
              </a>
            </div>
            <FeatureVisualMocks variant={article.variant} title={article.title} />
          </article>
        ))}
      </ResponsiveContainer>
    </section>
  )
}
