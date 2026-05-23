import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  Link2,
  Plus,
  Save,
  Trash2,
  Upload,
  UserPlus
} from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { isCollegiateNumberValid } from '@/lib/clinical/dentistCollegiate';
import {
  computeProfessionalKpis,
  dentistToForm,
  filterProfessionals,
  formToDentistPatch,
  profileChecklist,
  profileCompletionPercent,
  profileReadyForReports,
  professionalBadges,
  validateProfessionalForm,
  type ProfessionalFilter,
  type ProfessionalProfileForm
} from '@/lib/clinical/professionalProfile';
import { readScopedDentistId } from '@/lib/dentistScope';
import { createDentist, saveDentist } from '@/lib/demoStore';
import { resolveDemoFileUrl, saveDemoFile } from '@/lib/demoFiles';
import { getStaffProfile, organizationDisplayName } from '@/lib/organization';
import { isClinicProfileManager } from '@/lib/services/clinicalProfessionals';
import { settingsFor } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { useTenant } from '@/hooks/useTenant';
import type { Dentist } from '@/types/demo';
import { LinkUserModal } from './LinkUserModal';
import { SignatureDrawModal } from './SignatureDrawModal';
import '@/styles/admin-clinical-profiles.css';

const FILTERS: { id: ProfessionalFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'complete', label: 'Completos' },
  { id: 'incomplete', label: 'Incompletos' },
  { id: 'no-user', label: 'Sin usuario' },
  { id: 'with-collegiate', label: 'Con colegiado' }
];

function initials(name: string) {
  return name
    .replace(/^(dr\.?|dra\.?)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function emptyDentist(tenantId: string, clinicId: string): Dentist {
  return {
    id: '',
    clinicId,
    tenantId,
    fullName: '',
    specialty: '',
    email: '',
    phone: '',
    schedule: 'Lun–Vie 09:00–17:00',
    agendaColor: '#14b8a6',
    active: true
  };
}

export function AdminClinicalProfilesPanel() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const scope = useTenant();
  const { staff, loading: staffLoading } = useStaffContext();
  const [sessionRole, setSessionRole] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProfessionalFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<ProfessionalProfileForm | null>(null);
  const [base, setBase] = useState<Dentist | null>(null);
  const [saving, setSaving] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkedUsers, setLinkedUsers] = useState<Record<string, { full_name: string; email: string; role: string }>>({});

  const role = staff?.role ?? sessionRole;
  const isManager = isClinicProfileManager(role ?? '') || role === 'admin' || !getStaffProfile() || getStaffProfile()?.role === 'admin';
  const ownDentistId = staff?.dentistId ?? readScopedDentistId();
  const clinicId = scope.clinics.find((c) => c.active)?.id ?? scope.clinics[0]?.id ?? '';
  const clinicName = organizationDisplayName(state, scope.tenantId);
  const logoUrl = settingsFor(state, scope.tenantId).logoUrl ?? '/brand/clinic-shield.svg';

  const team = useMemo(() => [...scope.dentists].sort((a, b) => a.fullName.localeCompare(b.fullName)), [scope.dentists]);
  const filtered = useMemo(() => filterProfessionals(team, search, filter), [team, search, filter]);
  const kpis = useMemo(() => computeProfessionalKpis(team), [team]);

  const selected = useMemo(() => {
    if (isNew && base) return base;
    return team.find((d) => d.id === selectedId) ?? null;
  }, [team, selectedId, isNew, base]);

  const canEdit = Boolean(selected && (isManager || ownDentistId === selected.id));
  const previewDentist = useMemo(() => {
    if (!selected || !form) return selected;
    return formToDentistPatch(form, selected);
  }, [selected, form]);

  const linkedProfileIds = useMemo(() => new Set(team.filter((d) => d.profileId).map((d) => d.profileId!)), [team]);

  const loadForm = useCallback((d: Dentist) => {
    setBase(d);
    setForm(dentistToForm(d));
  }, []);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { staffRole?: string; role?: string } }) => setSessionRole(j.data?.staffRole ?? j.data?.role))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetch('/api/clinic/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { users?: { id: string; full_name: string; email: string; role: string }[] } }) => {
        const map: Record<string, { full_name: string; email: string; role: string }> = {};
        for (const u of j.data?.users ?? []) map[u.id] = u;
        setLinkedUsers(map);
      })
      .catch(() => undefined);
  }, [selected?.profileId]);

  useEffect(() => {
    if (selectedId && team.some((d) => d.id === selectedId)) return;
    if (ownDentistId && team.some((d) => d.id === ownDentistId)) {
      setSelectedId(ownDentistId);
      setIsNew(false);
      return;
    }
    if (filtered[0]) {
      setSelectedId(filtered[0].id);
      setIsNew(false);
    }
  }, [selectedId, ownDentistId, team, filtered]);

  useEffect(() => {
    if (selected && !isNew) loadForm(selected);
  }, [selected?.id, isNew, loadForm]);

  const dirty = useMemo(() => {
    if (!selected || !form) return false;
    return JSON.stringify(form) !== JSON.stringify(dentistToForm(selected));
  }, [form, selected]);

  function startNew() {
    if (!isManager) return;
    const d = emptyDentist(scope.tenantId, clinicId);
    setIsNew(true);
    setSelectedId(null);
    setBase(d);
    setForm(dentistToForm(d));
  }

  function selectProfessional(d: Dentist) {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartar?')) return;
    setIsNew(false);
    setSelectedId(d.id);
    loadForm(d);
  }

  function discard() {
    if (!selected) return;
    loadForm(selected);
    setIsNew(false);
    if (isNew && team[0]) {
      setSelectedId(team[0].id);
      loadForm(team[0]);
    }
  }

  async function persist(dentist: Dentist) {
    if (!clinicId) throw new Error('No se encontró la clínica activa.');
    if (!isClientDemoMode()) {
      const res = await fetch('/api/clinic/clinical-professionals', {
        method: isNew ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          dentistId: isNew ? undefined : dentist.id,
          fullName: dentist.fullName,
          visibleTitle: dentist.visibleTitle,
          collegiateNumber: dentist.collegiateNumber,
          professionalCollege: dentist.professionalCollege,
          specialty: dentist.specialty,
          secondarySpecialties: dentist.secondarySpecialties,
          languages: dentist.languages,
          email: dentist.email,
          phone: dentist.phone,
          reportBio: dentist.reportBio,
          agendaColor: dentist.agendaColor,
          active: dentist.active,
          photoRef: dentist.photoRef,
          signatureRef: dentist.signatureRef,
          photoName: dentist.photoName,
          signatureName: dentist.signatureName,
          profileId: dentist.profileId
        })
      });
      const json = (await res.json()) as { data?: Dentist; error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo guardar el perfil.');
      await refresh();
      return json.data as Dentist;
    }

    if (dentist.collegiateNumber?.trim()) {
      const dup = state.dentists.find(
        (x) =>
          x.id !== dentist.id &&
          x.tenantId === dentist.tenantId &&
          x.collegiateNumber?.trim() === dentist.collegiateNumber?.trim()
      );
      if (dup) throw new Error('Ya existe un profesional con este nº de colegiado en la clínica.');
    }

    if (isNew) {
      const next = createDentist(state, { ...dentist, clinicId });
      const created = next.dentists[next.dentists.length - 1];
      commit(next);
      return created;
    }
    commit(saveDentist(state, { ...dentist, clinicId, profileCompletion: profileCompletionPercent(dentist) }));
    return dentist;
  }

  async function saveProfile() {
    if (!selected || !form || !canEdit) return;
    const err = validateProfessionalForm(form);
    if (err) {
      setNotice({ type: 'error', message: err });
      return;
    }
    const next = formToDentistPatch(form, selected);
    setSaving(true);
    try {
      const saved = await persist(next);
      setNotice({ type: 'ok', message: 'Perfil guardado correctamente.' });
      setIsNew(false);
      setSelectedId(saved.id);
      loadForm(saved);
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo guardar el perfil.' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(kind: 'photo' | 'signature', file: File) {
    if (!selected || !form || !canEdit) return;
    if (file.size > 2_000_000) {
      setNotice({ type: 'error', message: 'El archivo supera 2 MB.' });
      return;
    }
    if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i.test(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
      setNotice({ type: 'error', message: 'Formato no válido. Usa PNG, JPG o WebP.' });
      return;
    }
    try {
      const ref = await saveDemoFile(file);
      const patched = {
        ...selected,
        photoRef: kind === 'photo' ? ref : selected.photoRef,
        photoName: kind === 'photo' ? file.name : selected.photoName,
        signatureRef: kind === 'signature' ? ref : selected.signatureRef,
        signatureName: kind === 'signature' ? file.name : selected.signatureName,
        updatedAt: new Date().toISOString()
      };
      commit(saveDentist(state, patched));
      loadForm(patched);
      setNotice({ type: 'ok', message: kind === 'photo' ? 'Foto actualizada.' : 'Firma guardada correctamente.' });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo subir la firma.' });
    }
  }

  function removeSignature() {
    if (!selected || !canEdit) return;
    const next = { ...selected, signatureRef: undefined, signatureName: undefined };
    commit(saveDentist(state, next));
    loadForm(next);
  }

  async function linkUser(profileId: string) {
    if (!selected || !clinicId) return;
    if (!isClientDemoMode()) {
      const res = await fetch('/api/clinic/clinical-professionals', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'link', clinicId, dentistId: selected.id, profileId })
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo vincular.');
      await refresh();
    } else {
      commit(saveDentist(state, { ...selected, profileId }));
    }
    setNotice({ type: 'ok', message: 'Usuario vinculado.' });
    setLinkOpen(false);
  }

  async function unlinkUser() {
    if (!selected || !clinicId) return;
    if (!window.confirm('¿Desvincular usuario de este perfil?')) return;
    if (!isClientDemoMode()) {
      const res = await fetch('/api/clinic/clinical-professionals', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'unlink', clinicId, dentistId: selected.id })
      });
      if (!res.ok) throw new Error('No se pudo desvincular.');
      await refresh();
    } else {
      commit(saveDentist(state, { ...selected, profileId: undefined }));
    }
    setNotice({ type: 'ok', message: 'Usuario desvinculado.' });
  }

  if (staffLoading && !isClientDemoMode()) {
    return <p className="portal-panel-loading">Cargando perfiles clínicos…</p>;
  }

  const checklist = previewDentist ? profileChecklist(previewDentist) : [];
  const completion = previewDentist ? profileCompletionPercent(previewDentist) : 0;
  const photoUrl = selected?.photoRef ? resolveDemoFileUrl(selected.photoRef) : null;
  const sigUrl = selected?.signatureRef ? resolveDemoFileUrl(selected.signatureRef) : null;

  return (
    <div className="cp-page">
      <section className="cp-intro">
        <p className="cp-intro__title">Datos profesionales para informes clínicos</p>
        <p className="cp-intro__text">
          El nombre, nº de colegiado, especialidad y firma profesional se usarán automáticamente en los informes clínicos
          y PDFs generados para pacientes.
        </p>
      </section>

      <div className="cp-kpis">
        <article className="cp-kpi">
          <p className="cp-kpi__label">Profesionales</p>
          <p className="cp-kpi__value">{kpis.total}</p>
        </article>
        <article className="cp-kpi">
          <p className="cp-kpi__label">Perfiles completos</p>
          <p className="cp-kpi__value">{kpis.complete}</p>
        </article>
        <article className="cp-kpi cp-kpi--warn">
          <p className="cp-kpi__label">Falta nº colegiado</p>
          <p className="cp-kpi__value">{kpis.missingCollegiate}</p>
        </article>
        <article className="cp-kpi">
          <p className="cp-kpi__label">Sin usuario vinculado</p>
          <p className="cp-kpi__value">{kpis.withoutUser}</p>
        </article>
        <article className="cp-kpi">
          <p className="cp-kpi__label">Con firma</p>
          <p className="cp-kpi__value">{kpis.withSignature}</p>
        </article>
      </div>

      <div className="cp-main">
        <aside className="cp-panel">
          <p className="cp-panel__head">Equipo clínico</p>
          <input
            className="cp-search"
            placeholder="Buscar por nombre, especialidad o nº colegiado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="cp-filters">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`cp-filter${filter === f.id ? ' cp-filter--active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="cp-team-list">
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`cp-team-card${d.id === selectedId && !isNew ? ' cp-team-card--active' : ''}`}
                onClick={() => selectProfessional(d)}
              >
                <span className="cp-avatar">
                  {d.photoRef && resolveDemoFileUrl(d.photoRef) ? (
                    <img src={resolveDemoFileUrl(d.photoRef)!} alt="" />
                  ) : (
                    initials(d.fullName)
                  )}
                </span>
                <span>
                  <span className="cp-team-card__name">{d.fullName}</span>
                  <span className="cp-team-card__spec">{d.specialty}</span>
                  <span className="cp-badges">
                    {professionalBadges(d).map((b) => (
                      <span key={b.id} className={`cp-badge cp-badge--${b.tone}`}>
                        {b.label}
                      </span>
                    ))}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
              </button>
            ))}
          </div>
          {isManager ? (
            <button type="button" className="cp-new-btn" onClick={startNew}>
              <Plus className="inline h-4 w-4" aria-hidden /> Nuevo profesional
            </button>
          ) : null}
        </aside>

        <section className="cp-panel">
          {selected && form ? (
            <>
              <div className="cp-form-head">
                <h2>Ficha profesional</h2>
              </div>
              <div className="cp-form-grid">
                <div className="cp-field cp-field--wide">
                  <label>Foto profesional</label>
                  <div className="cp-photo-row">
                    <div className="cp-photo-preview">
                      {photoUrl ? <img src={photoUrl} alt="" /> : <span>{initials(form.fullName || '?')}</span>}
                    </div>
                    {canEdit ? (
                      <label className="cp-btn cp-btn--outline">
                        <Upload className="h-4 w-4" aria-hidden /> Subir imagen
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadImage('photo', f);
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
                <div className="cp-field">
                  <label>Nombre completo *</label>
                  <input
                    value={form.fullName}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Cargo visible</label>
                  <input
                    value={form.visibleTitle}
                    disabled={!canEdit}
                    placeholder="Odontólogo"
                    onChange={(e) => setForm({ ...form, visibleTitle: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Nº colegiado *</label>
                  <input
                    value={form.collegiateNumber}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, collegiateNumber: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Colegio profesional</label>
                  <input
                    value={form.professionalCollege}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, professionalCollege: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Especialidad principal *</label>
                  <input
                    value={form.specialty}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Especialidades secundarias</label>
                  <input
                    value={form.secondarySpecialties}
                    disabled={!canEdit}
                    placeholder="Separadas por comas"
                    onChange={(e) => setForm({ ...form, secondarySpecialties: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Email profesional *</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Teléfono *</label>
                  <input
                    value={form.phone}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Idiomas</label>
                  <input
                    value={form.languages}
                    disabled={!canEdit}
                    placeholder="Español, Inglés"
                    onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Color en agenda</label>
                  <input
                    type="color"
                    value={form.agendaColor}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, agendaColor: e.target.value })}
                  />
                </div>
                <div className="cp-field">
                  <label>Estado</label>
                  <select
                    value={form.active ? 'active' : 'inactive'}
                    disabled={!canEdit || !isManager}
                    onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                <div className="cp-field cp-field--wide">
                  <label>Texto profesional para informes</label>
                  <textarea
                    rows={3}
                    value={form.reportBio}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, reportBio: e.target.value })}
                  />
                </div>
              </div>

              <div className="cp-signature-block">
                <h3>Firma profesional</h3>
                {canEdit ? (
                  <div className="cp-signature-actions">
                    <label className="cp-btn cp-btn--outline">
                      <Upload className="h-4 w-4" aria-hidden /> Subir imagen
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage('signature', f);
                        }}
                      />
                    </label>
                    <button type="button" className="cp-btn cp-btn--outline" onClick={() => setSigOpen(true)}>
                      Dibujar firma
                    </button>
                    {selected.signatureRef ? (
                      <button type="button" className="cp-btn cp-btn--danger" onClick={removeSignature}>
                        <Trash2 className="h-4 w-4" aria-hidden /> Eliminar
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="cp-signature-preview">
                  {sigUrl ? (
                    <img src={sigUrl} alt="Firma" />
                  ) : (
                    <span className="text-slate-400">Sin firma cargada</span>
                  )}
                </div>
                {selected.signatureName ? (
                  <p className="text-xs text-slate-500 mt-1">{selected.signatureName}</p>
                ) : null}
              </div>

              <div className="cp-linked">
                <h3>Usuario vinculado</h3>
                {selected.profileId && linkedUsers[selected.profileId] ? (
                  <>
                    <p>
                      <strong>{linkedUsers[selected.profileId].full_name}</strong>
                      <br />
                      {linkedUsers[selected.profileId].email} · {linkedUsers[selected.profileId].role}
                    </p>
                    {isManager ? (
                      <div className="cp-linked__actions">
                        <button type="button" className="cp-btn cp-btn--outline" onClick={() => void unlinkUser()}>
                          Desvincular usuario
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p>Sin usuario vinculado</p>
                    <p>Vincula este perfil a un usuario para permitir el acceso al panel clínico.</p>
                    {isManager ? (
                      <div className="cp-linked__actions">
                        <button type="button" className="cp-btn cp-btn--outline" onClick={() => setLinkOpen(true)}>
                          <Link2 className="h-4 w-4" aria-hidden /> Vincular usuario existente
                        </button>
                        <a href="/admin/usuarios" className="cp-btn cp-btn--outline no-underline">
                          <UserPlus className="h-4 w-4" aria-hidden /> Crear usuario
                        </a>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <footer className="cp-form-foot">
                <button type="button" className="cp-btn cp-btn--outline" disabled={!dirty} onClick={discard}>
                  Descartar cambios
                </button>
                <button
                  type="button"
                  className="cp-btn cp-btn--primary"
                  disabled={saving || !canEdit}
                  onClick={() => void saveProfile()}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {saving ? 'Guardando…' : 'Guardar perfil'}
                </button>
              </footer>
            </>
          ) : (
            <p className="p-4 text-sm text-slate-600">Selecciona un profesional del equipo.</p>
          )}
        </section>

        <aside className="cp-panel">
          <div className="cp-side-card">
            <h3>Estado del perfil</h3>
            <div className="cp-progress-ring">
              <span className="cp-progress-ring__value">{completion}%</span>
              <span className="text-sm text-slate-600">completado</span>
            </div>
            <ul className="cp-checklist">
              {checklist.map((item) => (
                <li key={item.id} data-done={item.done} data-warn={item.warn}>
                  {item.done ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="cp-side-card">
            <h3>Vista previa en informe clínico</h3>
            <div className="cp-preview-doc">
              <div className="cp-preview-doc__clinic">
                <img src={logoUrl} alt="" width={28} height={28} className="inline mr-1 align-middle" />
                {clinicName}
              </div>
              <strong>{previewDentist?.fullName || '—'}</strong>
              <br />
              {previewDentist?.visibleTitle || previewDentist?.specialty || '—'}
              <br />
              Nº colegiado:{' '}
              {isCollegiateNumberValid(previewDentist?.collegiateNumber)
                ? previewDentist?.collegiateNumber
                : 'pendiente'}
              {sigUrl ? (
                <>
                  <br />
                  <img src={sigUrl} alt="Firma" style={{ maxHeight: 48, marginTop: 6 }} />
                </>
              ) : null}
            </div>
            {previewDentist && !profileReadyForReports(previewDentist) ? (
              <p className="cp-preview-warn">Este perfil no está listo para firmar informes clínicos.</p>
            ) : null}
          </div>

          <div className="cp-side-card">
            <h3>Uso del perfil</h3>
            <p className="text-xs text-slate-600 mb-2">
              Estos datos se usarán automáticamente en informes clínicos, PDFs, citas y comunicaciones visibles para
              pacientes.
            </p>
            <div className="cp-side-actions">
              <a
                href={selected ? `/admin/informes?dentist=${encodeURIComponent(selected.id)}` : '/admin/informes'}
                className="cp-btn cp-btn--outline no-underline"
              >
                <FileText className="h-4 w-4" aria-hidden /> Ver informes
              </a>
              <a
                href={selected ? `/admin/agenda?dentist=${encodeURIComponent(selected.id)}` : '/admin/agenda'}
                className="cp-btn cp-btn--outline no-underline"
              >
                <Calendar className="h-4 w-4" aria-hidden /> Ver agenda
              </a>
              {isManager && selected ? (
                <button type="button" className="cp-btn cp-btn--outline" onClick={() => setLinkOpen(true)}>
                  <Link2 className="h-4 w-4" aria-hidden /> Vincular usuario
                </button>
              ) : null}
            </div>
            {selected?.updatedAt ? (
              <p className="cp-updated">Última actualización: {new Date(selected.updatedAt).toLocaleString('es-ES')}</p>
            ) : null}
          </div>
        </aside>
      </div>

      <SignatureDrawModal
        open={sigOpen}
        onClose={() => setSigOpen(false)}
        onSave={(dataUrl) => {
          if (!selected) return;
          const name = `firma-${selected.id}.png`;
          commit(
            saveDentist(state, {
              ...selected,
              signatureRef: dataUrl,
              signatureName: name,
              updatedAt: new Date().toISOString()
            })
          );
          loadForm({ ...selected, signatureRef: dataUrl, signatureName: name });
          setNotice({ type: 'ok', message: 'Firma guardada correctamente.' });
        }}
      />

      <LinkUserModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        linkedProfileIds={linkedProfileIds}
        onLink={linkUser}
      />
    </div>
  );
}
