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
  const wrapClass = fullscreen ? 'app-loader-screen app-loader-screen--fullscreen' : 'app-loader-inline'

  return (
    <div className={wrapClass} role="status" aria-live="polite" aria-busy="true">
      <div className={`app-loader app-loader--${size}`} aria-hidden>
        <span />
        <span />
        <span />
      </div>
      {label ? <p className="app-loader-screen__label">{label}</p> : null}
    </div>
  )
}
