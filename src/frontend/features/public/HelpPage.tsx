import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { helpQuickAccessLinks, searchHelpFaqs } from '@/lib/guide/hubCatalog'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Card, Container, Input, PageHeader } from '@/frontend/ds'

export const HelpPage = () => {
  const [query, setQuery] = useState('')
  const results = useMemo(() => (query.trim() ? searchHelpFaqs(query) : []), [query])

  return (
    <PublicShell>
      <main id="main-content" className="py-10 sm:py-14">
        <Container>
          <PageHeader
            eyebrow="Centro de ayuda"
            title="¿En qué podemos ayudarte?"
            description="Guías para pacientes, clínicas y administradores de plataforma."
          />

          <Input
            id="help-search"
            label="Buscar en ayuda"
            leftSlot={<Search className="h-4 w-4 text-slate-400" aria-hidden />}
            placeholder="Ej.: reservar cita, factura, acceso admin…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {query.trim() ? (
            <Card className="mt-6">
              <h2 className="font-semibold text-ink">Resultados</h2>
              <ul className="mt-4 space-y-3">
                {results.length ? (
                  results.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-medium text-ink">{item.question}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.answer}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-600">Sin resultados. Prueba otras palabras.</li>
                )}
              </ul>
            </Card>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {helpQuickAccessLinks.map((link) => (
                <Card key={link.href} className="transition hover:border-brand-200 hover:shadow-soft">
                  <BookOpen className="h-5 w-5 text-brand-600" aria-hidden />
                  <h2 className="mt-3 font-semibold text-ink">
                    <a href={link.href} className="hover:text-brand-700">
                      {link.label}
                    </a>
                  </h2>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
    </PublicShell>
  )
}
