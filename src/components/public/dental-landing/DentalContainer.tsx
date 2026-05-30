import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  wide?: boolean
  className?: string
}>

export const DentalContainer = ({ wide = false, className = '', children }: Props) => (
  <div className={`adb-container${wide ? ' adb-container--wide' : ''}${className ? ` ${className}` : ''}`}>
    {children}
  </div>
)
