import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, Building2, ChevronDown, LogIn, Shield, UserRound } from 'lucide-react'

const OPTIONS = [
  {
    href: '/portal-paciente',
    icon: UserRound,
    tone: 'mint',
    title: 'Portal paciente',
    text: 'Consulta tus citas, informes y facturas.'
  },
  {
    href: '/login/admin',
    icon: Building2,
    tone: 'sky',
    title: 'Panel clínica',
    text: 'Gestiona agenda, pacientes y facturación.'
  },
  {
    href: '/platform/login',
    icon: Shield,
    tone: 'violet',
    title: 'Plataforma',
    text: 'Acceso para administradores.'
  }
] as const

type Props = {
  onNavigate?: () => void
}

export function LoginDropdown({ onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const handleNavigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="ac-enter-dd" ref={rootRef}>
      <button
        type="button"
        className="ac-enter-dd__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Entrar
        <ChevronDown className={`ac-enter-dd__chev${open ? ' ac-enter-dd__chev--open' : ''}`} aria-hidden />
      </button>
      {open ? (
        <div id={menuId} className="ac-enter-dd__menu" role="menu" aria-label="Accesos AgendaClinic">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <a
                key={opt.href}
                href={opt.href}
                role="menuitem"
                className={`ac-enter-dd__item ac-enter-dd__item--${opt.tone}`}
                onClick={handleNavigate}
              >
                <span className="ac-enter-dd__icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="ac-enter-dd__copy">
                  <strong>{opt.title}</strong>
                  <small>{opt.text}</small>
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
