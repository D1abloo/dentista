import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Check,
  Facebook,
  Globe,
  Info,
  Instagram,
  Key,
  Lock,
  Receipt,
  Save
} from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { getStoredTenantId, saveSettings, settingsFor } from '@/lib/demoStore';
import {
  BRAND_PRESETS,
  INTERVAL_OPTIONS,
  MSG_LIMIT,
  SETTINGS_TABS,
  maskPortalToken,
  settingsSignature,
  settingsToForm,
  validateSettings,
  WEEKDAYS,
  type SettingsTabId
} from '@/lib/settingsForm';
import { defaultNotificationPrefs } from '@/lib/clinicNotifications';
import type { AppSettings, ClinicNotificationCategory, NotificationPrefs } from '@/types/demo';
import { Modal } from '@/components/ui';
import { AdminStaffPortalProfile } from './portalAccess';

const LOGO_MAX = 400_000;
const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg';

function CharCount({ value, limit = MSG_LIMIT }: { value: string; limit?: number }) {
  const n = value.length;
  return (
    <p className={`set-field__count${n > limit ? ' set-field__count--warn' : ''}`}>
      {n} / {limit} caracteres
    </p>
  );
}

function SettingsPreview({
  mode,
  form,
  logoUrl
}: {
  mode: 'sidebar' | 'invoice' | 'portal';
  form: AppSettings;
  logoUrl: string;
}) {
  if (mode === 'sidebar') {
    return (
      <div className="set-preview-sidebar">
        <img src={logoUrl} alt="" width={32} height={32} />
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '0.82rem' }}>{form.clinicName}</p>
          <p style={{ margin: 0, fontSize: '0.68rem', opacity: 0.8 }}>Panel clínico</p>
        </div>
      </div>
    );
  }
  if (mode === 'invoice') {
    return (
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
        <p style={{ margin: '0 0 0.35rem', fontWeight: 800 }}>{form.legalName || form.clinicName}</p>
        <p style={{ margin: 0 }}>NIF: {form.nif || '—'}</p>
        <p style={{ margin: '0.5rem 0' }}>Factura {form.invoiceSeries ?? 'FAC'}-2026-0001</p>
        <p style={{ margin: 0 }}>IVA {form.vatRate ?? 21}% · {form.defaultInvoiceConcept ?? 'Servicios'}</p>
        <span
          style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            borderRadius: 6,
            background: 'var(--set-primary)',
            color: '#fff',
            fontWeight: 800
          }}
        >
          Total 121,00 €
        </span>
      </div>
    );
  }
  return (
    <div className="set-preview-portal">
      <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>{form.clinicName}</p>
      <p style={{ margin: '0.35rem 0', fontSize: '0.75rem', color: '#64748b' }}>{form.welcomeMessage}</p>
      <span className="set-preview-btn">Entrar al portal</span>
      <div className="set-preview-appt">
        <strong style={{ color: 'var(--set-primary)' }}>Próxima cita</strong>
        <p style={{ margin: '0.2rem 0 0' }}>22 may · 10:30 · Revisión</p>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { state, commit } = useDemoStore();
  const { setNotice } = useNotice();
  const tenantId = getStoredTenantId();

  const baseline = useMemo(() => settingsToForm(settingsFor(state, tenantId)), [state, tenantId]);
  const [saved, setSaved] = useState(baseline);
  const [form, setForm] = useState<AppSettings>(baseline);
  const [tab, setTab] = useState<SettingsTabId>('general');
  const [previewTab, setPreviewTab] = useState<'sidebar' | 'invoice' | 'portal'>('sidebar');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSavedBadge, setShowSavedBadge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(form.logoUrl ?? '/brand/dentista-logo.svg');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPct, setLogoPct] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const [customColor, setCustomColor] = useState('');

  const dirty = settingsSignature(form) !== settingsSignature(saved);
  const primary = form.primaryColor ?? '#2d8b7d';

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setLogoUrl(form.logoUrl ?? '/brand/dentista-logo.svg');
  }, [form.logoUrl]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const patch = useCallback((patch: Partial<AppSettings>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  function toggleDay(iso: number) {
    const days = form.workDays ?? [1, 2, 3, 4, 5];
    const next = days.includes(iso) ? days.filter((d) => d !== iso) : [...days, iso].sort((a, b) => a - b);
    patch({ workDays: next });
  }

  async function uploadLogo(file: File) {
    const okType =
      file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);
    if (!okType) {
      setNotice({ type: 'error', message: 'El archivo debe ser PNG, JPG, SVG o WebP.' });
      return;
    }
    if (file.size > LOGO_MAX) {
      setNotice({ type: 'error', message: 'El archivo supera el tamaño máximo permitido.' });
      return;
    }
    setLogoUploading(true);
    setLogoPct(0);
    const tick = window.setInterval(() => setLogoPct((p) => Math.min(95, p + 12)), 80);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/clinic/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ logoDataUrl: dataUrl })
      });
      const json = (await res.json()) as { data?: { logoUrl?: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo subir.');
      const url = json.data?.logoUrl ?? dataUrl;
      setLogoPct(100);
      setLogoUrl(url);
      patch({ logoUrl: url });
      setNotice({ type: 'ok', message: 'Logo actualizado.' });
    } catch (e) {
      setNotice({
        type: 'error',
        message: e instanceof Error ? e.message : 'No se pudieron guardar los cambios.'
      });
    } finally {
      window.clearInterval(tick);
      setLogoUploading(false);
    }
  }

  async function clearLogo() {
    if (!window.confirm('¿Eliminar el logo de la clínica?')) return;
    setLogoUploading(true);
    try {
      await fetch('/api/clinic/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clear: true })
      });
      const fallback = '/brand/dentista-logo.svg';
      setLogoUrl(fallback);
      patch({ logoUrl: fallback });
      setNotice({ type: 'ok', message: 'Logo eliminado.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudieron guardar los cambios.' });
    } finally {
      setLogoUploading(false);
    }
  }

  function discard() {
    if (dirty && !window.confirm('¿Descartar los cambios sin guardar?')) return;
    const base = settingsToForm(saved);
    setForm(base);
    setLogoUrl(base.logoUrl ?? '/brand/dentista-logo.svg');
    setErrors({});
    setNotice({ type: 'ok', message: 'Cambios descartados.' });
  }

  function save() {
    const errs = validateSettings(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setNotice({ type: 'error', message: Object.values(errs)[0] });
      return;
    }
    try {
      const hours = `Lun–Vie ${form.openTime ?? '08:30'}–${form.closeTime ?? '20:00'}`;
      const next: AppSettings = { ...form, generalHours: hours, logoUrl };
      commit(saveSettings(state, tenantId, next));
      setSaved(next);
      setForm(next);
      setShowSavedBadge(true);
      window.setTimeout(() => setShowSavedBadge(false), 4000);
      setNotice({ type: 'ok', message: 'Configuración guardada.' });
    } catch {
      setNotice({ type: 'error', message: 'No se pudieron guardar los cambios.' });
    }
  }

  function field(
    key: keyof AppSettings,
    label: string,
    node: ReactNode,
    required?: boolean
  ) {
    return (
      <div className={`set-field${errors[key] ? ' set-field--error' : ''}`}>
        <label>
          {label}
          {required ? ' *' : ''}
        </label>
        {node}
        {errors[key] ? <p className="set-field__err">{errors[key]}</p> : null}
      </div>
    );
  }

  const summaryRows: { k: string; v: string }[] = [
    { k: 'Nombre clínica', v: form.clinicName },
    { k: 'Email', v: form.email || '—' },
    { k: 'Teléfono', v: form.phone || '—' },
    { k: 'Intervalo citas', v: `${form.slotIntervalMinutes} minutos` },
    { k: 'IVA por defecto', v: `${form.vatRate ?? 21}%` },
    { k: 'Serie factura', v: form.invoiceSeries ?? 'FAC' },
    { k: 'Token portal', v: maskPortalToken() }
  ];

  function renderMarcaCard() {
    return (
      <section className="set-card">
        <h2>Marca de la clínica</h2>
        <p className="set-card__sub">Personaliza cómo se muestra tu clínica en el portal, sidebar y facturas.</p>
        <div className="set-logo-row">
            <div className="set-logo-preview">
              <img src={logoUrl} alt="Logo" />
            </div>
            <div>
              <input
                type="file"
                accept={LOGO_ACCEPT}
                className="sr-only"
                id="set-logo-file"
                disabled={logoUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadLogo(f);
                  e.target.value = '';
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label htmlFor="set-logo-file" className="set-btn-secondary" style={{ cursor: 'pointer' }}>
                  Cambiar logo
                </label>
                <button type="button" className="set-btn-secondary" style={{ color: '#dc2626' }} onClick={() => void clearLogo()}>
                  Eliminar logo
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                PNG, JPG, SVG o WebP · Máx. 400 KB · Fondo transparente recomendado.
              </p>
              {logoUploading ? (
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--set-primary)' }}>
                  Subiendo… {logoPct}%
                </p>
              ) : null}
            </div>
          </div>
          <div className="set-field" style={{ marginTop: '0.75rem' }}>
            <label>Color principal</label>
            <div className="set-colors">
              {BRAND_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`set-swatch${form.primaryColor === p.color ? ' set-swatch--on' : ''}`}
                  style={{ background: p.color }}
                  title={p.label}
                  onClick={() => patch({ primaryColor: p.color, accentColor: p.color })}
                />
              ))}
              <label className="set-swatch set-swatch--custom" title="Personalizado">
                +
                <input
                  type="color"
                  className="sr-only"
                  value={customColor || primary}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    patch({ primaryColor: e.target.value, accentColor: e.target.value });
                  }}
                />
              </label>
            </div>
          </div>
      </section>
    );
  }

  function renderTabContent() {
    if (tab === 'marca') {
      return renderMarcaCard();
    }

    if (tab === 'facturacion') {
      return (
        <section className="set-card">
          <h2>Facturación</h2>
          <p className="set-card__sub">Datos fiscales y series de factura.</p>
          <div className="set-form-grid">
            {field('legalName', 'Razón social', (
              <input value={form.legalName} onChange={(e) => patch({ legalName: e.target.value })} />
            ))}
            {field('nif', 'NIF / CIF', <input value={form.nif ?? ''} onChange={(e) => patch({ nif: e.target.value })} />)}
            {field(
              'vatRate',
              'IVA por defecto (%)',
              <input
                type="number"
                min={0}
                max={100}
                value={form.vatRate ?? 21}
                onChange={(e) => patch({ vatRate: Number(e.target.value) })}
              />
            )}
            {field(
              'invoiceSeries',
              'Serie factura',
              <input
                value={form.invoiceSeries ?? 'FAC'}
                onChange={(e) => patch({ invoiceSeries: e.target.value })}
              />
            )}
          </div>
          {field(
            'defaultInvoiceConcept',
            'Concepto factura por defecto',
            <input
              value={form.defaultInvoiceConcept ?? ''}
              onChange={(e) => patch({ defaultInvoiceConcept: e.target.value })}
            />
          )}
        </section>
      );
    }

    if (tab === 'portal') {
      return (
        <section className="set-card">
          <h2>Portal del paciente</h2>
          <p className="set-card__sub">Mensajes visibles en el portal y confirmaciones.</p>
          {field(
            'welcomeMessage',
            'Mensaje de bienvenida (portal del paciente)',
            <>
              <textarea
                rows={3}
                maxLength={MSG_LIMIT}
                value={form.welcomeMessage}
                onChange={(e) => patch({ welcomeMessage: e.target.value })}
              />
              <CharCount value={form.welcomeMessage} />
            </>
          )}
          {field(
            'appointmentConfirmMessage',
            'Mensaje de confirmación de cita',
            <>
              <textarea
                rows={3}
                maxLength={MSG_LIMIT}
                value={form.appointmentConfirmMessage}
                onChange={(e) => patch({ appointmentConfirmMessage: e.target.value })}
              />
              <CharCount value={form.appointmentConfirmMessage} />
            </>
          )}
        </section>
      );
    }

    if (tab === 'notificaciones') {
      const prefs = form.notificationPrefs ?? defaultNotificationPrefs();
      const setPrefs = (next: NotificationPrefs) => patch({ notificationPrefs: next });
      const cats: ClinicNotificationCategory[] = [
        'citas',
        'pacientes',
        'documentos',
        'informes',
        'facturas',
        'pagos',
        'portal',
        'sistema'
      ];
      return (
        <section className="set-card">
          <h2>Preferencias de notificaciones</h2>
          <p className="set-card__sub">
            Activa o desactiva avisos por categoría. El centro de notificaciones está en{' '}
            <a href="/admin/notificaciones" className="set-link">
              Notificaciones
            </a>
            .
          </p>
          <label className="flex items-center gap-2 text-sm font-bold" style={{ marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={form.remindersEnabled}
              onChange={(e) => patch({ remindersEnabled: e.target.checked })}
            />
            Recordatorios de citas activos
          </label>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Categorías</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.75rem' }}>
            {cats.map((cat) => (
              <label key={cat} className="text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={prefs.categories[cat] !== false}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      categories: { ...prefs.categories, [cat]: e.target.checked }
                    })
                  }
                />{' '}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>
          <h3 style={{ fontSize: '0.82rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Canales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {(['panel', 'email', 'whatsapp', 'portal'] as const).map((ch) => (
              <label key={ch} className="text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={prefs.channels[ch]}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      channels: { ...prefs.channels, [ch]: e.target.checked }
                    })
                  }
                />{' '}
                {ch === 'panel' ? 'Panel admin' : ch}
              </label>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {(
              [
                ['alertNewAppointment', 'Avisar cuando un paciente solicite una cita'],
                ['alertInvoiceDue', 'Avisar cuando una factura venza'],
                ['alertPaymentFailed', 'Avisar cuando un pago falle'],
                ['alertDocumentDownload', 'Avisar cuando un paciente descargue documentos'],
                ['alertUploadError', 'Avisar errores de subida o PDF'],
                ['alertInvalidToken', 'Avisar token inválido en portal'],
                ['dailyDigest', 'Enviar resumen diario al equipo'],
                ['urgentImmediate', 'Alertas urgentes inmediatas']
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                />{' '}
                {label}
              </label>
            ))}
          </div>
        </section>
      );
    }

    if (tab === 'seguridad') {
      return (
        <>
          <section className="set-card">
            <h2>Seguridad</h2>
            <p className="set-card__sub">Acceso y credenciales del personal.</p>
            <p className="text-sm font-semibold text-slate-600">
              <a href="/login/cambiar-password?optional=1" className="font-bold text-[var(--set-primary)]">
                Cambiar mi contraseña
              </a>
            </p>
            <button
              type="button"
              className="set-btn-secondary"
              onClick={() => {
                window.location.href = '/admin/acceso-portal';
              }}
            >
              Gestionar token del portal
            </button>
          </section>
          <AdminStaffPortalProfile />
        </>
      );
    }

    if (tab === 'integraciones') {
      return (
        <section className="set-card">
          <h2>Integraciones</h2>
          <p className="set-card__sub">Canales conectados para recordatorios y mensajes.</p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
            <li>Email — {form.remindersEnabled ? 'Activo' : 'Inactivo'}</li>
            <li>WhatsApp — Modo demo / mock</li>
            <li>SMS — Modo demo / mock</li>
          </ul>
        </section>
      );
    }

    if (tab === 'backup') {
      return (
        <section className="set-card">
          <h2>Copia de seguridad</h2>
          <p className="set-card__sub">Exporta la configuración actual de la clínica.</p>
          <button
            type="button"
            className="set-btn-secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `ajustes-${tenantId}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              setNotice({ type: 'ok', message: 'Copia exportada.' });
            }}
          >
            Descargar JSON de configuración
          </button>
        </section>
      );
    }

    if (tab === 'avanzado') {
      return (
        <section className="set-card">
          <h2>Avanzado</h2>
          <p className="set-card__sub">Parámetros operativos adicionales.</p>
          <div className="set-form-grid">
            {field(
              'defaultDuration',
              'Duración cita por defecto (min)',
              <input
                type="number"
                min={15}
                value={form.defaultDuration}
                onChange={(e) => patch({ defaultDuration: Number(e.target.value) })}
              />
            )}
            {field(
              'minCancelHours',
              'Horas mínimas para cancelar',
              <input
                type="number"
                min={0}
                value={form.minCancelHours}
                onChange={(e) => patch({ minCancelHours: Number(e.target.value) })}
              />
            )}
          </div>
          {field('tagline', 'Eslogan', <input value={form.tagline} onChange={(e) => patch({ tagline: e.target.value })} />)}
          {field('city', 'Ciudad', <input value={form.city} onChange={(e) => patch({ city: e.target.value })} />)}
        </section>
      );
    }

    return (
      <>
        <section className="set-card">
          <h2>Datos de la clínica</h2>
          <p className="set-card__sub">Información básica de contacto y configuración general.</p>
          <div className="set-form-grid">
            {field(
              'clinicName',
              'Nombre de la clínica',
              <input value={form.clinicName} onChange={(e) => patch({ clinicName: e.target.value })} />,
              true
            )}
            {field(
              'phone',
              'Teléfono',
              <input value={form.phone} onChange={(e) => patch({ phone: e.target.value })} />,
              true
            )}
            {field('email', 'Email', <input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} />)}
            {field('whatsapp', 'WhatsApp', <input value={form.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} />)}
          </div>
          {field(
            'address',
            'Dirección',
            <input value={form.address} onChange={(e) => patch({ address: e.target.value })} />
          )}
          {field(
            'slotIntervalMinutes',
            'Intervalo estándar de citas',
            <select
              value={form.slotIntervalMinutes}
              onChange={(e) => patch({ slotIntervalMinutes: Number(e.target.value) })}
            >
              {INTERVAL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </select>,
            true
          )}
          {field(
            'welcomeMessage',
            'Mensaje de bienvenida (portal del paciente)',
            <>
              <textarea
                rows={3}
                maxLength={MSG_LIMIT}
                value={form.welcomeMessage}
                onChange={(e) => patch({ welcomeMessage: e.target.value })}
              />
              <CharCount value={form.welcomeMessage} />
            </>
          )}
          {field(
            'appointmentConfirmMessage',
            'Mensaje de confirmación de cita',
            <>
              <textarea
                rows={3}
                maxLength={MSG_LIMIT}
                value={form.appointmentConfirmMessage}
                onChange={(e) => patch({ appointmentConfirmMessage: e.target.value })}
              />
              <CharCount value={form.appointmentConfirmMessage} />
            </>
          )}
        </section>

        <section className="set-card">
          <h2>Agenda</h2>
          <p className="set-card__sub">Horarios y días de atención.</p>
          <div className="set-form-grid">
            {field(
              'openTime',
              'Hora de apertura',
              <input type="time" value={form.openTime ?? '08:30'} onChange={(e) => patch({ openTime: e.target.value })} />
            )}
            {field(
              'closeTime',
              'Hora de cierre',
              <input type="time" value={form.closeTime ?? '20:00'} onChange={(e) => patch({ closeTime: e.target.value })} />
            )}
          </div>
          <div className="set-field">
            <label>Días laborables</label>
            <div className="set-days">
              {WEEKDAYS.map((d) => {
                const on = (form.workDays ?? []).includes(d.iso);
                return (
                  <button
                    key={d.iso}
                    type="button"
                    className={`set-day${on ? ' set-day--on' : ''}`}
                    onClick={() => toggleDay(d.iso)}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="set-card">
          <h2>Contacto adicional</h2>
          <div className="set-field">
            <label>Web</label>
            <div className="set-social">
              <Globe className="h-4 w-4" />
              <input value={form.website ?? ''} onChange={(e) => patch({ website: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          <div className="set-field">
            <label>Instagram</label>
            <div className="set-social">
              <Instagram className="h-4 w-4" />
              <input value={form.instagram ?? ''} onChange={(e) => patch({ instagram: e.target.value })} />
            </div>
          </div>
          <div className="set-field">
            <label>Facebook</label>
            <div className="set-social">
              <Facebook className="h-4 w-4" />
              <input value={form.facebook ?? ''} onChange={(e) => patch({ facebook: e.target.value })} />
            </div>
          </div>
        </section>

        {renderMarcaCard()}
      </>
    );
  }

  return (
    <div className="set-module" style={{ ['--set-primary' as string]: primary }}>
      <header className="set-module__head">
        <div>
          <h1>Ajustes</h1>
          <p>Configura la identidad, facturación, portal del paciente y preferencias de tu clínica.</p>
        </div>
        <div className="set-module__actions">
          {showSavedBadge ? (
            <span className="set-badge-ok">
              <Check className="h-4 w-4" aria-hidden />
              Cambios guardados
            </span>
          ) : null}
          {dirty ? (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c2410c' }}>Cambios sin guardar</span>
          ) : null}
          <button type="button" className="set-btn-secondary" onClick={discard} disabled={!dirty}>
            Descartar cambios
          </button>
          <button type="button" className="set-btn-primary" onClick={save}>
            <Save className="h-4 w-4" aria-hidden />
            Guardar cambios
          </button>
        </div>
      </header>

      <nav className="set-tabs" aria-label="Secciones de ajustes">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'button--active' : ''}
            onClick={() => {
              if (dirty && !window.confirm('Tienes cambios sin guardar. ¿Cambiar de sección?')) return;
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="set-skeleton" />
      ) : (
        <div className="set-grid">
          <div>{renderTabContent()}</div>

          <aside className="set-side">
            <section className="set-card">
              <h2>Vista previa</h2>
              <p className="set-card__sub">Así se verá tu marca en diferentes lugares.</p>
              <div className="set-preview-tabs">
                {(['sidebar', 'invoice', 'portal'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={previewTab === p ? 'button--active' : ''}
                    onClick={() => setPreviewTab(p)}
                  >
                    {p === 'sidebar' ? 'Sidebar' : p === 'invoice' ? 'Factura PDF' : 'Portal paciente'}
                  </button>
                ))}
              </div>
              <div className="set-preview-box">
                <SettingsPreview mode={previewTab} form={form} logoUrl={logoUrl} />
              </div>
            </section>

            <section className="set-card">
              <h2>Resumen de configuración</h2>
              {summaryRows.map((r) => (
                <div key={r.k} className="set-summary-row">
                  <span>{r.k}</span>
                  <strong>{r.v}</strong>
                </div>
              ))}
              <button type="button" className="set-link" onClick={() => setAllOpen(true)}>
                Ver todas las configuraciones →
              </button>
            </section>
          </aside>
        </div>
      )}

      <section>
        <h2 style={{ margin: '0 0 0.65rem', fontSize: '0.95rem', fontWeight: 800 }}>Atajos rápidos</h2>
        <div className="set-quick-grid">
          <button type="button" className="set-quick" onClick={() => { window.location.href = '/login/cambiar-password?optional=1'; }}>
            <Lock className="h-5 w-5 text-teal-600" />
            <h3>Cambiar contraseña</h3>
            <p>Actualiza tu contraseña de acceso.</p>
          </button>
          <button type="button" className="set-quick" onClick={() => { window.location.href = '/admin/acceso-portal'; }}>
            <Key className="h-5 w-5 text-teal-600" />
            <h3>Gestionar token</h3>
            <p>Configura el acceso al portal del paciente.</p>
          </button>
          <button
            type="button"
            className="set-quick"
            onClick={() => {
              setPreviewTab('invoice');
              setTab('marca');
            }}
          >
            <Receipt className="h-5 w-5 text-teal-600" />
            <h3>Vista previa factura</h3>
            <p>Previsualiza cómo se verán tus facturas.</p>
          </button>
          <button
            type="button"
            className="set-quick"
            onClick={() => {
              window.location.href = '/admin/notificaciones';
            }}
          >
            <Bell className="h-5 w-5 text-teal-600" />
            <h3>Configurar recordatorios</h3>
            <p>Ajusta los recordatorios de citas.</p>
          </button>
        </div>
      </section>

      <div className="set-tip">
        <Info className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
        <p>
          <strong>Consejo:</strong> No olvides guardar tus cambios para que se apliquen en toda la plataforma.
        </p>
      </div>

      <div className="set-mobile-bar">
        <button type="button" className="set-btn-secondary" onClick={discard}>
          Descartar
        </button>
        <button type="button" className="set-btn-primary" onClick={save}>
          Guardar cambios
        </button>
      </div>

      {allOpen ? (
        <Modal open title="Todas las configuraciones" onClose={() => setAllOpen(false)}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {summaryRows.map((r) => (
              <li key={r.k} className="set-summary-row" style={{ display: 'flex' }}>
                <span>{r.k}</span>
                <strong>{r.v}</strong>
              </li>
            ))}
            <li className="set-summary-row">
              <span>Dirección</span>
              <strong>{form.address || '—'}</strong>
            </li>
            <li className="set-summary-row">
              <span>Horario</span>
              <strong>
                {form.openTime} – {form.closeTime}
              </strong>
            </li>
            <li className="set-summary-row">
              <span>Recordatorios</span>
              <strong>{form.remindersEnabled ? 'Activos' : 'Inactivos'}</strong>
            </li>
          </ul>
        </Modal>
      ) : null}
    </div>
  );
}
