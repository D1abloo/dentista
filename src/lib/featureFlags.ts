/** Acceso al portal del paciente mediante token (deshabilitado por defecto). */
export const isPortalTokenLoginEnabled = (): boolean => {
  if (!isTokenFeaturesEnabled()) return false
  const raw = import.meta.env.PUBLIC_PORTAL_TOKEN_LOGIN
  if (raw === undefined || raw === '') return false
  return raw === 'true' || raw === '1'
}

/** UI administrativa de tokens (generar, copiar, renovar, mostrar en tablas). */
export const isTokenFeaturesEnabled = (): boolean => {
  const raw = import.meta.env.PUBLIC_ENABLE_TOKEN_FEATURES
  if (raw === undefined || raw === '') return false
  return raw === 'true' || raw === '1'
}
