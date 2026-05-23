import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, ExternalLink, Eye, Lock, Mail, RefreshCw, RotateCcw, Save, Settings, Shield, X
} from 'lucide-react';
import {
  buildSettingsSummary,
  validatePlatformSettings,
  type EmailTemplateKey,
  type PlatformSettingsConfig
} from '@/lib/platform/platformSettingsDemo';
import { PlatformShell } from './PlatformShell';

type TabId = 'general' | 'branding' | 'registration' | 'security' | 'emails' | 'plans' | 'integrations' | 'advanced';
type PreviewTab = 'sidebar' | 'login' | 'email' | 'pdf';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'registration', label: 'Registro de clínicas' },
  { id: 'security', label: 'Seguridad' },
  { id: 'emails', label: 'Emails' },
  { id: 'plans', label: 'Planes' },
  { id: 'integrations', label: 'Integraciones' },
  { id: 'advanced', label: 'Avanzado' }
];

const TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  welcome: 'Plantilla bienvenida clínica',
  credentials: 'Plantilla credenciales',
  rejection: 'Plantilla rechazo de solicitud',
  paymentReminder: 'Plantilla recordatorio de pago'
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];

async function apiGet<T>(): Promise<T> {
  const res = await fetch('/api/platform/settings', { credentials: 'include' });
  const json = (await res.json()) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'Error de servidor');
  return json.data as T;
}

async function apiPost<T>(body: Record<string, unknown>): Promise<{ data: T; message?: string }> {
  const res = await fetch('/api/platform/settings', {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = (await res.json()) as { data?: T; error?: { message?: string }; meta?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? 'No se pudieron guardar los cambios.');
  return { data: json.data as T, message: json.meta?.message };
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="cfg-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}{hint ? <small>{hint}</small> : null}</span>
    </label>
  );
}

function BrandPreview({ config, previewTab }: { config: PlatformSettingsConfig; previewTab: PreviewTab }) {
  const p = config.branding.primaryColor;
  const s = config.branding.secondaryColor;
  const name = config.branding.appName;
  if (previewTab === 'login') {
    return (
      <div className="cfg-preview-frame cfg-preview-frame--fade" style={{ padding: '1rem', background: '#f1f5f9' }}>
        <div style={{ maxWidth: '12rem', margin: '0 auto', background: '#fff', borderRadius: 10, padding: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: p, marginBottom: 6 }} />
          <p style={{ fontWeight: 800, fontSize: '0.7rem', margin: 0 }}>{name}</p>
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, margin: '6px 0' }} />
          <div style={{ height: 20, background: p, borderRadius: 6, marginTop: 8 }} />
        </div>
      </div>
    );
  }
  if (previewTab === 'email') {
    return (
      <div className="cfg-preview-frame cfg-preview-frame--fade" style={{ padding: '0.75rem', fontSize: '0.65rem' }}>
        <div style={{ borderBottom: `3px solid ${p}`, paddingBottom: 6, fontWeight: 800 }}>{name}</div>
        <p style={{ margin: '8px 0', color: '#64748b' }}>Hola, tu clínica ha sido aprobada.</p>
        <span style={{ color: s, fontWeight: 700 }}>Ver panel</span>
      </div>
    );
  }
  if (previewTab === 'pdf') {
    return (
      <div className="cfg-preview-frame cfg-preview-frame--fade" style={{ padding: '0.75rem', fontSize: '0.65rem', border: `2px solid ${p}` }}>
        <strong>{name}</strong>
        <p style={{ color: '#94a3b8' }}>Informe agregado · sin datos clínicos</p>
      </div>
    );
  }
  return (
    <div className="cfg-preview-frame cfg-preview-frame--fade cfg-preview-sidebar">
      <div className="cfg-preview-rail" style={{ background: '#0f172a' }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: p, marginBottom: 4 }} />
        {name}
      </div>
      <div className="cfg-preview-body">
        <p style={{ fontWeight: 700 }}>Panel clínica</p>
        <p style={{ color: p }}>● Activo</p>
      </div>
    </div>
  );
}

export function PlatformSettings() {
  const [config, setConfig] = useState<PlatformSettingsConfig | null>(null);
  const [saved, setSaved] = useState<PlatformSettingsConfig | null>(null);
  const [tab, setTab] = useState<TabId>('general');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('sidebar');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSavedBadge, setShowSavedBadge] = useState(true);
  const [editTemplate, setEditTemplate] = useState<EmailTemplateKey | null>(null);
  const [templateDraft, setTemplateDraft] = useState('');

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const summary = useMemo(() => (config ? buildSettingsSummary(config) : null), [config]);

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<PlatformSettingsConfig>();
      setConfig(data);
      setSaved(data);
      setShowSavedBadge(true);
    } catch {
      showToast('err', 'No se pudo cargar la configuración.');
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  function patch(fn: (c: PlatformSettingsConfig) => PlatformSettingsConfig) {
    setConfig((prev) => (prev ? fn(prev) : prev));
    setShowSavedBadge(false);
  }

  async function handleSave() {
    if (!config) return;
    const clientErr = validatePlatformSettings(config);
    if (Object.keys(clientErr).length) {
      setErrors(clientErr);
      showToast('err', Object.values(clientErr)[0] ?? 'Revisa los campos marcados.');
      return;
    }
    setBusy(true);
    try {
      const { data, message } = await apiPost<PlatformSettingsConfig>({ action: 'save', config });
      setConfig(data);
      setSaved(data);
      setErrors({});
      setShowSavedBadge(true);
      showToast('ok', message ?? 'Cambios guardados correctamente.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudieron guardar los cambios.');
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    if (saved) { setConfig(structuredClone(saved)); setErrors({}); setShowSavedBadge(true); showToast('ok', 'Cambios descartados.'); }
  }

  async function restoreDefaults() {
    if (!window.confirm('¿Restaurar todos los valores por defecto? Esta acción no se puede deshacer sin guardar.')) return;
    setBusy(true);
    try {
      const { data, message } = await apiPost<PlatformSettingsConfig>({ action: 'reset' });
      setConfig(data);
      setSaved(data);
      setShowSavedBadge(true);
      showToast('ok', message ?? 'Valores por defecto restaurados.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo restaurar.');
    } finally {
      setBusy(false);
    }
  }

  async function testEmail() {
    setBusy(true);
    try {
      const { message } = await apiPost<{ sent: boolean; mock: boolean }>({ action: 'test_email' });
      showToast('ok', message ?? 'Email enviado.');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'No se pudo enviar el email.');
    } finally {
      setBusy(false);
    }
  }

  function handleLogoUpload(field: 'logoMain' | 'logoCompact' | 'favicon', file: File | null) {
    if (!file) return;
    if (!ALLOWED_LOGO.includes(file.type) && !file.name.endsWith('.svg')) {
      showToast('err', 'Formato no válido. Usa PNG o SVG (máx. 2MB).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast('err', 'El archivo supera 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch((c) => ({ ...c, branding: { ...c.branding, [field]: String(reader.result) } }));
    };
    reader.readAsDataURL(file);
  }

  const showBranding = tab === 'general' || tab === 'branding';
  const showReg = tab === 'general' || tab === 'registration';
  const showSec = tab === 'general' || tab === 'security';
  const showEmails = tab === 'general' || tab === 'emails';
  const showLimits = tab === 'general' || tab === 'advanced';
  const showPlans = tab === 'plans';
  const showIntegrations = tab === 'integrations' || tab === 'advanced';

  if (!config) {
    return (
      <PlatformShell title="Configuración de plataforma" subtitle="Cargando…">
        <p className="text-sm text-[var(--muted)]">Cargando configuración…</p>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell
      title="Configuración de plataforma"
      subtitle="Define la marca global, reglas de registro, seguridad, notificaciones y parámetros operativos de Dentista+."
      headerActions={
        <div className="cfg-top-actions">
          {showSavedBadge && !dirty ? (
            <span className="cfg-status"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />Cambios guardados</span>
          ) : dirty ? (
            <span className="cfg-status cfg-status--dirty">Cambios sin guardar</span>
          ) : null}
          <button type="button" className="plt-btn plt-btn--primary" disabled={busy || !dirty} onClick={() => void handleSave()}>
            <Save className="h-4 w-4" aria-hidden />Guardar cambios
          </button>
          <button type="button" className="plt-btn plt-btn--secondary" disabled={!dirty} onClick={discard}>
            <RotateCcw className="h-4 w-4" aria-hidden />Descartar cambios
          </button>
          <button type="button" className="plt-btn plt-btn--ghost" disabled={busy} onClick={() => void restoreDefaults()}>
            <RefreshCw className="h-4 w-4" aria-hidden />Restaurar valores por defecto
          </button>
        </div>
      }
    >
      <div className="cfg-page">
        <div className="cfg-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
              className={`cfg-tab${tab === t.id ? ' cfg-tab--active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="cfg-layout">
          <div className="cfg-main">
            {showBranding ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Branding global</h2>
                <div className="cfg-grid-2">
                  <div className={`cfg-field${errors.appName ? ' cfg-field--err' : ''}`}>
                    <label>Nombre de la app</label>
                    <input value={config.branding.appName} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, appName: e.target.value } }))} />
                    {errors.appName ? <p className="cfg-field__err">{errors.appName}</p> : null}
                  </div>
                  <div className={`cfg-field${errors.supportEmail ? ' cfg-field--err' : ''}`}>
                    <label>Email de soporte</label>
                    <input type="email" value={config.branding.supportEmail} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, supportEmail: e.target.value } }))} />
                  </div>
                  <div className={`cfg-field${errors.publicUrl ? ' cfg-field--err' : ''}`}>
                    <label>URL pública</label>
                    <input value={config.branding.publicUrl} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, publicUrl: e.target.value } }))} />
                  </div>
                  <div className="cfg-field">
                    <label>Texto legal footer</label>
                    <input value={config.branding.footerLegal} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, footerLegal: e.target.value } }))} />
                  </div>
                </div>
                <div className="cfg-uploads">
                  {(['logoMain', 'logoCompact', 'favicon'] as const).map((key) => (
                    <div key={key} className="cfg-upload">
                      <p className="text-xs font-bold mb-1">{key === 'logoMain' ? 'Logo principal' : key === 'logoCompact' ? 'Logo compacto' : 'Favicon'}</p>
                      <div className="cfg-upload__preview">
                        {config.branding[key] ? <img src={config.branding[key]!} alt="" /> : <Settings className="h-5 w-5 text-slate-400" />}
                      </div>
                      <label className="plt-btn plt-btn--secondary plt-btn--sm" style={{ cursor: 'pointer' }}>
                        Cambiar
                        <input type="file" accept=".png,.svg,.jpg,.jpeg,.webp" className="sr-only" onChange={(e) => handleLogoUpload(key, e.target.files?.[0] ?? null)} />
                      </label>
                      <p className="text-[0.6rem] text-slate-400 mt-1">PNG o SVG. Máx 2MB</p>
                    </div>
                  ))}
                </div>
                <div className="cfg-colors">
                  <div className="cfg-field">
                    <label>Color principal</label>
                    <div className="cfg-color-row">
                      <input type="color" value={config.branding.primaryColor} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, primaryColor: e.target.value } }))} />
                      <input value={config.branding.primaryColor} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, primaryColor: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="cfg-field">
                    <label>Color secundario</label>
                    <div className="cfg-color-row">
                      <input type="color" value={config.branding.secondaryColor} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, secondaryColor: e.target.value } }))} />
                      <input value={config.branding.secondaryColor} onChange={(e) => patch((c) => ({ ...c, branding: { ...c.branding, secondaryColor: e.target.value } }))} />
                    </div>
                  </div>
                </div>
                {(tab === 'branding' || tab === 'general') ? (
                  <div style={{ marginTop: '1rem' }}>
                    <h3 className="cfg-card__title">Vista previa de marca</h3>
                    <div className="cfg-preview-tabs">
                      {(['sidebar', 'login', 'email', 'pdf'] as PreviewTab[]).map((pt) => (
                        <button key={pt} type="button" className={`cfg-preview-tab${previewTab === pt ? ' cfg-preview-tab--active' : ''}`}
                          onClick={() => setPreviewTab(pt)}>{pt === 'sidebar' ? 'Sidebar' : pt === 'login' ? 'Login' : pt === 'email' ? 'Email' : 'PDF'}</button>
                      ))}
                    </div>
                    <BrandPreview config={config} previewTab={previewTab} />
                  </div>
                ) : null}
              </section>
            ) : null}

            {showReg ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Reglas de alta de clínicas</h2>
                <div className="cfg-toggles">
                  <Toggle checked={config.registration.autoApprove} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, autoApprove: v } }))}
                    label="Aprobar automáticamente solicitudes" hint="No recomendado en producción." />
                  <Toggle checked={config.registration.requireEmailVerification} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, requireEmailVerification: v } }))} label="Exigir verificación de email" />
                  <Toggle checked={config.registration.requireTaxData} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, requireTaxData: v } }))} label="Exigir datos fiscales" />
                  <Toggle checked={config.registration.requirePhone} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, requirePhone: v } }))} label="Exigir teléfono" />
                  <Toggle checked={config.registration.requireTerms} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, requireTerms: v } }))} label="Exigir aceptación de términos" />
                  <Toggle checked={config.registration.autoTenantOnApprove} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, autoTenantOnApprove: v } }))} label="Crear tenant automáticamente tras aprobación" />
                  <Toggle checked={config.registration.sendAdminCredentials} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, sendAdminCredentials: v } }))} label="Enviar credenciales al admin" />
                  <Toggle checked={config.registration.defaultIsolation} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, defaultIsolation: v } }))} label="Activar aislamiento multi-tenant por defecto" />
                  <Toggle checked={config.registration.manualReviewProMulti} onChange={(v) => patch((c) => ({ ...c, registration: { ...c.registration, manualReviewProMulti: v } }))} label="Revisión manual obligatoria para PRO Multi-sede" />
                </div>
                <div className="cfg-grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="cfg-field">
                    <label>Plan asignado por defecto</label>
                    <select value={config.registration.defaultPlan} onChange={(e) => patch((c) => ({ ...c, registration: { ...c.registration, defaultPlan: e.target.value } }))}>
                      <option value="Básico">Básico</option>
                      <option value="Profesional">Profesional</option>
                      <option value="PRO Clínica">PRO Clínica</option>
                      <option value="PRO Multi-sede">PRO Multi-sede</option>
                    </select>
                  </div>
                  <div className={`cfg-field${errors.initialSeats ? ' cfg-field--err' : ''}`}>
                    <label>Límite inicial de asientos</label>
                    <input type="number" min={1} value={config.registration.initialSeats}
                      onChange={(e) => patch((c) => ({ ...c, registration: { ...c.registration, initialSeats: Number(e.target.value) } }))} />
                  </div>
                </div>
              </section>
            ) : null}

            {showSec ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Seguridad de plataforma</h2>
                <div className="cfg-toggles">
                  <Toggle checked={config.security.require2fa} onChange={(v) => patch((c) => ({ ...c, security: { ...c.security, require2fa: v } }))} label="Requerir 2FA para Super Admin" />
                  <Toggle checked={config.security.strongPassword} onChange={(v) => patch((c) => ({ ...c, security: { ...c.security, strongPassword: v } }))} label="Forzar contraseña segura" />
                  <Toggle checked={config.security.blockFailedAttempts} onChange={(v) => patch((c) => ({ ...c, security: { ...c.security, blockFailedAttempts: v } }))} label="Bloquear intentos fallidos" />
                  <Toggle checked={config.security.auditSensitive} onChange={(v) => patch((c) => ({ ...c, security: { ...c.security, auditSensitive: v } }))} label="Registrar eventos sensibles en auditoría" />
                </div>
                <div className="cfg-grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="cfg-field">
                    <label>Caducidad de sesión</label>
                    <select value={config.security.sessionExpiryMinutes} onChange={(e) => patch((c) => ({ ...c, security: { ...c.security, sessionExpiryMinutes: Number(e.target.value) } }))}>
                      <option value={30}>30 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={120}>120 minutos</option>
                    </select>
                  </div>
                  <div className="cfg-field">
                    <label>Intentos fallidos permitidos</label>
                    <input type="number" min={1} max={20} value={config.security.maxFailedAttempts}
                      onChange={(e) => patch((c) => ({ ...c, security: { ...c.security, maxFailedAttempts: Number(e.target.value) } }))} />
                  </div>
                </div>
              </section>
            ) : null}

            {showEmails ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Emails y comunicaciones</h2>
                <div className="cfg-grid-2">
                  <div className="cfg-field">
                    <label>Email remitente</label>
                    <input type="email" value={config.emails.fromEmail} onChange={(e) => patch((c) => ({ ...c, emails: { ...c.emails, fromEmail: e.target.value } }))} />
                  </div>
                  <div className="cfg-field">
                    <label>Nombre remitente</label>
                    <input value={config.emails.fromName} onChange={(e) => patch((c) => ({ ...c, emails: { ...c.emails, fromName: e.target.value } }))} />
                  </div>
                </div>
                <div className="cfg-templates">
                  {(Object.keys(TEMPLATE_LABELS) as EmailTemplateKey[]).map((k) => (
                    <div key={k} className="cfg-template-row">
                      <span>{TEMPLATE_LABELS[k]}</span>
                      <button type="button" onClick={() => { setEditTemplate(k); setTemplateDraft(config.emails.templates[k]); }}>Editar ›</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="plt-btn plt-btn--secondary" disabled={busy} onClick={() => void testEmail()}>
                  <Mail className="h-4 w-4" aria-hidden />Probar envío de email
                </button>
              </section>
            ) : null}

            {showLimits ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Límites por defecto</h2>
                <div className="cfg-grid-2">
                  <div className="cfg-field"><label>Asientos iniciales</label>
                    <input type="number" min={1} value={config.limits.initialSeats} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, initialSeats: Number(e.target.value) } }))} /></div>
                  <div className={`cfg-field${errors.maxFileSizeMb ? ' cfg-field--err' : ''}`}><label>Tamaño máximo de archivo (MB)</label>
                    <input type="number" min={1} value={config.limits.maxFileSizeMb} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, maxFileSizeMb: Number(e.target.value) } }))} /></div>
                  <div className="cfg-field"><label>Retención de logs (días)</label>
                    <input type="number" min={7} value={config.limits.logRetentionDays} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, logRetentionDays: Number(e.target.value) } }))} /></div>
                  <div className="cfg-field"><label>Límite de tickets abiertos</label>
                    <input type="number" min={1} value={config.limits.maxOpenTickets} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, maxOpenTickets: Number(e.target.value) } }))} /></div>
                  <div className="cfg-field"><label>Clínicas por organización</label>
                    <input type="number" min={1} value={config.limits.clinicsPerOrg} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, clinicsPerOrg: Number(e.target.value) } }))} /></div>
                  <div className="cfg-field"><label>Documentos por clínica</label>
                    <input type="number" min={100} value={config.limits.docsPerClinic} onChange={(e) => patch((c) => ({ ...c, limits: { ...c.limits, docsPerClinic: Number(e.target.value) } }))} /></div>
                </div>
              </section>
            ) : null}

            {showPlans ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">Planes SaaS</h2>
                <p className="text-xs text-[var(--muted)]">Los planes se gestionan en Suscripciones. El plan por defecto para nuevas altas es <strong>{config.registration.defaultPlan}</strong>.</p>
                <a href="/platform/suscripciones" className="plt-btn plt-btn--secondary plt-btn--sm mt-2 inline-flex">Configurar planes</a>
              </section>
            ) : null}

            {showIntegrations ? (
              <section className="cfg-card">
                <h2 className="cfg-card__title">{tab === 'integrations' ? 'Integraciones' : 'Opciones avanzadas'}</h2>
                <div className="cfg-toggles">
                  <Toggle checked={config.integrations.stripeEnabled} onChange={(v) => patch((c) => ({ ...c, integrations: { ...c.integrations, stripeEnabled: v } }))} label="Stripe (pagos)" />
                  <Toggle checked={config.integrations.redisCache} onChange={(v) => patch((c) => ({ ...c, integrations: { ...c.integrations, redisCache: v } }))} label="Redis cache" />
                  <Toggle checked={config.integrations.webhooksEnabled} onChange={(v) => patch((c) => ({ ...c, integrations: { ...c.integrations, webhooksEnabled: v } }))} label="Webhooks salientes" />
                  <Toggle checked={config.advanced.maintenanceMode} onChange={(v) => patch((c) => ({ ...c, advanced: { ...c.advanced, maintenanceMode: v } }))} label="Modo mantenimiento" />
                  <Toggle checked={config.advanced.debugRequests} onChange={(v) => patch((c) => ({ ...c, advanced: { ...c.advanced, debugRequests: v } }))} label="Depuración de peticiones API" />
                </div>
              </section>
            ) : null}
          </div>

          <aside className="cfg-side">
            <section className="cfg-card cfg-summary">
              <h2 className="cfg-card__title">Resumen de configuración</h2>
              {summary ? (
                <dl>
                  <div><dt>App</dt><dd>{summary.app}</dd></div>
                  <div><dt>Soporte</dt><dd>{summary.support}</dd></div>
                  <div><dt>Registro</dt><dd>{summary.registration}</dd></div>
                  <div><dt>Email verificado</dt><dd>{summary.emailVerified}</dd></div>
                  <div><dt>Tenant automático</dt><dd>{summary.autoTenant}</dd></div>
                  <div><dt>Plan por defecto</dt><dd>{summary.defaultPlan}</dd></div>
                  <div><dt>Aislamiento</dt><dd>{summary.isolation}</dd></div>
                  <div><dt>Auditoría</dt><dd>{summary.audit}</dd></div>
                </dl>
              ) : null}
            </section>
            <section className="cfg-card">
              <h2 className="cfg-card__title">Acciones rápidas</h2>
              <div className="cfg-qa">
                <button type="button" onClick={() => void testEmail()}><Mail className="h-4 w-4" />Probar email</button>
                <a href="/registro-clinica" target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" />Ver formulario público<ExternalLink className="h-3 w-3 ml-auto" /></a>
                <a href="/platform/incidencias"><Shield className="h-4 w-4" />Ver auditoría</a>
                <button type="button" className="cfg-qa__danger" onClick={() => void restoreDefaults()}><RefreshCw className="h-4 w-4" />Restaurar configuración</button>
              </div>
            </section>
            <section className="cfg-privacy">
              <strong><Lock className="h-3.5 w-3.5 inline" aria-hidden /> Privacidad</strong>
              <p className="mt-1">La configuración no expone datos clínicos. Cada cambio sensible queda registrado en auditoría.</p>
            </section>
          </aside>
        </div>

        <p className="cfg-footer-note">Los cambios en esta configuración afectan a toda la plataforma. Se registrará un evento en la auditoría por cada modificación.</p>

        {editTemplate ? (
          <div className="cfg-modal-backdrop" role="dialog" aria-modal="true">
            <div className="cfg-modal">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold">{TEMPLATE_LABELS[editTemplate]}</h3>
                <button type="button" className="cln-icon-btn" onClick={() => setEditTemplate(null)}><X className="h-4 w-4" /></button>
              </div>
              <textarea className="w-full border rounded-lg p-2 text-sm" rows={6} value={templateDraft} onChange={(e) => setTemplateDraft(e.target.value)} />
              <div className="flex gap-2 justify-end mt-3">
                <button type="button" className="plt-btn plt-btn--ghost" onClick={() => setEditTemplate(null)}>Cancelar</button>
                <button type="button" className="plt-btn plt-btn--primary" onClick={() => {
                  const k = editTemplate;
                  patch((c) => ({ ...c, emails: { ...c.emails, templates: { ...c.emails.templates, [k]: templateDraft } } }));
                  setEditTemplate(null);
                }}>Guardar plantilla</button>
              </div>
            </div>
          </div>
        ) : null}

        {toast ? <div className={`plt-toast plt-toast--${toast.type === 'ok' ? 'ok' : 'err'}`} role="status">{toast.text}</div> : null}
      </div>
    </PlatformShell>
  );
}
