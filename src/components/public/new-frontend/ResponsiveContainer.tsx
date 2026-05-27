import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  wide?: boolean
  className?: string
}>

export function ResponsiveContainer({ wide = false, className = '', children }: Props) {
  return (
    <div className={`ac-container${wide ? ' ac-container--wide' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
