import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Lock, Mail, UserRound } from 'lucide-react';
import { email as validateEmail } from '@/lib/validation';

type ClinicOption = { id: string; name: string; address: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function PatientPortalRegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch('/api/public/clinics').then((r) => r.json()),
      fetch('/api/public/patient-registration').then((r) => r.json())
    ])
      .then(([clinicsJson, regJson]) => {
        const cj = clinicsJson as { data?: { clinics?: ClinicOption[]; available?: boolean } };
        const rj = regJson as { data?: { available?: boolean } };
        const list = cj.data?.clinics ?? [];
        setClinics(list);
        setApiReady(Boolean(rj.data?.available && cj.data?.available !== false));
        if (list.length === 1) setClinicId(list[0]!.id);
      })
      .catch(() => setApiReady(false));
  }, []);

  function resolveClinicId(): string {
    const code = inviteCode.trim();
    if (UUID_RE.test(code)) return code;
    if (clinicId) return clinicId;
    const match = clinics.find(
      (c) => c.id === code || c.name.toLowerCase() === code.toLowerCase()
    );
    return match?.id ?? '';
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.full_name = 'Indica tu nombre completo.';
    const em = validateEmail(email);
    if (em) next.email = 'Introduce un email válido.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      next.password = 'Mín. 8 caracteres con letras y números.';
    }
    if (!passwordConfirm) next.password_confirm = 'La contraseña es obligatoria.';
    else if (password !== passwordConfirm) next.password_confirm = 'Las contraseñas no coinciden.';
    const resolvedClinic = resolveClinicId();
    if (!resolvedClinic) next.invite_code = 'Introduce el código de invitación.';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      next.phone = 'Indica un teléfono válido (mín. 9 dígitos).';
    }
    if (!dni.trim() || dni.trim().length < 8) next.dni = 'Indica tu DNI/NIE.';
    return next;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (apiReady === false) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    const resolvedClinic = resolveClinicId();
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/public/patient-registration', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          dni: dni.trim().toUpperCase(),
          clinic_id: resolvedClinic,
          password,
          password_confirm: passwordConfirm,
          accept_terms: true,
          accept_privacy: true
        })
      });
      const json = (await res.json()) as { error?: { message?: string }; message?: string };
      if (!res.ok) {
        setErrors({ form: json.error?.message ?? json.message ?? 'No se pudo crear la cuenta.' });
        return;
      }
      setSuccess(true);
    } catch {
      setErrors({ form: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  }

  if (apiReady === false) {
    return (
      <p className="login-form__error" role="alert">
        El registro no está disponible en este momento.{' '}
        <a href="/contacto?tipo=soporte">Contacta con soporte</a>.
      </p>
    );
  }

  if (success) {
    return (
      <div className="ppp-v2-register__success" role="status">
        <CheckCircle2 className="h-8 w-8" aria-hidden />
        <p className="ppp-v2-register__success-title">Cuenta creada correctamente.</p>
        <p>Revisa tu correo para activar el acceso antes de iniciar sesión.</p>
        <a href="/terminos" className="ppp-v2-register__legal" target="_blank" rel="noopener noreferrer">
          Términos y privacidad
        </a>
      </div>
    );
  }

  const showClinicSelect = clinics.length > 1 && !UUID_RE.test(inviteCode.trim());

  return (
    <form className="ppp-v2-register" onSubmit={submit} noValidate>
      <div className={`login-form__field${errors.full_name ? ' login-form__field--error' : ''}`}>
        <label className="login-form__label" htmlFor="ppp-reg-name">
          Nombre completo
        </label>
        <div className="login-form__input-wrap">
          <UserRound className="login-form__icon" aria-hidden />
          <input
            id="ppp-reg-name"
            className="login-form__input field-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            disabled={loading}
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? 'ppp-reg-name-err' : undefined}
          />
        </div>
        {errors.full_name ? (
          <p id="ppp-reg-name-err" className="login-form__error" role="alert">
            {errors.full_name}
          </p>
        ) : null}
      </div>

      <div className={`login-form__field${errors.email ? ' login-form__field--error' : ''}`}>
        <label className="login-form__label" htmlFor="ppp-reg-email">
          Email
        </label>
        <div className="login-form__input-wrap">
          <Mail className="login-form__icon" aria-hidden />
          <input
            id="ppp-reg-email"
            type="email"
            className="login-form__input field-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="tu@email.com"
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'ppp-reg-email-err' : undefined}
          />
        </div>
        {errors.email ? (
          <p id="ppp-reg-email-err" className="login-form__error" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className={`login-form__field${errors.password ? ' login-form__field--error' : ''}`}>
        <label className="login-form__label" htmlFor="ppp-reg-password">
          Contraseña
        </label>
        <div className="login-form__input-wrap">
          <Lock className="login-form__icon" aria-hidden />
          <input
            id="ppp-reg-password"
            type="password"
            className="login-form__input field-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'ppp-reg-password-err' : undefined}
          />
        </div>
        {errors.password ? (
          <p id="ppp-reg-password-err" className="login-form__error" role="alert">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className={`login-form__field${errors.password_confirm ? ' login-form__field--error' : ''}`}>
        <label className="login-form__label" htmlFor="ppp-reg-password2">
          Confirmar contraseña
        </label>
        <div className="login-form__input-wrap">
          <Lock className="login-form__icon" aria-hidden />
          <input
            id="ppp-reg-password2"
            type="password"
            className="login-form__input field-control"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            aria-invalid={Boolean(errors.password_confirm)}
            aria-describedby={errors.password_confirm ? 'ppp-reg-password2-err' : undefined}
          />
        </div>
        {errors.password_confirm ? (
          <p id="ppp-reg-password2-err" className="login-form__error" role="alert">
            {errors.password_confirm}
          </p>
        ) : null}
      </div>

      <div className={`login-form__field${errors.invite_code ? ' login-form__field--error' : ''}`}>
        <label className="login-form__label" htmlFor="ppp-reg-invite">
          Código o invitación de la clínica
        </label>
        <input
          id="ppp-reg-invite"
          className="login-form__input field-control"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Código que te envió tu clínica"
          disabled={loading}
          aria-invalid={Boolean(errors.invite_code)}
          aria-describedby={errors.invite_code ? 'ppp-reg-invite-err' : undefined}
        />
        {errors.invite_code ? (
          <p id="ppp-reg-invite-err" className="login-form__error" role="alert">
            {errors.invite_code}
          </p>
        ) : null}
      </div>

      {showClinicSelect ? (
        <div className={`login-form__field${errors.invite_code ? ' login-form__field--error' : ''}`}>
          <label className="login-form__label" htmlFor="ppp-reg-clinic">
            O selecciona tu clínica
          </label>
          <select
            id="ppp-reg-clinic"
            className="field-control"
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            disabled={loading}
          >
            <option value="">Selecciona…</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <details className="ppp-v2-register__extra">
        <summary>Datos de identificación (requeridos)</summary>
        <div className={`login-form__field${errors.phone ? ' login-form__field--error' : ''}`}>
          <label className="login-form__label" htmlFor="ppp-reg-phone">
            Teléfono
          </label>
          <input
            id="ppp-reg-phone"
            type="tel"
            className="field-control"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            disabled={loading}
          />
          {errors.phone ? (
            <p className="login-form__error" role="alert">
              {errors.phone}
            </p>
          ) : null}
        </div>
        <div className={`login-form__field${errors.dni ? ' login-form__field--error' : ''}`}>
          <label className="login-form__label" htmlFor="ppp-reg-dni">
            DNI / NIE
          </label>
          <input
            id="ppp-reg-dni"
            className="field-control"
            value={dni}
            onChange={(e) => setDni(e.target.value.toUpperCase())}
            disabled={loading}
          />
          {errors.dni ? (
            <p className="login-form__error" role="alert">
              {errors.dni}
            </p>
          ) : null}
        </div>
      </details>

      {errors.form ? (
        <p className="login-form__error" role="alert">
          {errors.form}
        </p>
      ) : null}

      <button type="submit" className="login-form__submit btn btn--primary w-full" disabled={loading || apiReady === null}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="ppp-v2-register__legal">
        Al registrarte aceptas los{' '}
        <a href="/terminos" target="_blank" rel="noopener noreferrer">
          términos
        </a>{' '}
        y la{' '}
        <a href="/privacidad" target="_blank" rel="noopener noreferrer">
          privacidad
        </a>
        .
      </p>
    </form>
  );
}
