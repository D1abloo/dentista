import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { email, required } from '@/lib/validation';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

const consultTypes = [
  { value: 'paciente', label: 'Soporte paciente' },
  { value: 'clinica', label: 'Soporte clínica' },
  { value: 'facturacion', label: 'Facturación' },
  { value: 'tecnico', label: 'Problema técnico' },
  { value: 'reserva', label: 'Reserva de cita' },
  { value: 'otro', label: 'Otro' }
] as const;

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinic: '',
    type: 'paciente',
    message: '',
    accept_terms: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    const mensaje = params.get('mensaje');
    setForm((prev) => {
      const next = { ...prev };
      if (tipo && consultTypes.some((t) => t.value === tipo)) {
        next.type = tipo as (typeof consultTypes)[number]['value'];
      }
      if (mensaje) next.message = decodeURIComponent(mensaje.replace(/\+/g, ' '));
      return next;
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const errName = required(form.name, 'Nombre');
    const errEmail = email(form.email);
    const errMsg = required(form.message, 'Mensaje');
    if (errName) next.name = errName;
    if (errEmail) next.email = errEmail;
    if (errMsg) next.message = errMsg;
    if (!form.accept_terms) next.accept_terms = 'Debes aceptar la política de privacidad.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          clinic: form.clinic.trim() || undefined,
          type: form.type,
          message: form.message.trim(),
          accept_terms: true
        })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setErrors({ form: json.error?.message ?? 'No se pudo enviar. Escríbenos a info@estructuraweb.es.' });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: 'Error de conexión. Escríbenos a info@estructuraweb.es.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader activeHref="/contacto" />
      <main className="cp cp--form-only">
        <section id="formulario" className="cp-section shell">
          <div className="cp-form-panel">
            <div className="cp-form-panel__form">
              <span className="cp-badge">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Contacto
              </span>
              <h1>Formulario de contacto</h1>
              <p className="cp-form-intro">
                Cuéntanos tu consulta sobre citas, portal paciente o panel de clínica. Respondemos en menos de 24
                horas laborables.
              </p>

              {sent ? (
                <div className="cp-form-success" role="status">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
                  <p className="cp-form-success__title">Mensaje enviado</p>
                  <p>Gracias, {form.name}. Te responderemos a {form.email}.</p>
                  <button type="button" className="btn btn--outline btn--sm mt-4" onClick={() => setSent(false)}>
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="cp-form" noValidate>
                  <Field label="Nombre completo" error={errors.name}>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Correo electrónico" error={errors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="tu@email.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Clínica (opcional)">
                    <Input
                      value={form.clinic}
                      onChange={(e) => setForm({ ...form, clinic: e.target.value })}
                      placeholder="Nombre de tu clínica"
                    />
                  </Field>
                  <Field label="Tipo de consulta">
                    <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {consultTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Mensaje" error={errors.message}>
                    <Textarea
                      rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe tu consulta con el máximo detalle posible…"
                    />
                  </Field>
                  <label className={`cr-check ${errors.accept_terms ? 'cr-check--error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.accept_terms}
                      onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
                      disabled={loading}
                    />
                    <span>
                      Acepto la{' '}
                      <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                        política de privacidad
                      </a>
                      .
                    </span>
                  </label>
                  {errors.accept_terms ? (
                    <p className="cr-field-error" role="alert">
                      {errors.accept_terms}
                    </p>
                  ) : null}
                  {errors.form ? (
                    <p className="login-form__error" role="alert">
                      {errors.form}
                    </p>
                  ) : null}
                  <button type="submit" className="btn btn--teal btn--lg btn--block" disabled={loading}>
                    {loading ? 'Enviando…' : 'Enviar mensaje'}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </button>
                </form>
              )}
            </div>

            <aside className="cp-form-panel__aside">
              <h2>Información de contacto</h2>
              <ul className="cp-info-list">
                <li>
                  <Mail className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Email</strong>
                    <a href="mailto:info@estructuraweb.es">info@estructuraweb.es</a>
                    <small>Soporte general y facturación</small>
                  </div>
                </li>
                <li>
                  <Phone className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Teléfono</strong>
                    <span>+34 900 123 456</span>
                    <small>Lunes a viernes, 9:00–18:00</small>
                  </div>
                </li>
                <li>
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Centro de ayuda</strong>
                    <a href="/ayuda">Guía detallada paso a paso</a>
                    <small>Portal paciente y panel clínica</small>
                  </div>
                </li>
              </ul>
              <p className="cp-info-note">
                Para reservar cita online usa{' '}
                <a href="/reserva">Reservar cita</a>. Para acceder a tu historial,{' '}
                <a href="/login/paciente">Portal paciente</a>.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}
