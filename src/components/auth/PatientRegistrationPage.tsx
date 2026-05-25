import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Phone, UserRound } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { Field, Input, Select } from '@/components/ui';
import { email, phone, required } from '@/lib/validation';

type ClinicOption = { id: string; name: string; address: string };

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  dni: string;
  clinic_id: string;
  password: string;
  accept_legal: boolean;
};

const initial: FormState = {
  full_name: '',
  email: '',
  phone: '',
  dni: '',
  clinic_id: '',
  password: '',
  accept_legal: false
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
    if (!form.dni.trim() || form.dni.trim().length < 8) e.dni = 'DNI/NIE obligatorio.';
    if (!form.clinic_id) e.clinic_id = 'Selecciona tu clínica.';
    if (form.password.length < 8) e.password = 'Mín. 8 caracteres (letras y números).';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      e.password = 'Incluye letras y números.';
    }
    if (!form.accept_legal) e.accept_legal = 'Debes aceptar términos y privacidad.';
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
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          dni: form.dni.trim().toUpperCase(),
          clinic_id: form.clinic_id,
          password: form.password,
          password_confirm: form.password,
          accept_terms: true,
          accept_privacy: true
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
    <main className="pr-register">
      <div className="pr-register__bg" aria-hidden>
        <img
          src="/images/registro-paciente-bg.jpg"
          alt=""
          className="pr-register__bg-img"
          loading="eager"
          decoding="async"
        />
        <div className="pr-register__overlay" />
      </div>

      <article className="pr-register__card">
        <header className="pr-register__head">
          <LogoMark size={44} />
          <div>
            <p className="pr-register__eyebrow">AgendaClinic · Paciente</p>
            <h1>Registro</h1>
          </div>
        </header>

        {apiReady === false ? (
          <p className="pr-register__alert" role="alert">
            El registro no está disponible. <a href="/contacto">Contacto</a>
          </p>
        ) : sent ? (
          <div className="pr-register__done" role="status">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
            <p className="pr-register__done-title">Revisa tu correo</p>
            <p>
              Hemos enviado la activación a <strong>{registeredEmail}</strong>. Sin activar la cuenta no podrás
              iniciar sesión.
            </p>
            <a href="/login" className="btn btn--primary btn--sm w-full no-underline">
              Ir al login
            </a>
          </div>
        ) : (
          <form className="pr-register__form" onSubmit={submit} noValidate>
            <Field label="Nombre y apellidos" error={errors.full_name}>
              <div className="login-form__input-wrap">
                <UserRound className="login-form__icon" aria-hidden />
                <Input
                  className="login-form__input field-control"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  autoComplete="name"
                  disabled={!canSubmit || loading}
                />
              </div>
            </Field>

            <Field label="Email" error={errors.email}>
              <div className="login-form__input-wrap">
                <Mail className="login-form__icon" aria-hidden />
                <Input
                  type="email"
                  className="login-form__input field-control"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  disabled={!canSubmit || loading}
                />
              </div>
            </Field>

            <Field label="Teléfono" error={errors.phone}>
              <div className="login-form__input-wrap">
                <Phone className="login-form__icon" aria-hidden />
                <Input
                  type="tel"
                  className="login-form__input field-control"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                  disabled={!canSubmit || loading}
                />
              </div>
            </Field>

            <Field label="DNI / NIE" error={errors.dni}>
              <Input
                className="field-control"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value.toUpperCase() })}
                disabled={!canSubmit || loading}
              />
            </Field>

            <Field label="Clínica" error={errors.clinic_id}>
              <Select
                className="field-control"
                value={form.clinic_id}
                onChange={(e) => setForm({ ...form, clinic_id: e.target.value })}
                disabled={!canSubmit || loading || apiReady === null}
              >
                <option value="">Selecciona…</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Contraseña" error={errors.password}>
              <div className="login-form__input-wrap">
                <Lock className="login-form__icon" aria-hidden />
                <Input
                  type="password"
                  className="login-form__input field-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  disabled={!canSubmit || loading}
                />
              </div>
            </Field>

            <label className={`pr-register__check ${errors.accept_legal ? 'pr-register__check--err' : ''}`}>
              <input
                type="checkbox"
                checked={form.accept_legal}
                onChange={(e) => setForm({ ...form, accept_legal: e.target.checked })}
                disabled={!canSubmit || loading}
              />
              <span>
                Acepto{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer">
                  términos
                </a>{' '}
                y{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                  privacidad
                </a>
              </span>
            </label>
            {errors.accept_legal ? (
              <p className="login-form__error" role="alert">
                {errors.accept_legal}
              </p>
            ) : null}

            {errors.form ? (
              <p className="login-form__error" role="alert">
                {errors.form}
              </p>
            ) : null}

            <button
              type="submit"
              className="login-form__submit btn btn--primary w-full"
              disabled={!canSubmit || loading || apiReady === null}
            >
              {loading ? 'Registrando…' : 'Crear cuenta'}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>

            <p className="pr-register__hint">
              Tras registrarte recibirás un correo para activar la cuenta (48 h).
            </p>
          </form>
        )}

        <footer className="pr-register__foot">
          ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
        </footer>
      </article>
    </main>
  );
}
