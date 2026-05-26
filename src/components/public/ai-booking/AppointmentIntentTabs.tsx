import type { AssistantTab } from './types'

const TABS: { id: AssistantTab; label: string }[] = [
  { id: 'book', label: 'Nueva cita' },
  { id: 'mine', label: 'Mis citas' },
  { id: 'change', label: 'Cambiar' },
  { id: 'help', label: 'Ayuda' }
]

type Props = {
  activeTab: AssistantTab
  onTabChange: (tab: AssistantTab) => void
}

export function AppointmentIntentTabs({ activeTab, onTabChange }: Props) {
  return (
    <nav className="ai-tabs" aria-label="Secciones del asistente">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`ai-tabs__btn${activeTab === tab.id ? ' ai-tabs__btn--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
