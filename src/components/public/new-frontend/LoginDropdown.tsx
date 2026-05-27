import { ChevronDown } from 'lucide-react'

const ACCESS_LINKS = [
  { href: '/portal-paciente', label: 'Portal paciente' },
  { href: '/login/admin', label: 'Panel clínica' },
  { href: '/platform/login', label: 'Plataforma' }
] as const

type Props = {
  onNavigate?: () => void
}

export function LoginDropdown({ onNavigate }: Props) {
  return (
    <details className="ac-login-dd">
      <summary className="ac-login-dd__summary">
        Entrar
        <ChevronDown className="h-4 w-4" aria-hidden />
      </summary>
      <div className="ac-login-dd__menu" role="menu" aria-label="Accesos de AgendaClinic">
        {ACCESS_LINKS.map((link) => (
          <a key={link.href} href={link.href} role="menuitem" onClick={onNavigate}>
            {link.label}
          </a>
        ))}
      </div>
    </details>
  )
}
