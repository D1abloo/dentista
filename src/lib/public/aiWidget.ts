/** Evento global para abrir el widget flotante de Citas con IA. */
export const AI_WIDGET_OPEN_EVENT = 'ac:open-ai-widget'

export const openAiAppointmentsWidget = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AI_WIDGET_OPEN_EVENT))
}

export const isAiWidgetHiddenPath = (pathname: string) =>
  pathname === '/citas-con-ia' || pathname.startsWith('/citas-con-ia/')
