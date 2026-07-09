import type { ReactNode } from 'react'
import { CookieBanner } from './CookieBanner'
import { AppFooter } from './new-frontend/AppFooter'
import { AppHeader } from './new-frontend/AppHeader'

type Props = {
  children: ReactNode
  onOpenDemo?: () => void
}

/** Shell único del sitio público: header, contenido, footer y cookies. */
export function PublicSiteShell({ children, onOpenDemo }: Props) {
  return (
    <div className="ac-site">
      <a href="#main-content" className="ac-skip">
        Saltar al contenido
      </a>
      <AppHeader onOpenDemo={onOpenDemo} />
      {children}
      <AppFooter />
      <CookieBanner />
    </div>
  )
}
