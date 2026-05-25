import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Stethoscope
} from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { email, required } from '@/lib/validation';
import {
  CONTACT_CONSULT_TYPES,
  CONTACT_QUICK_LINKS,
  getPublicContactInfo,
  isContactConsultType,
  resolveContactVariant,
  type ContactConsultType
} from '@/lib/public/contactContent';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

export function ContactPage() {
  const contact = useMemo(() => getPublicContactInfo(), []);
  const [variant, setVariant] = useState(() => resolveContactVariant(null));
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinic: '',
    type: 'soporte' as ContactConsultType,
    message: '',
    accept_terms: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    const mensaje = params.get('mensaje');
    const resolved = resolveContactVariant(tipo);
    setVariant(resolved);
    setForm((prev) => {
      const next = { ...prev, type: resolved.defaultType };
      if (tipo && isContactConsultType(tipo)) next.type = tipo;
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
        setErrors({
          form: json.error?.message ?? `No se pudo enviar. Escríbenos a ${contact.supportEmail}.`
        });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: `Error de conexión. Escríbenos a ${contact.supportEmail}.` });
    } finally {
      setLoading(false);
    }
  }

  const mailSubject = encodeURIComponent(
    variant.id === 'soporte' ? 'Consulta de soporte — AgendaClinic' : 'Consulta — AgendaClinic'
  );

  return (
    <>
      <PublicHeader activeHref="/contacto" />
      <main className="cp ps-page--contact">
        <section className="cp-hero shell" aria-labelledby="contact-hero-title">
          <div className="cp-hero__grid">
            <div className="cp-hero__copy">
              <span className="cp-badge">
                <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
                {variant.badge}
              </span>
              <h1 id="contact-hero-title">{variant.title}</h1>
              <p className="cp-hero__lead">{variant.lead}</p>
              <ul className="cp-trust-row">
                <li>
                  <span className="cp-trust-row__icon" aria-hidden>
                    <Clock className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>{contact.responseSla}</strong>
                    <small>Equipo {contact.brandName}</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon" aria-hidden>
                    <Headphones className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>{contact.hours}</strong>
                    <small>Horario de atención</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon" aria-hidden>
                    <Shield className="h-4 w-4" />
                  </span>
                  <span>
                    <strong>Datos protegidos</strong>
                    <small>RGPD y uso clínico seguro</small>
                  </span>
                </li>
              </ul>
            </div>

            <div className="cp-hero__visual cp-hero__visual--channels" aria-label="Canales de contacto">
              <ul className="cp-channels">
                <li>
                  <a className="cp-channel" href={`mailto:${contact.supportEmail}?subject=${mailSubject}`}>
                    <span className="cp-channel__icon cp-channel__icon--teal" aria-hidden>
                      <Mail className="h-5 w-5" />
                    </span>
                    <span>
                      <strong>Email de soporte</strong>
                      <span className="cp-channel__value">{contact.supportEmail}</span>
                      <small>Canal principal · incluye asunto sugerido</small>
                    </span>
                  </a>
                </li>
                {contact.phone ? (
                  <li>
                    <a className="cp-channel" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                      <span className="cp-channel__icon cp-channel__icon--blue" aria-hidden>
                        <Phone className="h-5 w-5" />
                      </span>
                      <span>
                        <strong>Teléfono</strong>
                        <span className="cp-channel__value">{contact.phoneDisplay}</span>
                        <small>{contact.hours}</small>
                      </span>
                    </a>
                  </li>
                ) : null}
                {contact.whatsappUrl ? (
                  <li>
                    <a
                      className="cp-channel"
                      href={contact.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="cp-channel__icon cp-channel__icon--green" aria-hidden>
                        <MessageCircle className="h-5 w-5" />
                      </span>
                      <span>
                        <strong>WhatsApp</strong>
                        <span className="cp-channel__value">Mensaje directo</span>
                        <small>Solo consultas operativas</small>
                      </span>
                    </a>
                  </li>
                ) : null}
                <li>
                  <a className="cp-channel" href="/ayuda">
                    <span className="cp-channel__icon cp-channel__icon--purple" aria-hidden>
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <span>
                      <strong>Centro de ayuda</strong>
                      <span className="cp-channel__value">Guías y preguntas frecuentes</span>
                      <small>Portal paciente y panel clínica</small>
                    </span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="formulario" className="cp-section shell">
          <div className="cp-form-panel">
            <div className="cp-form-panel__form">
              <h2>Enviar solicitud</h2>
              <p className="cp-form-intro">
                Completa el formulario y recibirás confirmación en <strong>{form.email || 'tu correo'}</strong>.
                Priorizamos incidencias de acceso y operación clínica.
              </p>

              {sent ? (
                <div className="cp-form-success" role="status">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
                  <p className="cp-form-success__title">Mensaje enviado</p>
                  <p>
                    Gracias, {form.name}. Te responderemos a <strong>{form.email}</strong> en {contact.responseSla}.
                  </p>
                  <p className="cp-form-success__hint">
                    Si es urgente, escribe también a{' '}
                    <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a>.
                  </p>
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
                  {variant.showClinicField ? (
                    <Field label="Clínica u organización (opcional)">
                      <Input
                        value={form.clinic}
                        onChange={(e) => setForm({ ...form, clinic: e.target.value })}
                        placeholder="Nombre de tu centro"
                      />
                    </Field>
                  ) : null}
                  <Field label="Tipo de consulta">
                    <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactConsultType })}>
                      {CONTACT_CONSULT_TYPES.map((t) => (
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
                      placeholder={variant.messagePlaceholder}
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
                  <p className="cp-form__note">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    También puedes escribir a {contact.supportEmail}
                  </p>
                </form>
              )}
            </div>

            <aside className="cp-form-panel__aside cp-aside">
              <h2>Información de contacto</h2>
              <p className="cp-aside__lead">
                Utiliza el canal que prefieras. Las nuevas clínicas aprobadas en la plataforma quedan cubiertas por el
                mismo soporte sin trámites adicionales.
              </p>
              <ul className="cp-info-list">
                <li>
                  <Mail className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Email</strong>
                    <a href={`mailto:${contact.supportEmail}`}>{contact.supportEmail}</a>
                    <small>Soporte, facturación y consultas generales</small>
                  </div>
                </li>
                {contact.phone ? (
                  <li>
                    <Phone className="h-5 w-5" aria-hidden />
                    <div>
                      <strong>Teléfono</strong>
                      <a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phoneDisplay}</a>
                      <small>{contact.hours}</small>
                    </div>
                  </li>
                ) : null}
                <li>
                  <Stethoscope className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Portal del paciente</strong>
                    <a href="/portal-paciente">Acceder al portal</a>
                    <small>Citas, informes y documentos</small>
                  </div>
                </li>
                <li>
                  <BookOpen className="h-5 w-5" aria-hidden />
                  <div>
                    <strong>Ayuda</strong>
                    <a href="/ayuda">Centro de ayuda</a>
                    <small>Tutoriales y preguntas frecuentes</small>
                  </div>
                </li>
              </ul>

              <div className="cp-aside__links">
                <p className="cp-aside__links-title">Accesos rápidos</p>
                <ul>
                  {CONTACT_QUICK_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>
                        <span>{link.label}</span>
                        <small>{link.desc}</small>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {variant.id === 'soporte' ? (
          <section className="cp-section shell" aria-labelledby="contact-trust-title">
            <h2 id="contact-trust-title" className="cp-section__title">
              ¿En qué podemos ayudarte?
            </h2>
            <div className="cp-trust-bar">
              <div className="cp-trust-block">
                <span className="cp-trust-block__icon" aria-hidden>
                  <Stethoscope className="h-5 w-5" />
                </span>
                <h3>Clínicas</h3>
                <p>Agenda, pacientes, usuarios, informes y configuración del panel.</p>
              </div>
              <div className="cp-trust-block">
                <span className="cp-trust-block__icon" aria-hidden>
                  <MessageCircle className="h-5 w-5" />
                </span>
                <h3>Pacientes</h3>
                <p>Acceso al portal, citas online, documentos y consentimientos.</p>
              </div>
              <div className="cp-trust-block">
                <span className="cp-trust-block__icon" aria-hidden>
                  <Mail className="h-5 w-5" />
                </span>
                <h3>Facturación</h3>
                <p>Pagos, facturas emitidas y datos de suscripción SaaS.</p>
              </div>
              <div className="cp-trust-block">
                <span className="cp-trust-block__icon" aria-hidden>
                  <Shield className="h-5 w-5" />
                </span>
                <h3>Seguridad</h3>
                <p>Accesos, contraseñas y privacidad de datos clínicos.</p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}
