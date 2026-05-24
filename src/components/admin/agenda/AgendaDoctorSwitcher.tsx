import { Users } from 'lucide-react';
import type { AgendaDentistColumn } from '@/lib/clinical/dentistDisplay';
import { AgendaDoctorAvatar } from './AgendaDoctorAvatar';

export type AgendaDoctorPanel = 'profile' | 'calendar';

type Props = {
  dentists: AgendaDentistColumn[];
  activeId: string;
  panel: AgendaDoctorPanel;
  ownAgenda?: boolean;
  onSelect: (id: string) => void;
  onPanelChange: (panel: AgendaDoctorPanel) => void;
};

export function AgendaDoctorSwitcher({
  dentists,
  activeId,
  panel,
  ownAgenda = false,
  onSelect,
  onPanelChange
}: Props) {
  const active = dentists.find((d) => d.id === activeId);

  return (
    <section className="agd-doctors" aria-label="Profesionales de la clínica">
      <div className="agd-doctors__tabs" role="tablist" aria-label="Seleccionar profesional">
        {!ownAgenda ? (
          <button
            type="button"
            role="tab"
            aria-selected={!activeId}
            className={`agd-doctors__tab${!activeId ? ' agd-doctors__tab--active' : ''}`}
            onClick={() => onSelect('')}
          >
            <span className="agd-doctors__tab-icon agd-doctors__tab-icon--all" aria-hidden>
              <Users className="h-4 w-4" />
            </span>
            <span>
              <strong>Toda la clínica</strong>
              <small>Agenda combinada</small>
            </span>
          </button>
        ) : null}
        {dentists.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={activeId === d.id}
            className={`agd-doctors__tab${activeId === d.id ? ' agd-doctors__tab--active' : ''}`}
            style={{ ['--agd-doc-color' as string]: d.agendaColor ?? '#14b8a6' }}
            onClick={() => onSelect(d.id)}
          >
            <AgendaDoctorAvatar dentist={d} size="sm" />
            <span>
              <strong>{d.fullName}</strong>
              <small>{d.visibleTitle || 'Profesional clínico'}</small>
            </span>
          </button>
        ))}
      </div>

      {activeId && active ? (
        <div className="agd-doctors__subnav" role="tablist" aria-label={`Secciones de ${active.fullName}`}>
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'profile'}
            className={`agd-doctors__sub${panel === 'profile' ? ' agd-doctors__sub--active' : ''}`}
            onClick={() => onPanelChange('profile')}
          >
            Perfil
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'calendar'}
            className={`agd-doctors__sub${panel === 'calendar' ? ' agd-doctors__sub--active' : ''}`}
            onClick={() => onPanelChange('calendar')}
          >
            Agenda
          </button>
        </div>
      ) : null}
    </section>
  );
}
