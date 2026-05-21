import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { Button, Field, Input, Select } from '@/components/ui';
import { email, phone, required } from '@/lib/validation';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PublicHeader } from '@/components/public/PublicHeader';
import { CookieBanner } from '@/components/public/CookieBanner';

type ClinicOption = { id: string; name: string; address: string };

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  dni: string;
  birth_date: string;
  clinic_id: string;
  password: string;
  password_confirm: string;
  accept_terms: boolean;
  accept_privacy: boolean;
};

const STEPS = [
  { n: '01', title: 'Completa el alta', text: 'Nombre, DNI, contacto y clínica donde serás atendido.' },
  { n: '02', title: 'Activa tu cuenta', text: 'Abre el correo y pulsa el enlace (válido 48 horas).' },
  { n: '03', title: 'Reserva tu cita', text: 'Inicia sesión y elige día y hora desde el portal.' }
] as const;

const BENEFITS = [
  { icon: ShieldCheck, title: 'Datos protegidos', text: 'Tu ficha solo la ve tu clínica, con acceso controlado.' },
  { icon: CalendarCheck, title: 'Citas online', text: 'Reserva, reprograma y consulta próximas visitas.' },
  { icon: Calendar, title: 'Historial claro', text: 'Informes, mensajes y facturas en un solo lugar.' }
] as const;

const initial: FormState = {
  full_name: '',
  email: '',
  phone: '',
  dni: '',
  birth_date: '',
  clinic_id: '',
  password: '',
  password_confirm: '',
  accept_terms: false,
  accept_privacy: false
};

export function PatientRegistrationPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch('/api/public/clinics').then((r) => r.json()),
      fetch('/api/public/patient-registration').then((r) => r.json())
    ])
      .then(([clinicsJson, regJson]) => {
        const cj = clinicsJson as { data?: { clinics?: ClinicOption[]; available?: boolean } };
        const rj = regJson as { data?: { available?: boolean } };
        setClinics(cj.data?.clinics ?? []);
        setApiReady(Boolean(rj.data?.available && cj.data?.available !== false));
        if (cj.data?.clinics?.length === 1) {
          setForm((f) => ({ ...f, clinic_id: cj.data!.clinics![0]!.id }));
        }
      })
      .catch(() => setApiReady(false));
  }, []);

  const canSubmit = apiReady !== false;

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const n = required(form.full_name, 'Nombre completo');
    if (n) e.full_name = n;
    const em = email(form.email);
    if (em) e.email = em;
    const ph = phone(form.phone);
    if (ph) e.phone = ph;
    if (!form.dni.trim() || form.dni.trim().length < 8) e.dni = 'DNI/NIE obligatorio (mín. 8 caracteres).';
    if (!form.clinic_id) e.clinic_id = 'Selecciona la clínica donde serás atendido.';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres, con letras y números.';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Incluye letras y números.';
    }
    if (form.password !== form.password_confirm) e.password_confirm = 'Las contraseñas no coinciden.';
    if (!form.accept_terms) e.accept_terms = 'Debes aceptar los términos.';
    if (!form.accept_privacy) e.accept_privacy = 'Debes aceptar la política de privacidad.';
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!canSubmit) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await fetch('/api/public/patient-registration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dni: form.dni.trim().toUpperCase(),
          birth_date: form.birth_date || undefined
        })
      });
      const json = (await res.json()) as {
        data?: { email?: string };
        error?: { message?: string };
        message?: string;
      };
      if (!res.ok) {
        setErrors({ form: json.error?.message ?? json.message ?? 'No se pudo registrar.' });
        return;
      }
      setRegisteredEmail(json.data?.email ?? form.email);
      setSent(true);
    } catch {
      setErrors({ form: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader activeHref="/registro-paciente" />
      <main className="cp cr pr-page">
        <section className="cp-hero shell pr-hero">
          <div className="cp-hero__grid">
            <div className="cp-hero__copy">
              <span className="cp-badge pr-badge">
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                Alta de paciente
              </span>
              <h1>Crea tu cuenta para reservar citas</h1>
              <p className="cp-hero__lead">
                El registro es <strong>obligatorio</strong> para pedir cita online. Tras enviar el formulario recibirás
                un correo para <strong>activar tu cuenta</strong> antes de poder iniciar sesión.
              </p>
              <ul className="cp-trust-row">
                <li>
                  <span className="cp-trust-row__icon">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Activación por email</strong>
                    <small>Enlace válido 48 h</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon">
                    <Lock className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Acceso seguro</strong>
                    <small>Contraseña personal</small>
                  </span>
                </li>
                <li>
                  <span className="cp-trust-row__icon">
                    <CalendarCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <strong>Portal paciente</strong>
                    <small>Citas e historial</small>
                  </span>
                </li>
              </ul>
            </div>

            <div className="cp-hero__visual">
              <div className="cp-hero__photo">
                <img
                  src="/images/login-dentista-paciente.jpg"
                  alt="Paciente en consulta dental"
                  width={640}
                  height={520}
                  loading="eager"
                />
              </div>
              <article className="cp-float pr-float">
                <p className="cp-float__title">Revisa tu bandeja de entrada</p>
                <p className="cp-float__text">
                  Tras registrarte enviamos un correo con el botón «Activar mi cuenta». Sin activar no podrás iniciar
                  sesión ni reservar.
                </p>
                <span className="cr-status-pill">
                  <i className="cr-status-pill__dot" aria-hidden />
                  Cuenta pendiente
                </span>
              </article>
            </div>
          </div>
        </section>

        {apiReady === false ? (
          <section className="shell cr-alert-section">
            <div className="cr-alert cr-alert--warn" role="alert">
              <p className="cr-alert__title">Registro no disponible</p>
              <p className="cr-alert__text">
                El alta de pacientes no está activa en este momento. Contacta con tu clínica o{' '}
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
              <article key={b.title} className="cr-benefit pr-benefit">
                <span className="cr-benefit__icon pr-benefit__icon" aria-hidden>
                  <b.icon className="h-5 w-5" />
                </span>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="alta" className="cp-section shell">
          <div className="cp-form-panel cr-form-panel pr-form-panel">
            <div className="cp-form-panel__form">
              <h2>Formulario de alta</h2>
              <p className="cr-form-intro">
                Todos los campos marcados son obligatorios. Tu ficha quedará vinculada a la clínica que elijas.
              </p>

              {sent ? (
                <div className="cp-form-success cr-success pr-success" role="status">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
                  <p className="cp-form-success__title">¡Registro completado!</p>
                  <p>
                    Hemos enviado un correo a <strong>{registeredEmail}</strong> con el enlace de activación. Ábrelo en
                    las próximas 48 horas.
                  </p>
                  <ol className="pr-success__steps">
                    <li>Revisa bandeja de entrada y carpeta de spam.</li>
                    <li>Pulsa «Activar mi cuenta» en el correo.</li>
                    <li>Inicia sesión y reserva tu cita en <a href="/reserva">/reserva</a>.</li>
                  </ol>
                  <div className="pr-success__actions">
                    <a href="/login" className="btn btn--primary btn--sm no-underline">
                      Ir al login
                    </a>
                    <a href="/" className="btn btn--outline btn--sm no-underline">
                      Inicio
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="cp-form cr-form" noValidate>
                  <fieldset className="cr-fieldset">
                    <legend>
                      <UserRound className="h-4 w-4" aria-hidden />
                      Datos personales
                    </legend>
                    <Field label="Nombre y apellidos *" error={errors.full_name}>
                      <Input
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        autoComplete="name"
                        placeholder="María García López"
                        disabled={!canSubmit || loading}
                      />
                    </Field>
                    <div className="cr-form-row">
                      <Field label="DNI / NIE *" error={errors.dni}>
                        <div className="cr-input-icon">
                          <IdCard className="h-4 w-4" aria-hidden />
                          <Input
                            value={form.dni}
                            onChange={(e) => setForm({ ...form, dni: e.target.value.toUpperCase() })}
                            placeholder="12345678A"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                      <Field label="Fecha de nacimiento" error={errors.birth_date}>
                        <div className="cr-input-icon">
                          <Calendar className="h-4 w-4" aria-hidden />
                          <Input
                            type="date"
                            value={form.birth_date}
                            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="cr-fieldset">
                    <legend>
                      <Mail className="h-4 w-4" aria-hidden />
                      Contacto
                    </legend>
                    <div className="cr-form-row">
                      <Field label="Email *" error={errors.email}>
                        <div className="cr-input-icon">
                          <Mail className="h-4 w-4" aria-hidden />
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            autoComplete="email"
                            placeholder="tu@email.com"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                      <Field label="Teléfono móvil *" error={errors.phone}>
                        <div className="cr-input-icon">
                          <Phone className="h-4 w-4" aria-hidden />
                          <Input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            autoComplete="tel"
                            placeholder="+34 600 000 000"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="cr-fieldset">
                    <legend>
                      <Building2 className="h-4 w-4" aria-hidden />
                      Clínica y acceso
                    </legend>
                    <Field label="Clínica donde serás atendido *" error={errors.clinic_id}>
                      <Select
                        value={form.clinic_id}
                        onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
                        disabled={!canSubmit || loading || apiReady === null}
                      >
                        <option value="">Selecciona tu clínica…</option>
                        {clinics.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.address ? ` — ${c.address}` : ''}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div className="cr-form-row">
                      <Field label="Contraseña *" error={errors.password}>
                        <div className="cr-input-icon">
                          <Lock className="h-4 w-4" aria-hidden />
                          <Input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            autoComplete="new-password"
                            placeholder="Mín. 8 caracteres"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                      <Field label="Repetir contraseña *" error={errors.password_confirm}>
                        <div className="cr-input-icon">
                          <Lock className="h-4 w-4" aria-hidden />
                          <Input
                            type="password"
                            value={form.password_confirm}
                            onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                            autoComplete="new-password"
                            disabled={!canSubmit || loading}
                          />
                        </div>
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="cr-fieldset pr-legal">
                    <legend>
                      <ClipboardCheck className="h-4 w-4" aria-hidden />
                      Consentimientos
                    </legend>
                    <label className={`cr-check ${errors.accept_terms ? 'cr-check--error' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.accept_terms}
                        onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
                        disabled={!canSubmit || loading}
                      />
                      <span>
                        Acepto los{' '}
                        <a href="/terminos" target="_blank" rel="noopener noreferrer">
                          términos de uso
                        </a>{' '}
                        *
                      </span>
                    </label>
                    {errors.accept_terms ? (
                      <p className="cr-field-error" role="alert">
                        {errors.accept_terms}
                      </p>
                    ) : null}
                    <label className={`cr-check ${errors.accept_privacy ? 'cr-check--error' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.accept_privacy}
                        onChange={(e) => setForm({ ...form, accept_privacy: e.target.checked })}
                        disabled={!canSubmit || loading}
                      />
                      <span>
                        Acepto la{' '}
                        <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                          política de privacidad
                        </a>{' '}
                        *
                      </span>
                    </label>
                    {errors.accept_privacy ? (
                      <p className="cr-field-error" role="alert">
                        {errors.accept_privacy}
                      </p>
                    ) : null}
                  </fieldset>

                  {errors.form ? (
                    <p className="login-form__error" role="alert">
                      {errors.form}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full pr-submit"
                    disabled={!canSubmit || loading || apiReady === null}
                  >
                    {loading ? 'Creando cuenta…' : 'Crear cuenta y recibir activación'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="cp-form__note">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    Recibirás un correo de activación. Hasta confirmarlo no podrás iniciar sesión.
                  </p>

                  <p className="pr-login-link">
                    ¿Ya tienes cuenta activada? <a href="/login">Iniciar sesión</a>
                  </p>
                </form>
              )}
            </div>

            <aside className="cr-aside pr-aside">
              <h3>Tu portal de paciente</h3>
              <ul className="cr-aside__list">
                <li>Reserva y gestiona <strong>citas online</strong></li>
                <li>Consulta <strong>informes</strong> y documentos</li>
                <li>Revisa <strong>facturas</strong> y mensajes</li>
                <li>Firma <strong>consentimientos</strong> digitales</li>
                <li>Datos solo visibles para tu clínica</li>
              </ul>
              <p className="cr-aside__muted">
                ¿Eres clínica? <a href="/registro-clinica">Registrar centro dental</a>.
              </p>
              <p className="cr-aside__muted">
                Tras activar, entra en <a href="/reserva">Reservar cita</a>.
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
