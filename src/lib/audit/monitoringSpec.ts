/** Especificación resumida del sistema de monitorización (panel admin). */
export const MONITORING_SPEC_SECTIONS = [
  {
    title: '1. Logs de autenticación',
    items: [
      'Login correcto / fallido / logout / recuperación de contraseña',
      'Sesión expirada o revocada · acceso denegado por rol',
      'Datos: user_id, email, rol, tenant, clínica, IP, user-agent, ruta, resultado'
    ]
  },
  {
    title: '2. Actividad de usuario',
    items: [
      'Pacientes, citas, bloqueos de agenda, informes, documentos',
      'Facturas, pagos, consentimientos, mensajes, tickets de soporte',
      'Cambios de configuración y permisos'
    ]
  },
  {
    title: '3. Seguridad',
    items: [
      'Intentos entre tenants · paciente/factura/informe ajeno',
      'Fallos RLS · token inválido · descarga bloqueada',
      'Niveles: bajo, medio, alto, crítico'
    ]
  },
  {
    title: '4. Errores y monitorización',
    items: [
      'API, Supabase, storage, PDF, pagos, renderizado (JS)',
      'Métricas: logins diarios, citas, informes, facturas, descargas por clínica',
      'Adaptador preparado para Sentry / Datadog (opcional)'
    ]
  },
  {
    title: '5. Tablas Supabase',
    items: [
      'audit_logs — eventos centralizados (inmutables desde UI)',
      'login_events — historial de sesiones e intentos',
      'RLS: solo inserción vía API con service role; lectura filtrada por clínica'
    ]
  },
  {
    title: '6. Paneles',
    items: [
      'Plataforma: Monitorización y registros (global, Super Admin)',
      'Clínica: Actividad de la clínica (solo clinic_id del admin)',
      'Pacientes: sin acceso al panel de logs'
    ]
  },
  {
    title: '7. Retención y exportación',
    items: [
      '30 / 90 / 365 días · críticos prolongados',
      'Export CSV/PDF registra audit.exported',
      'Sin contraseñas, tokens ni PHI completo en logs'
    ]
  }
];
