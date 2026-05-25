import { useState } from 'react';
import { X } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui';
import { email, required } from '@/lib/validation';
import type { PricingPlanId } from '@/lib/landing/productExperienceContent';

type Props = {
  open: boolean;
  onClose: () => void;
  onRecommended: (planId: PricingPlanId) => void;
};

type FormState = {
  clinics: string;
  professionals: string;
  billing: string;
  portal: string;
  multi: string;
  email: string;
};

function recommendPlan(form: FormState): PricingPlanId {
  const clinics = Number.parseInt(form.clinics, 10) || 0;
  const pros = Number.parseInt(form.professionals, 10) || 0;
  if (form.multi === 'si' || clinics >= 3) return 'multi';
  if (clinics >= 2) return 'multi';
  if (form.billing === 'si' && pros >= 8) return 'profesional';
  if (pros <= 2 && form.billing === 'no') return 'esencial';
  return 'profesional';
}

export function PlanRecommenderModal({ open, onClose, onRecommended }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    clinics: '',
    professionals: '',
    billing: 'si',
    portal: 'si',
    multi: 'no',
    email: ''
  });

  if (!open) return null;

  function validate() {
    const next: Record<string, string> = {};
    const c = required(form.clinics, 'Número de clínicas');
    if (c) next.clinics = c;
    const p = required(form.professionals, 'Número de profesionales');
    if (p) next.professionals = p;
    const e = email(form.email);
    if (e) next.email = e;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const planId = recommendPlan(form);
    const labels: Record<PricingPlanId, string> = {
      esencial: 'Esencial',
      profesional: 'Profesional',
      multi: 'Multi-sede',
      enterprise: 'Enterprise'
    };
    setResult(`Te recomendamos el plan ${labels[planId]} para tu clínica.`);
    onRecommended(planId);
  }

  function close() {
    setResult(null);
    setErrors({});
    onClose();
  }

  return (
    <div className="ps-plan-modal" role="dialog" aria-modal aria-labelledby="ps-plan-modal-title">
      <button type="button" className="ps-plan-modal__backdrop" aria-label="Cerrar" onClick={close} />
      <div className="ps-plan-modal__panel">
        <button type="button" className="ps-plan-modal__close" onClick={close} aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
        <h2 id="ps-plan-modal-title">Recomendador de plan</h2>
        <p className="ps-plan-modal__lead">
          Cuéntanos el tamaño de tu clínica y te sugerimos el plan más adecuado.
        </p>
        <form className="ps-plan-modal__form" onSubmit={submit} noValidate>
          <Field label="Número de clínicas" error={errors.clinics}>
            <Input
              type="number"
              min={1}
              value={form.clinics}
              onChange={(e) => setForm((f) => ({ ...f, clinics: e.target.value }))}
              required
            />
          </Field>
          <Field label="Número de profesionales" error={errors.professionals}>
            <Input
              type="number"
              min={1}
              value={form.professionals}
              onChange={(e) => setForm((f) => ({ ...f, professionals: e.target.value }))}
              required
            />
          </Field>
          <Field label="¿Necesitas facturación?">
            <Select
              value={form.billing}
              onChange={(e) => setForm((f) => ({ ...f, billing: e.target.value }))}
            >
              <option value="si">Sí</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="¿Necesitas portal paciente?">
            <Select
              value={form.portal}
              onChange={(e) => setForm((f) => ({ ...f, portal: e.target.value }))}
            >
              <option value="si">Sí</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="¿Necesitas multi-sede?">
            <Select value={form.multi} onChange={(e) => setForm((f) => ({ ...f, multi: e.target.value }))}>
              <option value="no">No</option>
              <option value="si">Sí</option>
            </Select>
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </Field>
          {result ? <p className="ps-plan-modal__result">{result}</p> : null}
          <button type="submit" className="ps-btn ps-btn--primary ps-btn--block">
            Ver recomendación
          </button>
        </form>
      </div>
    </div>
  );
}
