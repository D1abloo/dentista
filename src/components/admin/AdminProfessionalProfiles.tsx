import { useEffect, useMemo, useState } from 'react';
import { Lock, Save, Stethoscope, UserCircle } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import { isCollegiateNumberValid } from '@/lib/clinical/dentistCollegiate';
import { readScopedDentistId } from '@/lib/dentistScope';
import { saveDentist } from '@/lib/demoStore';
import { isClinicProfileManager } from '@/lib/services/dentistProfile';
import { getStaffProfile } from '@/lib/organization';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import { useStaffContext } from '@/hooks/useStaffContext';
import { useTenant } from '@/hooks/useTenant';
import type { Dentist } from '@/types/demo';
import '@/styles/admin-professional-profiles.css';

type ProfileForm = {
  fullName: string;
  specialty: string;
  collegiateNumber: string;
  email: string;
  phone: string;
  schedule: string;
};

function toForm(d: Dentist): ProfileForm {
  return {
    fullName: d.fullName,
    specialty: d.specialty,
    collegiateNumber: d.collegiateNumber ?? '',
    email: d.email,
    phone: d.phone,
    schedule: d.schedule
  };
}

function resolveDemoManagerRole(): boolean {
  const staff = getStaffProfile();
  return !staff || staff.role === 'admin';
}

export function AdminProfessionalProfiles() {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const scope = useTenant();
  const { staff, loading: staffLoading } = useStaffContext();
  const [saving, setSaving] = useState(false);
  const [sessionRole, setSessionRole] = useState<string | undefined>();

  const role = staff?.role ?? sessionRole;
  const isManager = isClinicProfileManager(role ?? '') || role === 'admin' || resolveDemoManagerRole();
  const ownDentistId = staff?.dentistId ?? readScopedDentistId();

  const team = useMemo(
    () => [...scope.dentists].sort((a, b) => Number(b.active) - Number(a.active) || a.fullName.localeCompare(b.fullName)),
    [scope.dentists]
  );

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j: { data?: { staffRole?: string; role?: string } }) => {
        setSessionRole(j.data?.staffRole ?? j.data?.role);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selectedId && team.some((d) => d.id === selectedId)) return;
    if (ownDentistId && team.some((d) => d.id === ownDentistId)) {
      setSelectedId(ownDentistId);
      return;
    }
    if (team[0]) setSelectedId(team[0].id);
  }, [selectedId, ownDentistId, team]);

  const selected = team.find((d) => d.id === selectedId) ?? null;
  const [form, setForm] = useState<ProfileForm>(() => (selected ? toForm(selected) : emptyForm()));

  useEffect(() => {
    if (selected) setForm(toForm(selected));
  }, [selected?.id]);

  const canEditSelected = useMemo(() => {
    if (!selected) return false;
    if (isManager) return true;
    return ownDentistId === selected.id;
  }, [isManager, ownDentistId, selected]);

  const showTeamList = isManager && team.length > 1;

  async function saveProfile() {
    if (!selected || !canEditSelected) {
      setNotice({ type: 'error', message: 'No tienes permiso para editar este perfil.' });
      return;
    }
    if (!form.fullName.trim()) {
      setNotice({ type: 'error', message: 'Indica el nombre del profesional (Dr./Dra.).' });
      return;
    }
    if (!isCollegiateNumberValid(form.collegiateNumber)) {
      setNotice({
        type: 'error',
        message: 'El número de colegiado es obligatorio y debe tener al menos 3 caracteres.'
      });
      return;
    }
    if (!form.specialty.trim()) {
      setNotice({ type: 'error', message: 'Indica la especialidad.' });
      return;
    }

    const clinicId = scope.clinics.find((c) => c.tenantId === scope.tenantId && c.active)?.id ?? scope.clinics[0]?.id;
    if (!clinicId) {
      setNotice({ type: 'error', message: 'No se encontró la clínica activa.' });
      return;
    }

    const payload = {
      clinicId,
      dentistId: selected.id,
      fullName: form.fullName.trim(),
      specialty: form.specialty.trim(),
      collegiateNumber: form.collegiateNumber.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined
    };

    setSaving(true);
    try {
      if (!isClientDemoMode()) {
        const res = await fetch('/api/clinic/dentist-profile', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = (await res.json()) as { error?: { message?: string } };
        if (!res.ok) {
          setNotice({ type: 'error', message: json.error?.message ?? 'No se pudo guardar.' });
          return;
        }
        await refresh();
      } else {
        commit(
          saveDentist(state, {
            ...selected,
            fullName: payload.fullName,
            specialty: payload.specialty,
            collegiateNumber: payload.collegiateNumber,
            email: payload.email ?? '',
            phone: payload.phone ?? '',
            schedule: form.schedule.trim() || selected.schedule
          })
        );
      }
      setNotice({ type: 'ok', message: 'Perfil profesional guardado. Se usará en informes clínicos.' });
    } catch (e) {
      setNotice({
        type: 'error',
        message: e instanceof Error ? e.message : 'No se pudo guardar el perfil.'
      });
    } finally {
      setSaving(false);
    }
  }

  if (staffLoading && !isClientDemoMode()) {
    return <p className="portal-panel-loading">Cargando perfil profesional…</p>;
  }

  if (!team.length) {
    return (
      <div className="dr-module">
        <div className="dr-intro">
          <p className="dr-intro__title">Sin profesionales en la clínica</p>
          <p className="dr-intro__text">
            Da de alta usuarios con rol dentista en <strong>Usuarios clínica</strong> para vincular su perfil Dr/Dra.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dr-module">
      <section className="dr-intro">
        <p className="dr-intro__title">
          <Stethoscope className="inline h-5 w-5 text-teal-700" aria-hidden /> Perfiles Dr/Dra
        </p>
        <p className="dr-intro__text">
          Nombre, colegiado y especialidad aparecen en el membrete y pie de los informes clínicos. Cada profesional puede
          actualizar su ficha; la administración puede corregir cualquier perfil del equipo.
        </p>
      </section>

      <div className={`dr-layout${showTeamList ? '' : ' dr-layout--solo'}`}>
        {showTeamList ? (
          <aside className="dr-team">
            <p className="dr-team__head">Equipo clínico</p>
            <div className="dr-team__list" role="listbox" aria-label="Seleccionar profesional">
              {team.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  role="option"
                  aria-selected={d.id === selectedId}
                  className={`dr-team__item${d.id === selectedId ? ' dr-team__item--active' : ''}`}
                  onClick={() => setSelectedId(d.id)}
                >
                  <span className="dr-team__name">{d.fullName}</span>
                  <span className="dr-team__meta">
                    {d.specialty}
                    {d.collegiateNumber ? ` · Col. ${d.collegiateNumber}` : ' · Sin colegiado'}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        {selected ? (
          <section className="dr-form-panel">
            <header className="dr-form-panel__head">
              <div>
                <h2 className="dr-form-panel__title">
                  {ownDentistId === selected.id && !isManager ? 'Mi perfil profesional' : selected.fullName}
                </h2>
                <p className="dr-form-panel__hint">
                  {canEditSelected
                    ? 'Los cambios se reflejan en nuevos informes y PDFs.'
                    : 'Solo lectura: contacta con administración para modificar este perfil.'}
                </p>
              </div>
              <div className="dr-badges">
                {isCollegiateNumberValid(selected.collegiateNumber) ? (
                  <span className="dr-badge dr-badge--ok">Colegiado OK</span>
                ) : (
                  <span className="dr-badge dr-badge--warn">Falta nº colegiado</span>
                )}
                {selected.profileId ? (
                  <span className="dr-badge dr-badge--ok">Usuario vinculado</span>
                ) : (
                  <span className="dr-badge dr-badge--muted">Sin usuario</span>
                )}
                {!selected.active ? <span className="dr-badge dr-badge--muted">Inactivo</span> : null}
              </div>
            </header>

            {!canEditSelected ? (
              <p className="dr-alert dr-alert--warn">
                <Lock className="inline h-4 w-4" aria-hidden /> Solo puedes editar tu propio perfil. Los administradores
                gestionan el resto del equipo.
              </p>
            ) : null}

            {!selected.profileId && ownDentistId === selected.id ? (
              <p className="dr-alert dr-alert--warn">
                Tu usuario no está vinculado a ficha de dentista. Pide a administración que revise el alta en Usuarios
                clínica.
              </p>
            ) : null}

            <div className="dr-fields">
              <div className="dr-field-frame dr-field--wide">
                <label htmlFor="dr-fullName">Nombre completo (Dr./Dra.) *</label>
                <input
                  id="dr-fullName"
                  value={form.fullName}
                  disabled={!canEditSelected}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Dra. Ana López"
                />
              </div>
              <div className="dr-field-frame">
                <label htmlFor="dr-collegiate">Nº colegiado *</label>
                <input
                  id="dr-collegiate"
                  value={form.collegiateNumber}
                  disabled={!canEditSelected}
                  onChange={(e) => setForm({ ...form, collegiateNumber: e.target.value })}
                  placeholder="Ej. 29/4521"
                />
              </div>
              <div className="dr-field-frame">
                <label htmlFor="dr-specialty">Especialidad *</label>
                <input
                  id="dr-specialty"
                  value={form.specialty}
                  disabled={!canEditSelected}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Odontología general"
                />
              </div>
              <div className="dr-field-frame">
                <label htmlFor="dr-email">Email profesional</label>
                <input
                  id="dr-email"
                  type="email"
                  value={form.email}
                  disabled={!canEditSelected}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="dr-field-frame">
                <label htmlFor="dr-phone">Teléfono</label>
                <input
                  id="dr-phone"
                  value={form.phone}
                  disabled={!canEditSelected}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              {isClientDemoMode() ? (
                <div className="dr-field-frame dr-field--wide">
                  <label htmlFor="dr-schedule">Horario habitual (demo)</label>
                  <input
                    id="dr-schedule"
                    value={form.schedule}
                    disabled={!canEditSelected}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  />
                </div>
              ) : null}
            </div>

            <footer className="dr-actions">
              <button
                type="button"
                className="dr-btn dr-btn--primary"
                disabled={saving || !canEditSelected}
                onClick={() => void saveProfile()}
              >
                <Save className="h-4 w-4" aria-hidden />
                {saving ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </footer>
          </section>
        ) : (
          <p className="dr-intro__text">Selecciona un profesional del equipo.</p>
        )}
      </div>

      {!isManager && !ownDentistId ? (
        <p className="dr-alert dr-alert--warn">
          <UserCircle className="inline h-4 w-4" aria-hidden /> No hay dentista vinculado a tu sesión. La administración
          debe asignarte el rol y la ficha en Usuarios clínica.
        </p>
      ) : null}
    </div>
  );
}

function emptyForm(): ProfileForm {
  return {
    fullName: '',
    specialty: '',
    collegiateNumber: '',
    email: '',
    phone: '',
    schedule: ''
  };
}
