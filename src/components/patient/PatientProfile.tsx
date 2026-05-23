import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Eye,
  FileSignature,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  X
} from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { usePatient } from '@/hooks/usePatient';
import { logPortalAudit, usePortalAccess } from '@/hooks/usePortalAccess';
import { savePatient } from '@/lib/demoStore';
import type { Patient, ReminderChannel } from '@/types/demo';
import {
  clinicNameForPatient,
  computeProfileCompleteness,
  consentSummaryForPatient,
  displayNhc,
  formatLastAccess,
  formatLastProfileUpdate,
  NOTES_MAX,
  patientInitials,
  profileSnapshot,
  reminderChannelActive,
  toggleReminderChannel,
  type ProfileTab,
  validateProfileForm
} from '@/lib/patient/profileData';
import { ConfirmModal } from '@/components/ui';

const TABS: { id: ProfileTab; label: string; icon: typeof User }[] = [
  { id: 'personal', label: 'Datos personales', icon: User },
  { id: 'contact', label: 'Contacto', icon: Mail },
  { id: 'health', label: 'Salud y alergias', icon: Shield },
  { id: 'preferences', label: 'Preferencias', icon: Phone },
  { id: 'consents', label: 'Consentimientos', icon: FileSignature },
  { id: 'security', label: 'Seguridad', icon: Lock }
];

const REMINDER_CARDS: {
  ch: ReminderChannel;
  title: string;
  description: string;
  inactiveLabel: string;
}[] = [
  {
    ch: 'email',
    title: 'Email',
    description: 'Recibe confirmaciones, documentos y avisos importantes.',
    inactiveLabel: 'No configurado'
  },
  {
    ch: 'whatsapp',
    title: 'WhatsApp',
    description: 'Recibe recordatorios rápidos de cita.',
    inactiveLabel: 'No configurado'
  },
  {
    ch: 'sms',
    title: 'SMS',
    description: 'Recibe avisos importantes en tu móvil.',
    inactiveLabel: 'No configurado'
  }
];

function fieldClass(err?: string) {
  return err ? 'pprof-field pprof-field--error' : 'pprof-field';
}

export function PatientProfile() {
  const { state, commit } = useDemoStore();
  const base = usePatient();
  const { setNotice } = useNotice();
  const portalAccess = usePortalAccess();
  const formRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<ProfileTab>('personal');
  const [form, setForm] = useState<Patient>(base);
  const [savedSnap, setSavedSnap] = useState(() => profileSnapshot(base));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [phoneModal, setPhoneModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [sessionConfirm, setSessionConfirm] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    setForm(base);
    setSavedSnap(profileSnapshot(base));
  }, [base.id, base.profileUpdatedAt]);

  const dirty = profileSnapshot(form) !== savedSnap;
  const completeness = useMemo(() => computeProfileCompleteness(form), [form]);
  const clinicName = useMemo(() => clinicNameForPatient(state, form.preferredClinicId), [state, form.preferredClinicId]);
  const consents = useMemo(() => consentSummaryForPatient(state, form.id), [state, form.id]);
  const initials = patientInitials(form.fullName);
  const emailVerified = form.emailVerified ?? Boolean(form.email?.includes('@'));
  const phoneVerified = form.phoneVerified ?? false;
  const incomplete = completeness < 100;

  useEffect(() => {
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/perfil',
        resourceLabel: 'Mi perfil'
      });
    }
  }, [portalAccess.active]);

  const patch = useCallback((partial: Partial<Patient>) => {
    setForm((f) => ({ ...f, ...partial }));
    setSaveOk(false);
  }, []);

  function discard() {
    setForm(base);
    setSavedSnap(profileSnapshot(base));
    setErrors({});
    setNotice({ type: 'ok', message: 'Cambios descartados.' });
  }

  async function save() {
    const v = validateProfileForm(form);
    setErrors(v as Record<string, string>);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const updated: Patient = {
        ...form,
        profileUpdatedAt: new Date().toISOString()
      };
      commit(savePatient(state, updated));
      setSavedSnap(profileSnapshot(updated));
      setForm(updated);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
      setNotice({ type: 'ok', message: 'Cambios guardados correctamente.' });
      if (portalAccess.active) {
        void logPortalAudit({
          eventType: 'other',
          pagePath: '/paciente/perfil',
          resourceLabel: 'Perfil actualizado'
        });
      }
    } catch {
      setNotice({ type: 'error', message: 'No se pudieron guardar los cambios.' });
    } finally {
      setSaving(false);
    }
  }

  function verifyPhone() {
    if (!form.phone?.trim()) {
      setErrors((e) => ({ ...e, phone: 'Introduce un teléfono válido.' }));
      return;
    }
    const phoneErr = validateProfileForm(form).phone;
    if (phoneErr) {
      setErrors((e) => ({ ...e, phone: phoneErr }));
      return;
    }
    setPhoneModal(true);
    setVerifyCode('');
  }

  function confirmPhoneVerify() {
    if (verifyCode.trim().length < 4) {
      setNotice({ type: 'error', message: 'Introduce el código de verificación.' });
      return;
    }
    patch({ phoneVerified: true });
    setPhoneModal(false);
    setNotice({ type: 'ok', message: 'Teléfono verificado correctamente.' });
  }

  function openEmailChange() {
    setPendingEmail(form.email);
    setEmailModal(true);
  }

  function confirmEmailChange() {
    const v = validateProfileForm({ ...form, email: pendingEmail });
    if (v.email) {
      setNotice({ type: 'error', message: v.email });
      return;
    }
    patch({ email: pendingEmail.trim(), emailVerified: false });
    setEmailModal(false);
    setNotice({ type: 'ok', message: 'Revisa tu bandeja para confirmar el nuevo email.' });
  }

  function closeOtherSessions() {
    setSessionConfirm(false);
    setNotice({ type: 'ok', message: 'Otras sesiones cerradas correctamente.' });
    if (portalAccess.active) {
      void logPortalAudit({
        eventType: 'other',
        pagePath: '/paciente/perfil',
        resourceLabel: 'Cierre de otras sesiones'
      });
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTab('personal');
  }

  function completeProfile() {
    if (!form.phone?.trim()) setTab('contact');
    else if (!form.allergies?.trim()) setTab('health');
    else if ((form.reminderChannels?.length ?? 0) < 2) setTab('preferences');
    else setTab('contact');
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }

  return (
    <div className={`pprof-page${dirty ? ' pprof-page--dirty' : ''}`}>
      <header className="pprof-header">
        <h2>Mi perfil</h2>
        <p>Actualiza tus datos personales, información médica básica, preferencias de contacto y consentimientos.</p>
        <div className="pprof-security">
          <div>
            <Shield className="inline h-4 w-4 text-teal-700 mr-1" aria-hidden />
            <strong className="text-[0.78rem] text-teal-900">Perfil protegido</strong>
            <p className="m-0 text-[0.72rem] text-slate-600">
              Solo tú y tu clínica podéis consultar la información necesaria para gestionar tus citas y comunicaciones.
            </p>
          </div>
          <span className="prt-private-badge">
            <Lock className="h-3 w-3" aria-hidden />
            Acceso privado
          </span>
        </div>
      </header>

      <section className="pprof-hero">
        <div className="pprof-hero__avatar" aria-hidden>
          {initials}
        </div>
        <div className="pprof-hero__main">
          <h3>{form.fullName}</h3>
          <p className="pprof-hero__meta">
            <span>{displayNhc(form.nhc)}</span>
            <span className="pprof-hero__dot">·</span>
            <Building2 className="inline h-3.5 w-3.5" aria-hidden />
            <span>{clinicName}</span>
          </p>
          <div className="pprof-hero__progress">
            <div className="pprof-hero__progress-bar" style={{ width: `${completeness}%` }} />
          </div>
          <p className="pprof-hero__pct">{completeness}% completado</p>
          <div className="pprof-hero__badges">
            <span className={`pprof-badge${emailVerified ? ' pprof-badge--ok' : ' pprof-badge--warn'}`}>
              {emailVerified ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {emailVerified ? 'Email verificado' : 'Email pendiente'}
            </span>
            <span className={`pprof-badge${phoneVerified ? ' pprof-badge--ok' : ' pprof-badge--warn'}`}>
              {phoneVerified ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {phoneVerified ? 'Teléfono verificado' : 'Teléfono pendiente'}
            </span>
          </div>
        </div>
        <div className="pprof-hero__actions">
          {incomplete ? (
            <button type="button" className="pprof-btn pprof-btn--primary" onClick={completeProfile}>
              Completar perfil
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button type="button" className="pprof-btn pprof-btn--outline" onClick={scrollToForm}>
            <Eye className="h-4 w-4" aria-hidden />
            Ver mis datos
          </button>
        </div>
      </section>

      <div className="pprof-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`pprof-tab${tab === t.id ? ' pprof-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon className="h-4 w-4 shrink-0" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      <div className="pprof-layout">
        <div ref={formRef} className="pprof-form-panel">
          {tab === 'personal' ? (
            <section className="pprof-section pprof-section--animate">
              <h3>Datos personales</h3>
              <div className="pprof-grid">
                <label className={fieldClass(errors.fullName)}>
                  <span>Nombre completo</span>
                  <input value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} />
                  {errors.fullName ? <em>{errors.fullName}</em> : null}
                </label>
                <label className={fieldClass(errors.dni)}>
                  <span>DNI / NIE</span>
                  <input value={form.dni ?? ''} onChange={(e) => patch({ dni: e.target.value })} placeholder="12345678A" />
                </label>
                <label className={fieldClass(errors.birthDate)}>
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={form.birthDate ?? ''}
                    onChange={(e) => patch({ birthDate: e.target.value })}
                  />
                  {errors.birthDate ? <em>{errors.birthDate}</em> : null}
                </label>
                <label className="pprof-field">
                  <span>Clínica preferida</span>
                  <select
                    value={form.preferredClinicId ?? ''}
                    onChange={(e) => patch({ preferredClinicId: e.target.value })}
                  >
                    {state.clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pprof-field pprof-field--readonly">
                  <span>NHC</span>
                  <input value={displayNhc(form.nhc)} readOnly aria-readonly />
                </label>
              </div>
            </section>
          ) : null}

          {tab === 'contact' ? (
            <section className="pprof-section pprof-section--animate">
              <h3>Contacto</h3>
              <div className="pprof-grid">
                <label className={fieldClass(errors.email)}>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value, emailVerified: false })}
                  />
                  {errors.email ? <em>{errors.email}</em> : null}
                  <span className={`pprof-inline-badge${emailVerified ? ' pprof-inline-badge--ok' : ''}`}>
                    {emailVerified ? 'Email verificado' : 'Email pendiente'}
                  </span>
                </label>
                <label className={fieldClass(errors.phone)}>
                  <span>Teléfono</span>
                  <input value={form.phone} onChange={(e) => patch({ phone: e.target.value, phoneVerified: false })} />
                  {errors.phone ? <em>{errors.phone}</em> : null}
                  <span className={`pprof-inline-badge${phoneVerified ? ' pprof-inline-badge--ok' : ' pprof-inline-badge--warn'}`}>
                    {phoneVerified ? 'Teléfono verificado' : 'Teléfono pendiente'}
                  </span>
                </label>
                <label className="pprof-field">
                  <span>Dirección</span>
                  <input value={form.address ?? ''} onChange={(e) => patch({ address: e.target.value })} />
                </label>
                <label className="pprof-field">
                  <span>Ciudad</span>
                  <input value={form.city ?? ''} onChange={(e) => patch({ city: e.target.value })} />
                </label>
                <label className="pprof-field">
                  <span>Código postal</span>
                  <input value={form.postalCode ?? ''} onChange={(e) => patch({ postalCode: e.target.value })} />
                </label>
              </div>
              <div className="pprof-section__actions">
                <button type="button" className="pprof-btn pprof-btn--outline" onClick={verifyPhone}>
                  Verificar teléfono
                </button>
                <button type="button" className="pprof-btn pprof-btn--outline" onClick={openEmailChange}>
                  Cambiar email
                </button>
              </div>
            </section>
          ) : null}

          {tab === 'health' ? (
            <section className="pprof-section pprof-section--animate">
              <h3>Información de salud relevante</h3>
              <p className="pprof-helper">
                Esta información ayuda a la clínica a atenderte mejor, pero no sustituye tu historia clínica.
              </p>
              <div className="pprof-grid">
                <label className="pprof-field">
                  <span>Alergias</span>
                  <input value={form.allergies ?? ''} onChange={(e) => patch({ allergies: e.target.value })} />
                </label>
                <label className="pprof-field">
                  <span>Medicación</span>
                  <input value={form.medication ?? ''} onChange={(e) => patch({ medication: e.target.value })} />
                </label>
                <label className="pprof-field pprof-field--full">
                  <span>Observaciones médicas</span>
                  <textarea
                    rows={3}
                    value={form.notes ?? ''}
                    onChange={(e) => patch({ notes: e.target.value.slice(0, NOTES_MAX) })}
                    placeholder="Indica condiciones o antecedentes relevantes…"
                  />
                </label>
                <label className="pprof-field">
                  <span>Contacto de emergencia</span>
                  <input
                    value={form.emergencyContactName ?? ''}
                    onChange={(e) => patch({ emergencyContactName: e.target.value })}
                  />
                </label>
                <label className="pprof-field">
                  <span>Teléfono de emergencia</span>
                  <input
                    value={form.emergencyContactPhone ?? ''}
                    onChange={(e) => patch({ emergencyContactPhone: e.target.value })}
                  />
                </label>
              </div>
            </section>
          ) : null}

          {tab === 'preferences' ? (
            <>
              <section className="pprof-section pprof-section--animate">
                <h3>Preferencias de recordatorios</h3>
                <div className="pprof-reminders">
                  {REMINDER_CARDS.map((card) => {
                    const active = reminderChannelActive(form.reminderChannels, card.ch);
                    return (
                      <article key={card.ch} className={`pprof-reminder${active ? ' pprof-reminder--on' : ''}`}>
                        <div>
                          <h4>{card.title}</h4>
                          <p>{card.description}</p>
                          <span className={`pprof-reminder__status${active ? ' pprof-reminder__status--on' : ''}`}>
                            {active ? 'Activo' : card.inactiveLabel}
                          </span>
                        </div>
                        <label className="pprof-toggle">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              patch({
                                reminderChannels: toggleReminderChannel(form.reminderChannels, card.ch)
                              })
                            }
                          />
                          <span className="pprof-toggle__ui" />
                        </label>
                      </article>
                    );
                  })}
                </div>
              </section>
              <section className="pprof-section pprof-section--animate">
                <h3>Notas para la clínica</h3>
                <label className="pprof-field pprof-field--full">
                  <textarea
                    rows={4}
                    maxLength={NOTES_MAX}
                    value={form.notes ?? ''}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder="Añade información que quieras que tu clínica tenga en cuenta…"
                  />
                  <span className="pprof-counter">
                    {(form.notes ?? '').length}/{NOTES_MAX}
                  </span>
                </label>
              </section>
            </>
          ) : null}

          {tab === 'consents' ? (
            <section className="pprof-section pprof-section--animate">
              <h3>Consentimientos informados</h3>
              <p className="pprof-helper">
                Revisa y firma los documentos que tu clínica ha compartido contigo. Los consentimientos firmados quedan
                registrados de forma segura.
              </p>
              <dl className="pprof-mini-dl">
                <div>
                  <dt>Firmados</dt>
                  <dd>{consents.signed}</dd>
                </div>
                <div>
                  <dt>Pendientes</dt>
                  <dd>{consents.pending}</dd>
                </div>
                <div>
                  <dt>Último consentimiento</dt>
                  <dd>{consents.last}</dd>
                </div>
              </dl>
              <a href="/paciente/consentimientos" className="pprof-btn pprof-btn--primary no-underline inline-flex">
                <FileSignature className="h-4 w-4" aria-hidden />
                Ver y firmar
              </a>
            </section>
          ) : null}

          {tab === 'security' ? (
            <section className="pprof-section pprof-section--animate">
              <h3>Seguridad de la cuenta</h3>
              <dl className="pprof-mini-dl">
                <div>
                  <dt>Último acceso</dt>
                  <dd>{formatLastAccess()}</dd>
                </div>
                <div>
                  <dt>Sesiones activas</dt>
                  <dd>1</dd>
                </div>
                <div>
                  <dt>Contraseña</dt>
                  <dd>Configurada</dd>
                </div>
              </dl>
              <div className="pprof-section__actions pprof-section__actions--stack">
                <a href="/login/cambiar-password" className="pprof-btn pprof-btn--outline no-underline">
                  Cambiar contraseña
                </a>
                <button type="button" className="pprof-btn pprof-btn--danger" onClick={() => setSessionConfirm(true)}>
                  Cerrar otras sesiones
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="pprof-aside">
          {incomplete ? (
            <article className="pprof-aside-card pprof-aside-card--hint">
              <User className="h-6 w-6 text-teal-700" aria-hidden />
              <h4>Completa tu perfil</h4>
              <p>Añade tus datos de contacto, alergias y preferencias para que la clínica pueda atenderte mejor.</p>
              <button type="button" className="pprof-btn pprof-btn--primary w-full" onClick={completeProfile}>
                Completar ahora
              </button>
            </article>
          ) : null}

          <article className="pprof-aside-card" style={{ animationDelay: '0ms' }}>
            <h4>Resumen del perfil</h4>
            <dl>
              <div>
                <dt>Nombre</dt>
                <dd>{form.fullName}</dd>
              </div>
              <div>
                <dt>NHC</dt>
                <dd>{displayNhc(form.nhc)}</dd>
              </div>
              <div>
                <dt>Clínica preferida</dt>
                <dd>{clinicName}</dd>
              </div>
              <div>
                <dt>Perfil completado</dt>
                <dd>{completeness}%</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatLastProfileUpdate(form.profileUpdatedAt)}</dd>
              </div>
            </dl>
          </article>

          <article className="pprof-aside-card" style={{ animationDelay: '60ms' }}>
            <h4>Consentimientos informados</h4>
            <dl>
              <div>
                <dt>Firmados</dt>
                <dd>{consents.signed}</dd>
              </div>
              <div>
                <dt>Pendientes</dt>
                <dd>{consents.pending}</dd>
              </div>
              <div>
                <dt>Último consentimiento</dt>
                <dd>{consents.last}</dd>
              </div>
            </dl>
            <a href="/paciente/consentimientos" className="pprof-btn pprof-btn--outline w-full no-underline mt-2">
              Ver y firmar
            </a>
          </article>

          <article className="pprof-aside-card" style={{ animationDelay: '120ms' }}>
            <h4>Seguridad de la cuenta</h4>
            <dl>
              <div>
                <dt>Último acceso</dt>
                <dd>{formatLastAccess()}</dd>
              </div>
              <div>
                <dt>Sesiones activas</dt>
                <dd>1</dd>
              </div>
              <div>
                <dt>Contraseña</dt>
                <dd>Configurada</dd>
              </div>
            </dl>
            <div className="pprof-aside-card__links">
              <a href="/login/cambiar-password">Cambiar contraseña</a>
              <button type="button" onClick={() => setSessionConfirm(true)}>
                Cerrar otras sesiones
              </button>
            </div>
          </article>
        </aside>
      </div>

      {dirty ? (
        <div className="pprof-savebar">
          <p>
            <AlertCircle className="inline h-4 w-4 text-amber-600 mr-1" aria-hidden />
            Tienes cambios sin guardar.
          </p>
          <div className="pprof-savebar__actions">
            <button type="button" className="pprof-btn pprof-btn--ghost" onClick={discard} disabled={saving}>
              Descartar cambios
            </button>
            <button
              type="button"
              className={`pprof-btn pprof-btn--primary${saveOk ? ' pprof-btn--success' : ''}`}
              disabled={saving}
              onClick={() => void save()}
            >
              {saveOk ? <Check className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      ) : null}

      {phoneModal ? (
        <div className="pprof-modal-backdrop" role="presentation" onClick={() => setPhoneModal(false)}>
          <div className="pprof-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>Verificar teléfono</h3>
              <button type="button" aria-label="Cerrar" onClick={() => setPhoneModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </header>
            <p className="text-sm text-slate-600">
              Hemos enviado un código de verificación al número <strong>{form.phone}</strong> (modo demo: usa cualquier
              código de 4 dígitos).
            </p>
            <label className="pprof-field">
              <span>Código</span>
              <input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="0000" />
            </label>
            <footer>
              <button type="button" className="pprof-btn pprof-btn--outline" onClick={() => setPhoneModal(false)}>
                Cancelar
              </button>
              <button type="button" className="pprof-btn pprof-btn--primary" onClick={confirmPhoneVerify}>
                Confirmar
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {emailModal ? (
        <div className="pprof-modal-backdrop" role="presentation" onClick={() => setEmailModal(false)}>
          <div className="pprof-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>Cambiar email</h3>
              <button type="button" aria-label="Cerrar" onClick={() => setEmailModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </header>
            <p className="text-sm text-slate-600">Introduce tu nuevo email. Deberás confirmarlo antes de que quede activo.</p>
            <label className="pprof-field">
              <span>Nuevo email</span>
              <input
                type="email"
                value={pendingEmail}
                onChange={(e) => setPendingEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </label>
            <footer>
              <button type="button" className="pprof-btn pprof-btn--outline" onClick={() => setEmailModal(false)}>
                Cancelar
              </button>
              <button type="button" className="pprof-btn pprof-btn--primary" onClick={confirmEmailChange}>
                Confirmar cambio
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={sessionConfirm}
        title="Cerrar otras sesiones"
        message="Debes confirmar esta acción. Se cerrarán las sesiones activas en otros dispositivos."
        confirmLabel="Confirmar"
        onConfirm={closeOtherSessions}
        onClose={() => setSessionConfirm(false)}
      />
    </div>
  );
}
