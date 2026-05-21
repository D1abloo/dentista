import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
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
        error?: { message?: string; details?: unknown };
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
      <PublicHeader />
      <main className="pr">
        <section className="pr-hero shell">
          <div className="pr-hero__grid">
            <div className="pr-hero__copy">
              <span className="pr-badge">
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                Alta de paciente
              </span>
              <h1>Crea tu cuenta para reservar citas</h1>
              <p className="pr-hero__lead">
                El registro es <strong>obligatorio</strong> para pedir cita online. Tras enviar el formulario recibirás
                un correo para <strong>activar tu cuenta</strong> antes de poder iniciar sesión.
              </p>
              <ul className="pr-trust">
                <li>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Datos protegidos por clínica
                </li>
                <li>
                  <Mail className="h-4 w-4" aria-hidden />
                  Activación por email (48 h)
                </li>
                <li>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Portal con citas, informes y facturas
                </li>
              </ul>
            </div>
            <div className="pr-hero__visual" aria-hidden>
              <div className="pr-hero__orb" />
              <UserRound className="pr-hero__icon" />
            </div>
          </div>
        </section>

        <section className="shell pr-form-section">
          {apiReady === false ? (
            <div className="pr-alert" role="alert">
              <p>El registro no está disponible ahora. Contacta con tu clínica o escribe a soporte.</p>
              <a href="/contacto" className="btn btn--outline btn--sm mt-3">
                Contacto
              </a>
            </div>
          ) : sent ? (
            <article className="pr-success">
              <CheckCircle2 className="h-12 w-12 text-teal-600" aria-hidden />
              <h2>¡Registro completado!</h2>
              <p>
                Hemos enviado un correo a <strong>{registeredEmail}</strong> con el enlace de activación. Ábrelo en las
                próximas 48 horas.
              </p>
              <ol className="pr-success__steps">
                <li>Revisa bandeja de entrada y spam.</li>
                <li>Pulsa «Activar mi cuenta» en el correo.</li>
                <li>Inicia sesión y reserva tu cita.</li>
              </ol>
              <div className="pr-success__actions">
                <a href="/login" className="btn btn--primary no-underline">
                  Ir al login
                </a>
                <a href="/" className="btn btn--outline no-underline">
                  Inicio
                </a>
              </div>
            </article>
          ) : (
            <form className="pr-form" onSubmit={submit} noValidate>
              <header className="pr-form__head">
                <h2>Datos obligatorios</h2>
                <p>Todos los campos marcados son necesarios para crear tu ficha de paciente.</p>
              </header>

              <div className="pr-form__grid">
                <Field label="Nombre y apellidos *" error={errors.full_name}>
                  <div className="pr-field-icon">
                    <UserRound className="h-4 w-4" aria-hidden />
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      autoComplete="name"
                      placeholder="María García López"
                    />
                  </div>
                </Field>

                <Field label="DNI / NIE *" error={errors.dni}>
                  <div className="pr-field-icon">
                    <IdCard className="h-4 w-4" aria-hidden />
                    <Input
                      value={form.dni}
                      onChange={(e) => setForm({ ...form, dni: e.target.value.toUpperCase() })}
                      placeholder="12345678A"
                    />
                  </div>
                </Field>

                <Field label="Email *" error={errors.email}>
                  <div className="pr-field-icon">
                    <Mail className="h-4 w-4" aria-hidden />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      placeholder="tu@email.com"
                    />
                  </div>
                </Field>

                <Field label="Teléfono móvil *" error={errors.phone}>
                  <div className="pr-field-icon">
                    <Phone className="h-4 w-4" aria-hidden />
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      autoComplete="tel"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </Field>

                <Field label="Fecha de nacimiento" error={errors.birth_date}>
                  <div className="pr-field-icon">
                    <Calendar className="h-4 w-4" aria-hidden />
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                    />
                  </div>
                </Field>

                <Field label="Clínica *" error={errors.clinic_id} className="pr-form__full">
                  <Select
                    value={form.clinic_id}
                    onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
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

                <Field label="Contraseña *" error={errors.password}>
                  <div className="pr-field-icon">
                    <Lock className="h-4 w-4" aria-hidden />
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="new-password"
                      placeholder="Mín. 8 caracteres"
                    />
                  </div>
                </Field>

                <Field label="Repetir contraseña *" error={errors.password_confirm}>
                  <div className="pr-field-icon">
                    <Lock className="h-4 w-4" aria-hidden />
                    <Input
                      type="password"
                      value={form.password_confirm}
                      onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                      autoComplete="new-password"
                    />
                  </div>
                </Field>
              </div>

              <div className="pr-form__legal">
                <label className="pr-check">
                  <input
                    type="checkbox"
                    checked={form.accept_terms}
                    onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
                  />
                  <span>
                    Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">términos de uso</a> *
                  </span>
                </label>
                {errors.accept_terms ? <p className="pr-form__err">{errors.accept_terms}</p> : null}
                <label className="pr-check">
                  <input
                    type="checkbox"
                    checked={form.accept_privacy}
                    onChange={(e) => setForm({ ...form, accept_privacy: e.target.checked })}
                  />
                  <span>
                    Acepto la <a href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</a>{' '}
                    *
                  </span>
                </label>
                {errors.accept_privacy ? <p className="pr-form__err">{errors.accept_privacy}</p> : null}
              </div>

              {errors.form ? (
                <p className="pr-form__err pr-form__err--block" role="alert">
                  {errors.form}
                </p>
              ) : null}

              <Button type="submit" className="pr-form__submit" disabled={loading || apiReady === null}>
                {loading ? 'Creando cuenta…' : 'Crear cuenta y recibir activación'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>

              <p className="pr-form__login">
                ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
              </p>
            </form>
          )}
        </section>
      </main>
      <PublicFooter />
      <CookieBanner />
    </>
  );
}
