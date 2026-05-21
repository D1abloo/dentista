export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  image?: string;
  imageAlt?: string;
  steps: string[];
  tips?: string[];
};

export const patientGuideSections: GuideSection[] = [
  {
    id: 'acceso',
    title: 'Acceso al portal del paciente (PdP)',
    summary: 'Tras recibir tus credenciales por correo, entra con un solo formulario en /login.',
    image: '/images/login-dentista-paciente.jpg',
    imageAlt: 'Paciente en recepción de clínica dental',
    steps: [
      'Abre Iniciar sesión en la web e introduce email y contraseña.',
      'El sistema detecta que eres paciente y abre tu portal personal.',
      'Si es tu primer acceso, cambia la contraseña temporal cuando se solicite.'
    ],
    tips: ['No compartas tu contraseña. Cierra sesión en dispositivos compartidos.']
  },
  {
    id: 'citas',
    title: 'Citas ficticias de ejemplo',
    summary: 'En el PdP verás citas con referencia CIT-XXXX: fecha, profesional, gabinete y estado.',
    image: '/images/guides/pdp-citas.svg',
    imageAlt: 'Vista de citas del paciente',
    steps: [
      'Menú Citas: próximas confirmadas, pendientes de confirmar y historial.',
      'Cada tarjeta muestra tratamiento, dentista y sede.',
      'Desde Reservar cita (web pública) puedes pedir hueco en clínicas adheridas.'
    ]
  },
  {
    id: 'informes',
    title: 'Informes y documentos clínicos',
    summary: 'Radiografías, informes PDF y consentimientos que tu clínica haya compartido contigo.',
    image: '/images/guides/pdp-informes.svg',
    imageAlt: 'Informes clínicos en el portal',
    steps: [
      'Informes: listado con fecha y tipo; abre el PDF en vista previa.',
      'Documentos: archivos adjuntos (RX, fotografías) filtrados por paciente.',
      'Consentimientos: firma los pendientes antes de ciertos tratamientos.'
    ]
  },
  {
    id: 'facturas',
    title: 'Facturas y pagos',
    summary: 'Consulta FAC-XXXX, descarga PDF y realiza el pago cuando esté habilitado.',
    image: '/images/guides/pdp-facturas.svg',
    imageAlt: 'Facturas del paciente',
    steps: [
      'Facturas: estado pendiente, pagada o vencida con importe desglosado.',
      'Pagos: historial PAG-XXXX vinculado a cada factura.',
      'Descarga el PDF oficial para tu gestión personal.'
    ]
  }
];

export const adminGuideSections: GuideSection[] = [
  {
    id: 'panel',
    title: 'Panel administrativo de clínica',
    summary: 'Vista general con citas del día, ingresos y accesos rápidos a módulos.',
    image: '/images/guides/admin-dashboard.svg',
    imageAlt: 'Dashboard administrativo',
    steps: [
      'Dashboard: KPIs de la sede activa y ocupación de agenda.',
      'Usa el selector de sede si tu organización tiene varias clínicas.',
      'La guía (este apartado) permanece en el menú lateral para consultarla cuando quieras.'
    ]
  },
  {
    id: 'agenda-citas',
    title: 'Agenda y citas',
    summary: 'Gestiona huecos, estados y vinculación paciente–tratamiento–profesional.',
    image: '/images/guides/admin-agenda.svg',
    imageAlt: 'Agenda de citas',
    steps: [
      'Agenda: vista día, semana o mes con colores por estado.',
      'Citas: alta manual, cambio de estado y búsqueda por ID CIT-XXXX o paciente.',
      'Recordatorios: activa avisos por email o WhatsApp en Configuración.'
    ]
  },
  {
    id: 'pacientes-informes',
    title: 'Pacientes, informes y documentos',
    summary: 'Ficha PAT-XXXX con informes clínicos, RX y mensajes internos.',
    image: '/images/guides/admin-pacientes.svg',
    imageAlt: 'Ficha de paciente',
    steps: [
      'Pacientes: busca por nombre, DNI o ID; abre la ficha completa.',
      'Informes: sube PDF, asigna paciente y categoría.',
      'Documentos y consentimientos: control de lo visible en el PdP.'
    ]
  },
  {
    id: 'facturacion',
    title: 'Facturas, pagos y reportes',
    summary: 'Emisión FAC-XXXX, cobros PAG-XXXX y métricas de ingresos.',
    image: '/images/guides/admin-facturas.svg',
    imageAlt: 'Facturación clínica',
    steps: [
      'Facturas: serie configurable, IVA y logo de tu clínica en el PDF.',
      'Pagos: registra cobros y concilia con facturas pendientes.',
      'Reportes: ingresos por periodo y tratamientos más reservados.'
    ]
  },
  {
    id: 'portal-acceso',
    title: 'Acceso al PdP (doctor en portal paciente)',
    summary: 'Genera tokens temporales para que el equipo vea el portal como el paciente, con auditoría.',
    image: '/images/login-dentista-paciente.jpg',
    imageAlt: 'Acceso supervisado al portal paciente',
    steps: [
      'Acceso PdP: crea enlace/token con caducidad para soporte o revisión clínica.',
      'Todas las acciones quedan registradas en el historial de auditoría.',
      'El paciente sigue usando su propio login habitual; esto es solo para personal autorizado.'
    ]
  },
  {
    id: 'logo-marca',
    title: 'Logo de tu clínica en el menú',
    summary: 'Sube el escudo o logotipo de tu hospital en Configuración; aparece en la barra lateral.',
    image: '/brand/dentista-logo.svg',
    imageAlt: 'Logo en barra lateral',
    steps: [
      'Configuración → Logo de la clínica: PNG o JPG, fondo transparente recomendado.',
      'También se usa en facturas PDF si lo indicas en los datos de facturación.',
      'Puedes eliminar el logo y volver al predeterminado de Dentista+.'
    ]
  }
];
