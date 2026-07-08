import type { ReactNode } from 'react'
import { CookieBanner } from './CookieBanner'
import { DentalFooter } from './dental-landing/DentalFooter'
import { DentalHeader } from './dental-landing/DentalHeader'

type Props = {
  children: ReactNode
  onOpenDemo?: () => void
}

/** Shell único para todas las páginas públicas: header dental, contenido, footer y cookies. */
export function PublicSiteShell({ children, onOpenDemo }: Props) {
  return (
    <>
      <DentalHeader onOpenDemo={onOpenDemo} />
      {children}
      <DentalFooter />
      <CookieBanner />
    </>
  )
}
