import { useMemo, useState, type FormEvent } from 'react'
import { Mail, Phone } from 'lucide-react'
import {
  CONTACT_CONSULT_TYPES,
  getPublicContactInfo,
  isContactConsultType,
  resolveContactVariant
} from '@/lib/public/contactContent'
import { email, required } from '@/lib/validation'
import { PublicShell } from '@/frontend/layouts/PublicShell'
import { Alert, Button, Card, Container, Input, PageHeader } from '@/frontend/ds'

export const ContactPage = () => {
  const contact = useMemo(() => getPublicContactInfo(), [])
  const variant = useMemo(() => {
    if (typeof window === 'undefined') return resolveContactVariant(null)
    return resolveContactVariant(new URLSearchParams(window.location.search).get('tipo'))
  }, [])

  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinic: '',
    type: variant.defaultType,
    message: '',
    accept_terms: false
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const nameErr = required(form.name, 'Nombre')
    const emailErr = email(form.email)
    const msgErr = required(form.message, 'Mensaje')
    if (nameErr) next.name = nameErr
    if (emailErr) next.email = emailErr
    if (msgErr) next.message = msgErr
    if (!form.accept_terms) next.accept_terms = 'Debes aceptar la política de privacidad.'
    if (!isContactConsultType(form.type)) next.type = 'Tipo no válido.'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('No se pudo enviar')
      setSent(true)
    } catch {
      setErrors({ form: 'No se pudo enviar el mensaje. Inténtalo más tarde.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicShell>
      <main id="main-content" className="py-10 sm:py-14">
        <Container size="lg">
          <PageHeader eyebrow={variant.badge} title={variant.title} description={variant.lead} />
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <Card>
              {sent ? (
                <Alert tone="success" title="Mensaje enviado">
                  Te responderemos en menos de 24 horas laborables.
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    id="contact-name"
                    label="Nombre"
                    requiredMark
                    value={form.name}
                    error={errors.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                  <Input
                    id="contact-email"
                    type="email"
                    label="Email"
                    requiredMark
                    value={form.email}
                    error={errors.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  {variant.showClinicField ? (
                    <Input
                      id="contact-clinic"
                      label="Clínica (opcional)"
                      value={form.clinic}
                      onChange={(e) => setForm((f) => ({ ...f, clinic: e.target.value }))}
                    />
                  ) : null}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                    Tipo de consulta
                    <select
                      className="h-11 rounded-xl border border-slate-300 px-3"
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                    >
                      {CONTACT_CONSULT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-800">
                    Mensaje
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={variant.messagePlaceholder}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    />
                    {errors.message ? <span className="text-xs text-red-600">{errors.message}</span> : null}
                  </label>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.accept_terms}
                      onChange={(e) => setForm((f) => ({ ...f, accept_terms: e.target.checked }))}
                      className="mt-1"
                    />
                    Acepto la <a href="/privacidad" className="text-brand-700 underline">política de privacidad</a>
                  </label>
                  {errors.accept_terms ? <p className="text-xs text-red-600">{errors.accept_terms}</p> : null}
                  {errors.form ? <Alert tone="danger">{errors.form}</Alert> : null}
                  <Button type="submit" loading={loading} className="w-full sm:w-auto">
                    Enviar mensaje
                  </Button>
                </form>
              )}
            </Card>

            <Card className="h-fit space-y-4">
              <h2 className="font-semibold text-ink">Contacto directo</h2>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4" aria-hidden />
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4" aria-hidden />
                {contact.phone}
              </p>
            </Card>
          </div>
        </Container>
      </main>
    </PublicShell>
  )
}
