import { ResponsiveContainer } from './ResponsiveContainer'

const ARTICLES = [
  {
    title: 'Agenda clínica pensada para recepción',
    text: 'Organiza el día de la clínica con vistas por día, semana y mes, disponibilidad por profesional y bloqueos horarios visibles para el paciente.',
    bullets: ['Vista día, semana y mes', 'Bloqueos horarios', 'Recordatorios automáticos'],
    cta: { href: '/login/admin', label: 'Ver agenda clínica' },
    tags: ['Agenda del día', 'Disponibilidad', 'Bloqueos']
  },
  {
    title: 'Portal paciente conectado',
    text: 'El paciente puede consultar sus citas, informes, documentos, facturas, pagos, consentimientos y mensajes desde un espacio privado.',
    bullets: ['Citas y documentos', 'Facturas y pagos', 'Mensajes seguros'],
    cta: { href: '/portal-paciente', label: 'Entrar al portal' },
    tags: ['Mis citas', 'Informes', 'Facturas'],
    reverse: true
  },
  {
    title: 'Facturación y pagos integrados',
    text: 'Genera facturas PDF, registra pagos, comparte recibos y vincula cada factura con el paciente y la cita correspondiente.',
    bullets: ['Facturas PDF', 'Pagos registrados', 'Recibos compartidos'],
    cta: { href: '/login/admin', label: 'Ver facturación' },
    tags: ['Factura #204', 'Pago confirmado', 'Recibo PDF']
  },
  {
    title: 'Seguridad multi-clínica',
    text: 'Cada clínica, paciente y usuario trabaja dentro de su propio contexto de datos, con roles, permisos y auditoría.',
    bullets: ['Roles y permisos', 'Aislamiento por clínica', 'Auditoría de acciones'],
    cta: { href: '/platform/login', label: 'Acceder a plataforma' },
    tags: ['RLS activo', 'Auditoría', 'Multi-sede'],
    reverse: true
  }
]

export function ArticleFeatureSection() {
  return (
    <section className="ac-section" aria-labelledby="ac-articles-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head ac-section__head--center">
          <p className="ac-kicker">Plataforma conectada</p>
          <h2 id="ac-articles-title">Todo el flujo clínico en artículos útiles</h2>
        </header>

        {ARTICLES.map((article) => (
          <article
            key={article.title}
            className={`ac-article${article.reverse === true ? ' ac-article--reverse' : ''}`}
          >
            <div className="ac-article__copy">
              <h3>{article.title}</h3>
              <p>{article.text}</p>
              <ul className="ac-list">
                {article.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a href={article.cta.href} className="ac-btn ac-btn--secondary">
                {article.cta.label}
              </a>
            </div>
            <div className="ac-article__visual" role="img" aria-label={`Vista de ${article.title}`}>
              <div className="ac-article__mock">
                {article.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </ResponsiveContainer>
    </section>
  )
}
