import { useRef, useState } from 'react';
import { Calendar, Camera, ExternalLink, Mail, Phone, Upload } from 'lucide-react';
import { isClientDemoMode } from '@/lib/appMode';
import {
  profileChecklist,
  profileCompletionPercent,
  professionalBadges
} from '@/lib/clinical/professionalProfile';
import { uploadProfessionalPhoto } from '@/lib/clinical/professionalPhoto';
import { resolveDentistPhotoUrl, dentistInitials } from '@/lib/clinical/dentistDisplay';
import { saveDentist } from '@/lib/demoStore';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useNotice } from '@/hooks/useNotice';
import type { Dentist } from '@/types/demo';

type Props = {
  dentist: Dentist;
  clinicId: string;
  canEdit: boolean;
  onOpenAgenda: () => void;
};

export function AgendaDoctorProfileView({ dentist, clinicId, canEdit, onOpenAgenda }: Props) {
  const { state, commit, refresh } = useDemoStore();
  const { setNotice } = useNotice();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const photoUrl = resolveDentistPhotoUrl(dentist);
  const completion = profileCompletionPercent(dentist);
  const checklist = profileChecklist(dentist);
  const badges = professionalBadges(dentist);
  const tone = dentist.agendaColor ?? '#14b8a6';

  async function onPickPhoto(file: File | null) {
    if (!file || !canEdit) return;
    setUploading(true);
    try {
      const saved = await uploadProfessionalPhoto(state, dentist, file, {
        clinicId,
        refresh: isClientDemoMode() ? undefined : refresh
      });
      if (isClientDemoMode()) commit(saveDentist(state, saved));
      else await refresh();
      setNotice({ type: 'ok', message: 'Foto de perfil actualizada.' });
    } catch (e) {
      setNotice({ type: 'error', message: e instanceof Error ? e.message : 'No se pudo subir la foto.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <section className="agd-doc-profile" style={{ ['--agd-doc-color' as string]: tone }}>
      <header className="agd-doc-profile__hero">
        <div className="agd-doc-profile__photo-wrap">
          <span className="agd-doc-profile__photo" aria-hidden>
            {photoUrl ? (
              <img src={photoUrl} alt="" width={120} height={120} />
            ) : (
              <span>{dentistInitials(dentist.fullName)}</span>
            )}
          </span>
          {canEdit ? (
            <button
              type="button"
              className="agd-doc-profile__photo-btn"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" aria-hidden />
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="agd-doc-profile__intro">
          <p className="agd-doc-profile__eyebrow">Perfil profesional</p>
          <h2>{dentist.fullName}</h2>
          <p className="agd-doc-profile__title">{dentist.visibleTitle || dentist.specialty || 'Profesional clínico'}</p>
          <div className="agd-doc-profile__badges">
            {badges.map((b) => (
              <span key={b.id} className={`agd-doc-profile__badge agd-doc-profile__badge--${b.tone}`}>
                {b.label}
              </span>
            ))}
          </div>
          <div className="agd-doc-profile__actions">
            <button type="button" className="agd-btn-primary" onClick={onOpenAgenda}>
              <Calendar className="h-4 w-4" aria-hidden />
              Ver agenda
            </button>
            <span className="agd-btn-secondary agd-btn-secondary--static text-sm text-slate-500">
              Editar perfil completo en Profesionales (menú lateral)
            </span>
          </div>
        </div>
      </header>

      <div className="agd-doc-profile__grid">
        <article className="agd-doc-profile__card">
          <h3>Datos de contacto</h3>
          <ul>
            <li>
              <Mail className="h-4 w-4" aria-hidden />
              <span>{dentist.email || '—'}</span>
            </li>
            <li>
              <Phone className="h-4 w-4" aria-hidden />
              <span>{dentist.phone || '—'}</span>
            </li>
            <li>
              <Calendar className="h-4 w-4" aria-hidden />
              <span>{dentist.schedule || 'Horario no definido'}</span>
            </li>
          </ul>
        </article>

        <article className="agd-doc-profile__card">
          <h3>Identificación clínica</h3>
          <dl>
            <div>
              <dt>Especialidad</dt>
              <dd>{dentist.specialty || '—'}</dd>
            </div>
            <div>
              <dt>N.º colegiado</dt>
              <dd>{dentist.collegiateNumber || 'Pendiente'}</dd>
            </div>
            <div>
              <dt>Colegio profesional</dt>
              <dd>{dentist.professionalCollege || '—'}</dd>
            </div>
            <div>
              <dt>Idiomas</dt>
              <dd>{dentist.languages?.length ? dentist.languages.join(', ') : '—'}</dd>
            </div>
          </dl>
        </article>

        <article className="agd-doc-profile__card agd-doc-profile__card--wide">
          <h3>Biografía para informes</h3>
          <p>{dentist.reportBio?.trim() || 'Sin biografía publicada todavía.'}</p>
        </article>

        <article className="agd-doc-profile__card">
          <h3>Completitud del perfil</h3>
          <p className="agd-doc-profile__pct">{completion}%</p>
          <ul className="agd-doc-profile__checklist">
            {checklist.map((item) => (
              <li key={item.id} className={item.done ? 'is-done' : item.warn ? 'is-warn' : ''}>
                {item.label}
              </li>
            ))}
          </ul>
          {canEdit ? (
            <p className="agd-doc-profile__hint">
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Sube una foto para que aparezca en la agenda y en la reserva online del paciente.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
