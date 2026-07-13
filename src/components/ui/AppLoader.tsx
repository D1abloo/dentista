type AppLoaderProps = {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
}

export const AppLoader = ({
  label = 'Cargando…',
  size = 'md',
  fullscreen = false
}: AppLoaderProps) => {
  const dotSize = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
  }[size]

  const wrapClass = fullscreen
    ? 'min-h-dvh bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(8,145,178,0.12),transparent_55%)]'
    : ''

  return (
    <div
      className={wrapClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex items-center justify-center gap-2" aria-hidden>
          <span className={`${dotSize} rounded-full bg-brand-600 animate-bounce [animation-delay:-0.2s]`} />
          <span className={`${dotSize} rounded-full bg-brand-600 animate-bounce [animation-delay:-0.1s]`} />
          <span className={`${dotSize} rounded-full bg-brand-600 animate-bounce`} />
        </div>
        {label ? <p className="text-sm font-semibold text-slate-600">{label}</p> : null}
      </div>
    </div>
  )
}
