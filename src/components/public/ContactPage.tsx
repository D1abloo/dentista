import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  PhoneCall,
  Shield,
  ShieldCheck,
  UserRound,
  Zap
} from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { email, required } from '@/lib/validation';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

const trustHero = [
  { icon: Zap, label: 'Respuesta rápida', sub: 'En menos de 24h' },
  { icon: UserRound, label: 'Atención personalizada', sub: 'Soporte real' },
  { icon: Shield, label: '100% Seguro', sub: 'Tus datos protegidos' }
] as const;

const contactOptions = [
  {
    tone: 'blue',
    icon: Headphones,
    title: 'Soporte pacientes',
    text: 'Problemas con citas, pagos o documentos.',
    cta: 'Contactar soporte',
    href: '#formulario',
    variant: 'outline' as const
  },
  {
    tone: 'teal',
    icon: Building2,
    title: 'Soporte clínicas',
    text: 'Ayuda con agenda, pacientes y facturación.',
    cta: 'Hablar con soporte',
    href: '#formulario',
    variant: 'outline' as const
  },
  {
    tone: 'red',
    icon: PhoneCall,
    title: 'Emergencias',
    text: '¿Necesitas ayuda urgente con una clínica?',
    cta: 'Llamar ahora',
    href: 'tel:+34900123456',
    variant: 'danger' as const
  }
] as const;

const consultTypes = [
  { value: 'paciente', label: 'Soporte paciente' },
  { value: 'clinica', label: 'Soporte clínica' },
  { value: 'facturacion', label: 'Facturación' },
  { value: 'tecnico', label: 'Problema técnico' },
  { value: 'otro', label: 'Otro' }
] as const;

type ContactChannel = {
  icon: typeof Mail;
  tone: 'blue' | 'teal' | 'purple' | 'green';
  title: string;
  value: string;
  sub: string;
  href?: string;
};

const contactChannels: ContactChannel[] = [
  {
    icon: Mail,
    tone: 'blue',
    title: 'Correo electrónico',
    value: 'hola@dentista.demo',
    sub: 'Soporte general'
  },
  {
    icon: Phone,
    tone: 'teal',
    title: 'Teléfono',
    value: '+34 900 123 456',
    sub: 'Lun–Vie 9:00–18:00'
  },
  {
    icon: MessageCircle,
    tone: 'purple',
    title: 'Chat en vivo',
    value: 'Disponible en la plataforma',
    sub: 'Atención inmediata'
  },
  {
    icon: HelpCircle,
    tone: 'green',
    title: 'Centro de ayuda',
    value: 'Explora guías y respuestas',
    sub: 'Ir al centro de ayuda →',
    href: '/documentacion'
  }
];

const trustBlocks = [
  { icon: UserRound, title: 'Atención personalizada', text: 'Equipo humano que conoce tu caso.' },
  { icon: ShieldCheck, title: 'Soporte seguro', text: 'Comunicaciones cifradas y privadas.' },
  { icon: Zap, title: 'Respuesta rápida', text: 'Resolvemos la mayoría en 24 horas.' },
  { icon: Shield, title: 'Plataforma protegida', text: 'Cumplimiento y aislamiento por clínica.' }
] as const;

const faqs = [
  {
    q: '¿Cómo reservo una cita?',
    a: 'Entra en «Reservar cita», elige clínica, tratamiento, dentista y hora libre en el calendario. Recibirás confirmación al instante.'
  },
  {
    q: '¿Cómo funciona el portal clínica?',
    a: 'Cada centro tiene su panel aislado: agenda, pacientes, informes, facturación y dentistas. Solicita el alta en registro de clínica y accede tras la aprobación en producción.'
  },
  {
    q: '¿Puedo acceder a mis documentos?',
    a: 'Sí. En el portal paciente verás informes, radiografías y consentimientos que tu clínica haya compartido contigo.'
  },
  {
    q: '¿Cómo funcionan los pagos?',
    a: 'Consulta facturas pendientes o pagadas, descarga PDF y realiza el pago según las opciones habilitadas por tu clínica.'
  }
] as const;

const teamAvatars = ['LS', 'AM', 'CR'];

export function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    clinic: '',
    type: 'paciente',
    message: ''
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const errName = required(form.name, 'Nombre');
    const errEmail = email(form.email);
    const errMsg = required(form.message, 'Mensaje');
    if (errName) next.name = errName;
    if (errEmail) next.email = errEmail;
    if (errMsg) next.message = errMsg;
    setErrors(next);
    if (Object.keys(next).length) return;
    setSent(true);
  }

  return (
    <>
      <PublicHeader activeHref="/contacto" />
      <main className="cp">
        <section className="cp-hero shell">
          <div className="cp-hero__grid">
            <div className="cp-hero__copy">
              <span className="cp-badge">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Contacto
              </span>
              <h1>Estamos aquí para ayudarte</h1>
              <p className="cp-hero__lead">
                ¿Tienes dudas sobre citas, clínicas o la plataforma? Nuestro equipo te responderá lo antes posible.
              </p>
              <ul className="cp-trust-row">
                {trustHero.map((t) => (
                  <li key={t.label}>
                    <span className="cp-trust-row__icon">
                      <t.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <strong>{t.label}</strong>
                      <small>{t.sub}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cp-hero__visual">
              <div className="cp-hero__photo">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt="Recepcionista dental atendiendo con auricular en clínica moderna"
                  width={640}
                  height={520}
                  loading="eager"
                />
              </div>
              <article className="cp-float">
                <p className="cp-float__title">¿En qué podemos ayudarte?</p>
                <p className="cp-float__text">Nuestro equipo está listo para asistirte.</p>
                <div className="cp-float__team">
                  {teamAvatars.map((initials) => (
                    <span key={initials} className="cp-float__avatar">
                      {initials}
                    </span>
                  ))}
                  <span className="cp-float__status">
                    <i className="cp-float__dot" aria-hidden />
                    En línea ahora
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="cp-section shell">
          <div className="cp-options">
            {contactOptions.map((opt) => (
              <article key={opt.title} className={`cp-option cp-option--${opt.tone}`}>
                <span className={`cp-option__icon cp-option__icon--${opt.tone}`}>
                  <opt.icon className="h-6 w-6" aria-hidden />
                </span>
                <h2>{opt.title}</h2>
                <p>{opt.text}</p>
                <a
                  href={opt.href}
                  className={`btn cp-option__btn ${opt.variant === 'danger' ? 'cp-option__btn--danger' : 'btn--outline'}`}
                >
                  {opt.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="formulario" className="cp-section shell">
          <div className="cp-form-panel">
            <div className="cp-form-panel__form">
              <h2>Envíanos un mensaje</h2>
              {sent ? (
                <div className="cp-form-success" role="status">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
                  <p className="cp-form-success__title">Mensaje enviado</p>
                  <p>Gracias, {form.name}. Te responderemos en menos de 24 horas a {form.email}.</p>
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
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Cuéntanos en qué podemos ayudarte…"
                    />
                  </Field>
                  <button type="submit" className="btn btn--primary btn--lg btn--block">
                    Enviar mensaje
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </button>
                  <p className="cp-form__note">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    Respondemos normalmente en menos de 24 horas
                  </p>
                </form>
              )}
            </div>

            <aside className="cp-form-panel__aside">
              <h2>Otras formas de contacto</h2>
              <ul className="cp-channels">
                {contactChannels.map((ch) => (
                  <li key={ch.title}>
                    {ch.href ? (
                      <a href={ch.href} className="cp-channel">
                        <ChannelBody ch={ch} />
                      </a>
                    ) : (
                      <div className="cp-channel">
                        <ChannelBody ch={ch} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="cp-section shell">
          <div className="cp-trust-bar">
            {trustBlocks.map((b) => (
              <article key={b.title} className="cp-trust-block">
                <span className="cp-trust-block__icon">
                  <b.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cp-section cp-section--alt shell">
          <header className="cp-section__head">
            <h2>Preguntas frecuentes</h2>
            <p>Respuestas rápidas a lo más consultado</p>
          </header>
          <div className="cp-faq">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <article key={item.q} className={`cp-faq__item ${open ? 'cp-faq__item--open' : ''}`}>
                  <button
                    type="button"
                    className="cp-faq__trigger"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`cp-faq__chev ${open ? 'cp-faq__chev--open' : ''}`} aria-hidden />
                  </button>
                  {open ? <div className="cp-faq__body">{item.a}</div> : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="cp-section shell">
          <div className="cp-cta-banner">
            <div className="cp-cta-banner__icon" aria-hidden>
              <Headphones className="h-8 w-8" />
            </div>
            <div className="cp-cta-banner__copy">
              <h2>¿Necesitas ayuda personalizada?</h2>
              <p>Nuestro equipo está listo para ayudarte con cualquier duda.</p>
            </div>
            <a href="#formulario" className="btn btn--white btn--lg">
              Contactar ahora
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}

function ChannelBody({ ch }: { ch: ContactChannel }) {
  return (
    <>
      <span className={`cp-channel__icon cp-channel__icon--${ch.tone}`}>
        <ch.icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <strong>{ch.title}</strong>
        <span className="cp-channel__value">{ch.value}</span>
        <small>{ch.sub}</small>
      </span>
    </>
  );
}
