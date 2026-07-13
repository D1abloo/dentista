import { LEGAL_ENTITY, type LegalSection } from '@/lib/legal/content'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Card, Container, PageHeader } from '@/frontend/ds'

export const LegalPage = ({
  title,
  intro,
  sections
}: {
  title: string
  intro: string
  sections: LegalSection[]
}) => (
  <PublicShell>
    <main id="main-content" className="py-10 sm:py-14">
      <Container size="lg">
        <PageHeader title={title} description={intro} />
        <Card className="prose prose-slate max-w-none">
          <p className="text-sm text-slate-600">
            Última actualización: <strong>{LEGAL_ENTITY.lastUpdated}</strong> · {LEGAL_ENTITY.operator} ·{' '}
            <a href={`mailto:${LEGAL_ENTITY.email}`}>{LEGAL_ENTITY.email}</a>
          </p>
          <nav aria-label="Índice" className="not-prose my-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink">Índice</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brand-700">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-8">
              <h2 className="font-display text-xl font-semibold text-ink">{section.title}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="mt-3 text-slate-700">
                  {p}
                </p>
              ))}
              {section.list ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
                  {section.list.map((item) => (
                    <li key={item.slice(0, 48)}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </Card>
      </Container>
    </main>
  </PublicShell>
)
