import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound
} from 'lucide-react';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { email, required } from '@/lib/validation';
import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { CookieBanner } from './CookieBanner';

const STEPS = [
  { n: '01', title: 'Envía la solicitud', text: 'Datos del centro y del responsable. Sin pago inicial.' },
  { n: '02', title: 'Revisión manual', text: 'Validamos tu alta en menos de 24 horas laborables.' },
  { n: '03', title: 'Panel aislado', text: 'Recibes acceso a /admin solo para tu clínica y tenant propio.' }
] as const;

const BENEFITS = [
  { icon: Lock, title: 'Tenant aislado', text: 'Tus pacientes y equipo no ven datos de otras clínicas.' },
  { icon: ShieldCheck, title: 'RGPD y trazabilidad', text: 'Consentimientos, auditoría y roles por sede.' },
  { icon: Sparkles, title: 'Plan Essential', text: 'Agenda, pacientes, facturación y portal paciente incluidos.' }
] as const;

const FAQS = [
  {
    q: '¿Cuánto tarda la activación?',
    a: 'Revisamos cada solicitud manualmente. Suele resolverse en menos de 24 horas. Recibirás un email con acceso al panel.'
  },
  {
    q: '¿Necesito tarjeta para registrarme?',
    a: 'No. El alta es una solicitud. La facturación del plan SaaS se acuerda tras la aprobación.'
  },
  {
    q: '¿Puedo tener varias sedes?',
    a: 'Cada solicitud crea una organización con su panel. Para multi-sede, indícalo en el mensaje y te asesoramos.'
  },
  {
    q: '¿Mis datos están separados de otras clínicas?',
    a: 'Sí. Cada centro aprobado recibe clinic_id y tenant_id únicos con políticas RLS en Supabase.'
  }
] as const;

type FormState = {
  clinic_name: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  message: string;
  accept_terms: boolean;
};

const initialForm: FormState = {
  clinic_name: '',
  owner_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  message: '',
  accept_terms: false
};

export function ClinicRegistrationPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    void fetch('/api/public/clinic-registration')
      .then(async (res) => {
        const json = (await res.json()) as { data?: { available?: boolean } };
        setApiReady(Boolean(json.data?.available));
      })
      .catch(() => setApiReady(false));
  }, []);

  const canSubmit = apiReady !== false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const next: Record<string, string> = {};
    const e1 = required(form.clinic_name, 'Nombre del centro');
    const e2 = required(form.owner_name, 'Responsable');
    const e3 = email(form.email);
    const e4 = required(form.phone, 'Teléfono');
    if (e1) next.clinic_name = e1;
    if (e2) next.owner_name = e2;
    if (e3) next.email = e3;
    if (e4) next.phone = e4;
    if (!form.accept_terms) next.accept_terms = 'Debes aceptar privacidad y términos.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/public/clinic-registration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinic_name: form.clinic_name.trim(),
          owner_name: form.owner_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          message: form.message.trim() || undefined
        })
      });
      const json = (await res.json()) as {
        data?: { id?: string };
        error?: { message?: string };
        message?: string;
      };
      if (!res.ok) {
        setErrors({ form: json.error?.message ?? 'No se pudo enviar la solicitud.' });
        return;
      }
      setRequestId(json.data?.id ?? null);
      setSent(true);
    } catch {
      setErrors({ form: 'Error de conexión. Comprueba tu red e inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader activeHref="/registro-clinica" />
      <main className="cp cr">
        <section className="cp-hero shell cr-hero">
          <div className="cp-hero__grid">
            <div className="cp-hero__copy">
              <span className="cp-badge cr-badge">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                Alta de clínica
              </span>
              <h1>Registra tu centro en Dentista+</h1>
              <p className="cp-hero__lead">
                Solicita acceso al SaaS dental para tu organización. Cada clínica aprobada obtiene su panel{' '}
                <strong>/admin</strong> aislado: sin contacto ni datos compartidos con otras organizaciones.
              </p>
              <ul className="cp-trust-row">
                <li>
                  <span className="cp-trust-row__icon">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Revisión manual</strong>
                    <small>Calidad y seguridad</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon">
                    <Lock className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Multi-tenant</strong>
                    <small>RLS por clínica</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Plan Essential</strong>
                    <small>Tras aprobación</small>
                  </span>
                </li>
              </ul>
            </div>

            <div className="cp-hero__visual">
              <div className="cp-hero__photo">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt="Equipo de clínica dental en entorno profesional"
                  width={640}
                  height={520}
                  loading="eager"
                />
              </div>
              <article className="cp-float cr-float">
                <p className="cp-float__title">Revisión por el equipo</p>
                <p className="cp-float__text">
                  Tu solicitud queda registrada de forma segura. El equipo de plataforma la revisa en el panel de
                  registros antes de activar tu acceso.
                </p>
                <span className="cr-status-pill">
                  <i className="cr-status-pill__dot" aria-hidden />
                  Alta verificada
                </span>
              </article>
            </div>
          </div>
        </section>

        {apiReady === false ? (
          <section className="shell cr-alert-section">
            <div className="cr-alert cr-alert--warn" role="alert">
              <p className="cr-alert__title">Servicio temporalmente no disponible</p>
              <p className="cr-alert__text">
                Falta configuración de Supabase en el servidor. Contacta con{' '}
                <a href="/contacto">soporte</a>.
              </p>
            </div>
          </section>
        ) : null}

        <section className="cp-section shell">
          <ol className="cr-steps">
            {STEPS.map((s) => (
              <li key={s.n} className="cr-step">
                <span className="cr-step__n">{s.n}</span>
                <div>
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cp-section shell">
          <div className="cr-benefits">
            {BENEFITS.map((b) => (
              <article key={b.title} className="cr-benefit">
                <span className="cr-benefit__icon" aria-hidden>
                  <b.icon className="h-5 w-5" />
                </span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="solicitud" className="cp-section shell">
          <div className="cp-form-panel cr-form-panel">
            <div className="cp-form-panel__form">
              <h2>Solicitud de alta</h2>
              <p className="cr-form-intro">
                Completa los datos. La solicitud queda en estado <strong>pendiente</strong> hasta que el equipo la
                apruebe.
              </p>

              {sent ? (
                <div className="cp-form-success cr-success" role="status">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
                  <p className="cp-form-success__title">Solicitud enviada</p>
                  <p>
                    Hemos registrado tu alta correctamente. Te contactaremos en menos de 24 horas con el acceso
                    al panel de tu clínica.
                  </p>
                  {requestId ? (
                    <p className="cr-success__ref">
                      Referencia: <code>{requestId}</code>
                    </p>
                  ) : null}
                  <a href="/login/admin" className="btn btn--outline btn--sm mt-4">
                    Ir a login clínica
                  </a>
                </div>
              ) : (
                <form onSubmit={submit} className="cp-form cr-form" noValidate>
                  <fieldset className="cr-fieldset">
                    <legend>
                      <Building2 className="h-4 w-4" aria-hidden />
                      Datos del centro
                    </legend>
                    <Field label="Nombre del centro dental" error={errors.clinic_name}>
                      <Input
                        value={form.clinic_name}
                        onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                        placeholder="Ej. Clínica Dental Norte"
                        autoComplete="organization"
                        required
                        disabled={!canSubmit || loading}
                      />
                    </Field>
                    <div className="cr-form-row">
                      <Field label="Dirección" error={errors.address}>
                        <div className="cr-input-icon">
                          <MapPin className="h-4 w-4" aria-hidden />
                          <Input
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Calle y número"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                      <Field label="Ciudad" error={errors.city}>
                        <Input
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="Madrid"
                          disabled={!canSubmit || loading}
                        />
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="cr-fieldset">
                    <legend>
                      <UserRound className="h-4 w-4" aria-hidden />
                      Responsable de la cuenta
                    </legend>
                    <Field label="Nombre y apellidos" error={errors.owner_name}>
                      <Input
                        value={form.owner_name}
                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                        placeholder="Persona de contacto"
                        autoComplete="name"
                        required
                        disabled={!canSubmit || loading}
                      />
                    </Field>
                    <div className="cr-form-row">
                      <Field label="Email profesional" error={errors.email}>
                        <div className="cr-input-icon">
                          <Mail className="h-4 w-4" aria-hidden />
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="tu@clinica.com"
                            autoComplete="email"
                            required
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                      <Field label="Teléfono" error={errors.phone}>
                        <div className="cr-input-icon">
                          <Phone className="h-4 w-4" aria-hidden />
                          <Input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+34 600 000 000"
                            autoComplete="tel"
                            required
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                    </div>
                  </fieldset>

                  <Field label="Mensaje (opcional)" error={errors.message}>
                    <Textarea
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Nº de gabinetes, horario, necesidades especiales…"
                      disabled={!canSubmit || loading}
                    />
                  </Field>

                  <label className={`cr-check ${errors.accept_terms ? 'cr-check--error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.accept_terms}
                      onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
                      disabled={!canSubmit || loading}
                    />
                    <span>
                      Acepto la{' '}
                      <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                        política de privacidad
                      </a>{' '}
                      y los{' '}
                      <a href="/terminos" target="_blank" rel="noopener noreferrer">
                        términos del servicio
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

                  <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                    {loading ? 'Enviando solicitud…' : 'Enviar solicitud'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="cp-form__note">
                    <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                    No se crea usuario hasta aprobar. Cada clínica queda aislada por tenant.
                  </p>
                </form>
              )}
            </div>

            <aside className="cr-aside">
              <h3>Qué incluye el alta aprobada</h3>
              <ul className="cr-aside__list">
                <li>Panel <strong>/admin</strong> para tu equipo</li>
                <li>Portal paciente bajo tu clínica</li>
                <li>Agenda, citas, informes y facturación</li>
                <li>Consentimientos y documentos con RLS</li>
                <li>Suscripción plan Essential inicial</li>
              </ul>
              <p className="cr-aside__muted">
                ¿Ya tienes cuenta? <a href="/login/admin">Accede al panel clínica</a>.
              </p>
              <p className="cr-aside__muted">
                ¿Eres equipo de plataforma? <a href="/platform/login">Super Admin</a>.
              </p>
            </aside>
          </div>
        </section>

        <section className="cp-section cp-section--alt shell">
          <div className="cp-section__head">
            <h2>Preguntas frecuentes</h2>
            <p>Todo el flujo opera en producción con Supabase y revisión manual.</p>
          </div>
          <div className="cp-faq">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <article key={item.q} className={`cp-faq__item ${open ? 'cp-faq__item--open' : ''}`}>
                  <button
                    type="button"
                    className="cp-faq__trigger"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    {item.q}
                    <ChevronDown className={`cp-faq__chev ${open ? 'cp-faq__chev--open' : ''}`} aria-hidden />
                  </button>
                  {open ? <p className="cp-faq__body">{item.a}</p> : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="shell cp-section">
          <div className="cp-cta-banner cr-cta">
            <span className="cp-cta-banner__icon" aria-hidden>
              <Building2 className="h-6 w-6" />
            </span>
            <div className="cp-cta-banner__copy">
              <h2>¿Prefieres hablar con nosotros?</h2>
              <p>El equipo comercial y de soporte puede resolver dudas antes de enviar el formulario.</p>
            </div>
            <a href="/contacto" className="btn btn--white btn--lg">
              Contactar
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}
