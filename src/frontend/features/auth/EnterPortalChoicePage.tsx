import { useLoginWithPortalChoice } from '@/components/auth/useLoginWithPortalChoice'
import { AuthCard, PortalChoiceList } from '@/frontend/features/auth/AuthUi'

export const EnterPortalChoicePage = () => {
  const {
    email,
    password,
    error,
    portalLoading,
    portalChoice,
    pickPortal,
    resetChoice
  } = useLoginWithPortalChoice()

  if (!portalChoice) {
    return (
      <AuthCard title="Selecciona tu portal" description="Vuelve a iniciar sesión si no ves opciones.">
        <a href="/login" className="text-brand-700 underline">
          Ir al login
        </a>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Elige tu espacio">
      <PortalChoiceList
        email={portalChoice.email || email}
        options={portalChoice.options}
        loading={portalLoading}
        onSelect={pickPortal}
      />
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <button type="button" className="mt-4 text-sm text-brand-700" onClick={resetChoice}>
        ← Cambiar credenciales
      </button>
      {!password ? null : <span className="sr-only">Sesión en curso</span>}
    </AuthCard>
  )
}
