import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui';
import { email, phone, required } from '@/lib/validation';

export type ProPlan = 'pro_clinica' | 'pro_multi';

const planOptions = [
  { value: 'pro_clinica', label: 'PRO Clínica' },
  { value: 'pro_multi', label: 'PRO Multi-clínica' }
] as const;

type Props = {
  plan: ProPlan;
  onPlanChange: (plan: ProPlan) => void;
  compact?: boolean;
};

export function ProAccessForm({ plan, onPlanChange, compact = false }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    clinic_name: '',
    contact_name: '',
    email: '',
    phone: '',
    branches: '1',
    message: '',
    accept_terms: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('plan');
    if (q === 'pro_multi' || q === 'pro_clinica') onPlanChange(q);
  }, [onPlanChange]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const errClinic = required(form.clinic_name, 'Nombre de la clínica');
    const errContact = required(form.contact_name, 'Nombre de contacto');
    const errEmail = email(form.email);
    const errPhone = phone(form.phone);
    const branches = Number.parseInt(form.branches, 10);
    if (errClinic) next.clinic_name = errClinic;
    if (errContact) next.contact_name = errContact;
    if (errEmail) next.email = errEmail;
    if (errPhone) next.phone = errPhone;
    if (!Number.isFinite(branches) || branches < 1) next.branches = 'Indica al menos 1 sede.';
    if (!form.accept_terms) next.accept_terms = 'Debes aceptar la política de privacidad.';
    setErrors(next);
    if (Object.keys(next).length) {
      if (!next.form) next.form = 'Completa los campos obligatorios.';
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('/api/public/pro-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinic_name: form.clinic_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          branches,
          plan,
          message: form.message.trim(),
          accept_terms: true
        })
      });
      const json = (await res.json()) as {
        error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } };
      };
      if (!res.ok) {
        const fieldErrors = json.error?.details?.fieldErrors;
        if (fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(fieldErrors)) {
            if (msgs?.[0]) mapped[key] = msgs[0];
          }
          if (Object.keys(mapped).length) {
            setErrors(mapped);
            return;
          }
        }
        setErrors({ form: json.error?.message ?? 'No se pudo enviar la solicitud.' });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: 'No se pudo enviar la solicitud.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`pro-form-panel${compact ? ' pro-form-panel--compact' : ''}`}>
      {!compact ? (
        <header className="pro-form-panel__head">
          <span className="pro-eyebrow">Demo clínica</span>
          <h2 id="contacto-pro-title">Solicitar demo para tu clínica</h2>
          <p>Cuéntanos sobre tu clínica y te contactaremos para una demostración de Dentista+.</p>
        </header>
      ) : null}

      {sent ? (
        <div className="pro-form-success" role="status">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
          <p className="pro-form-success__title">Solicitud enviada correctamente.</p>
          <p>
            Gracias, {form.contact_name}. Hemos recibido tu solicitud para <strong>{form.clinic_name}</strong> y
            te responderemos a {form.email}.
          </p>
          <button
            type="button"
            className="btn btn--outline-teal btn--sm mt-4"
            onClick={() => {
              setSent(false);
              setForm({
                clinic_name: '',
                contact_name: '',
                email: '',
                phone: '',
                branches: '1',
                message: '',
                accept_terms: false
              });
            }}
          >
            Enviar otra solicitud
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="pro-form" noValidate>
          <div className="pro-form__grid">
            <Field label="Nombre de la clínica" error={errors.clinic_name}>
              <Input
                value={form.clinic_name}
                onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                placeholder="Clínica Dental Ejemplo"
                autoComplete="organization"
              />
            </Field>
            <Field label="Nombre" error={errors.contact_name}>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="Nombre y apellidos"
                autoComplete="name"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@clinica.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Teléfono" error={errors.phone}>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+34 600 000 000"
                autoComplete="tel"
              />
            </Field>
            <Field label="Número de sedes" error={errors.branches}>
              <Input
                type="number"
                min={1}
                max={500}
                value={form.branches}
                onChange={(e) => setForm({ ...form, branches: e.target.value })}
              />
            </Field>
            <Field label="Plan interesado" error={errors.plan}>
              <Select
                value={plan}
                onChange={(e) => onPlanChange(e.target.value as ProPlan)}
              >
                {planOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Mensaje (opcional)" error={errors.message}>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Cuéntanos tu situación actual, volumen de pacientes o necesidades…"
              rows={compact ? 3 : 4}
            />
          </Field>
          <label className="pro-form__terms">
            <input
              type="checkbox"
              checked={form.accept_terms}
              onChange={(e) => setForm({ ...form, accept_terms: e.target.checked })}
            />
            <span>
              Acepto la{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                política de privacidad
              </a>
              .
            </span>
          </label>
          {errors.accept_terms ? <p className="pro-form__error">{errors.accept_terms}</p> : null}
          {errors.form ? <p className="pro-form__error">{errors.form}</p> : null}
          <button type="submit" className="btn btn--coral btn--lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              'Enviar solicitud'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
