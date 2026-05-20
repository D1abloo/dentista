export const LEGAL_ENTITY = {
  appName: 'Dentista+',
  operator: 'Estructura Web',
  email: 'info@estructuraweb.es',
  web: 'https://dentista.app',
  lastUpdated: '20 de mayo de 2026',
  jurisdiction: 'España / Unión Europea'
} as const;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
};

export const privacySections: LegalSection[] = [
  {
    id: 'responsable',
    title: '1. Responsable del tratamiento',
    paragraphs: [
      `El responsable del tratamiento de los datos personales recabados a través de ${LEGAL_ENTITY.appName} es ${LEGAL_ENTITY.operator}, con sede de contacto en ${LEGAL_ENTITY.jurisdiction}.`,
      `Puedes dirigirte a nosotros en ${LEGAL_ENTITY.email} para cualquier cuestión relacionada con privacidad, ejercicio de derechos o delegado de protección de datos.`
    ]
  },
  {
    id: 'alcance',
    title: '2. Ámbito de aplicación',
    paragraphs: [
      'Esta política aplica a visitantes del sitio web, pacientes que usan el portal del paciente, personal de clínicas que accede al panel de administración, solicitantes de alta de clínica y usuarios del panel de plataforma (super administración).',
      'Cada clínica adherida actúa como responsable independiente respecto a los datos clínicos de sus pacientes. Dentista+ facilita la infraestructura tecnológica con aislamiento por clínica (multi-tenant).'
    ]
  },
  {
    id: 'datos',
    title: '3. Datos que tratamos',
    list: [
      'Identificación y contacto: nombre, email, teléfono, dirección, DNI cuando proceda.',
      'Datos de cuenta: credenciales cifradas en Supabase Auth, rol, clínica y tenant asociados.',
      'Datos clínicos y administrativos: citas, historiales, informes, documentos, consentimientos, facturas y pagos.',
      'Datos técnicos: IP, logs de acceso, cookies esenciales y preferencias de consentimiento.',
      'Comunicaciones: mensajes de soporte, solicitudes de registro de clínica y formularios de contacto.'
    ],
    paragraphs: [
      'No solicitamos categorías especiales de datos salvo las estrictamente necesarias para la prestación del servicio dental y con base legal adecuada (consentimiento explícito, obligación legal o interés vital cuando corresponda).'
    ]
  },
  {
    id: 'finalidades',
    title: '4. Finalidades y bases legales',
    list: [
      'Gestión de citas y portal paciente — ejecución de contrato / consentimiento.',
      'Panel de clínica y facturación — ejecución de contrato con la clínica.',
      'Alta de nuevas clínicas — consentimiento y medidas precontractuales.',
      'Soporte y contacto — interés legítimo / consentimiento.',
      'Seguridad, auditoría y prevención de fraude — interés legítimo.',
      'Cumplimiento normativo (facturación, conservación) — obligación legal.'
    ],
    paragraphs: []
  },
  {
    id: 'conservacion',
    title: '5. Plazos de conservación',
    paragraphs: [
      'Los datos de cuenta se conservan mientras dure la relación contractual y, posteriormente, durante los plazos legales de prescripción y obligaciones fiscales.',
      'Los datos clínicos se rigen por la normativa sanitaria y por la política interna de cada clínica, dentro de los límites configurados en la plataforma.',
      'Los logs técnicos se conservan un periodo limitado (habitualmente 12 meses) salvo obligación legal distinta.'
    ]
  },
  {
    id: 'destinatarios',
    title: '6. Destinatarios y encargados',
    paragraphs: [
      'Podemos comunicar datos a proveedores que prestan servicios de hosting, base de datos (Supabase), email transaccional, pasarelas de pago (Stripe cuando esté activo) y mensajería, siempre con contrato de encargo conforme al art. 28 RGPD.',
      'No vendemos datos personales a terceros. Las clínicas no acceden a datos de pacientes de otras clínicas gracias al aislamiento por tenant y políticas RLS.'
    ]
  },
  {
    id: 'transferencias',
    title: '7. Transferencias internacionales',
    paragraphs: [
      'Si algún proveedor procesa datos fuera del EEE, exigimos garantías adecuadas (cláusulas contractuales tipo, decisiones de adecuación o certificaciones reconocidas).',
      'Puedes solicitar información detallada sobre transferencias escribiendo a ' + LEGAL_ENTITY.email + '.'
    ]
  },
  {
    id: 'derechos',
    title: '8. Tus derechos',
    list: [
      'Acceso, rectificación y supresión.',
      'Limitación u oposición al tratamiento.',
      'Portabilidad cuando el tratamiento se base en consentimiento o contrato automatizado.',
      'Retirar el consentimiento en cualquier momento sin afectar a la licitud previa.',
      'Reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).'
    ],
    paragraphs: [
      'Para ejercer derechos sobre datos gestionados por tu clínica, contacta primero con el responsable de tu centro. Para datos tratados por Estructura Web como operador de la plataforma, escribe a ' +
        LEGAL_ENTITY.email +
        '.'
    ]
  },
  {
    id: 'seguridad',
    title: '9. Medidas de seguridad',
    paragraphs: [
      'Aplicamos cifrado en tránsito (HTTPS/TLS), control de acceso por roles, sesiones firmadas, contraseñas almacenadas por el proveedor de autenticación, políticas RLS en base de datos y revisión manual de altas de clínica.',
      'El personal autorizado sigue principios de mínimo privilegio. Se registran eventos relevantes para auditoría.'
    ]
  },
  {
    id: 'menores',
    title: '10. Menores',
    paragraphs: [
      'El portal paciente puede ser utilizado por menores bajo responsabilidad del tutor o de la clínica. La clínica debe obtener las autorizaciones necesarias conforme a la normativa aplicable.'
    ]
  },
  {
    id: 'cambios',
    title: '11. Cambios en esta política',
    paragraphs: [
      'Podemos actualizar esta política para reflejar cambios legales o funcionales. Publicaremos la versión vigente con fecha de actualización. Los cambios sustanciales se comunicarán por medios razonables.'
    ]
  }
];

export const termsSections: LegalSection[] = [
  {
    id: 'objeto',
    title: '1. Objeto y aceptación',
    paragraphs: [
      `Los presentes Términos regulan el acceso y uso de ${LEGAL_ENTITY.appName}, plataforma SaaS de gestión de citas y operaciones clínicas dentales operada por ${LEGAL_ENTITY.operator}.`,
      'Al registrarte, solicitar alta de clínica, iniciar sesión o utilizar cualquier funcionalidad, declaras haber leído y aceptado estos Términos y la Política de privacidad.'
    ]
  },
  {
    id: 'definiciones',
    title: '2. Definiciones',
    list: [
      'Plataforma: el software Dentista+, APIs y paneles web asociados.',
      'Clínica o Tenant: organización dental con panel aislado y datos propios.',
      'Usuario staff: personal autorizado de la clínica (administración, recepción, odontólogos).',
      'Paciente: usuario del portal del paciente vinculado a una clínica.',
      'Super Admin: equipo de Estructura Web con acceso de operación global sin mezclar datos clínicos entre clínicas.'
    ],
    paragraphs: []
  },
  {
    id: 'cuentas',
    title: '3. Cuentas y acceso',
    paragraphs: [
      'Debes proporcionar información veraz y mantenerla actualizada. Eres responsable de la confidencialidad de tus credenciales.',
      'Queda prohibido compartir cuentas entre personas no autorizadas, intentar acceder a datos de otra clínica o eludir controles de seguridad.',
      'Podemos suspender o cancelar cuentas ante uso fraudulento, impago del plan contratado o incumplimiento grave de estos Términos.'
    ]
  },
  {
    id: 'clinicas',
    title: '4. Alta de clínicas',
    paragraphs: [
      'La solicitud en «Registrar clínica» no implica activación automática. Estructura Web revisa cada petición y puede aprobar o rechazar según criterios de seguridad y capacidad.',
      'Tras la aprobación se crea un tenant aislado, la organización en base de datos y credenciales para el administrador de la clínica. La contraseña inicial debe cambiarse en el primer acceso.',
      'Cada clínica es responsable del uso conforme a la ley por parte de su personal y pacientes.'
    ]
  },
  {
    id: 'uso',
    title: '5. Uso permitido',
    list: [
      'Gestionar agenda, pacientes, documentación y facturación de tu propia clínica.',
      'Ofrecer al paciente acceso a su portal de citas, informes y pagos habilitados.',
      'Cumplir la normativa sanitaria, de protección de datos y publicidad aplicable.'
    ],
    paragraphs: [
      'Queda prohibido usar la plataforma para fines ilícitos, spam, ingeniería inversa no autorizada, sobrecarga intencionada de sistemas o extracción masiva de datos ajenos a tu organización.'
    ]
  },
  {
    id: 'contenido',
    title: '6. Contenido y datos clínicos',
    paragraphs: [
      'La clínica conserva la titularidad de los datos que introduce. Otorgas a Estructura Web una licencia limitada para alojar, procesar y mostrar dichos datos únicamente para prestar el servicio.',
      'Dentista+ no sustituye el juicio clínico profesional ni la urgencia presencial. Los recordatorios y mensajes automatizados son auxiliares.'
    ]
  },
  {
    id: 'planes',
    title: '7. Planes, precios y facturación',
    paragraphs: [
      'Los planes (Essential, Professional, Enterprise) se describen en la web o contrato comercial. Los precios pueden actualizarse con preaviso razonable.',
      'El impago puede conllevar suspensión del acceso tras periodo de gracia. Los datos se conservan según la política de privacidad y obligaciones legales.'
    ]
  },
  {
    id: 'sla',
    title: '8. Disponibilidad y soporte',
    paragraphs: [
      'Nos esforzamos por mantener la plataforma disponible, sin garantizar ausencia total de interrupciones por mantenimiento o causas de fuerza mayor.',
      'El soporte se presta por los canales publicados (formulario de contacto, email). Los tiempos de respuesta dependen del plan contratado.'
    ]
  },
  {
    id: 'propiedad',
    title: '9. Propiedad intelectual',
    paragraphs: [
      'El software, diseño, marca Dentista+ y documentación son propiedad de Estructura Web o sus licenciantes. No se concede ningún derecho más allá del uso contratado.',
      'No está permitido copiar, modificar o redistribuir el código salvo acuerdo escrito.'
    ]
  },
  {
    id: 'responsabilidad',
    title: '10. Limitación de responsabilidad',
    paragraphs: [
      'En la medida permitida por la ley, Estructura Web no será responsable de daños indirectos, lucro cesante o pérdida de datos derivados de un uso indebido o de terceros.',
      'La responsabilidad total acumulada quedará limitada, salvo dolo o negligencia grave, al importe abonado por la clínica en los doce meses anteriores al hecho causante.'
    ]
  },
  {
    id: 'ley',
    title: '11. Ley aplicable y jurisdicción',
    paragraphs: [
      'Estos Términos se rigen por la legislación española. Las partes se someten a los Juzgados y Tribunales que correspondan según la normativa de consumidores y usuarios, sin perjuicio de fuero imperativo.',
      'Para reclamaciones: ' + LEGAL_ENTITY.email + '.'
    ]
  }
];

export const documentationSections: LegalSection[] = [
  {
    id: 'portales',
    title: 'Portales de acceso',
    list: [
      'Paciente (/paciente): citas, informes, documentos, facturas y pagos.',
      'Clínica (/admin): agenda, pacientes, facturación y equipo — datos aislados por organización.',
      'Plataforma (/platform): alta y revisión de clínicas (solo equipo autorizado).'
    ],
    paragraphs: []
  },
  {
    id: 'registro',
    title: 'Alta de clínica',
    paragraphs: [
      'Completa el formulario en /registro-clinica. Tras la aprobación recibirás credenciales para el panel de tu centro.',
      'Cada clínica opera en un tenant independiente sin acceso cruzado a otras organizaciones.'
    ]
  },
  {
    id: 'soporte',
    title: 'Soporte',
    paragraphs: [
      'Formulario de contacto en /contacto o email a info@estructuraweb.es.',
      'Documentación técnica del repositorio en docs/ARCHITECTURE.md y docs/PANEL_HELP.md.'
    ]
  }
];

export const cookiesSections: LegalSection[] = [
  {
    id: 'que-son',
    title: '1. ¿Qué son las cookies?',
    paragraphs: [
      'Las cookies son pequeños archivos que el sitio o la aplicación almacenan en tu dispositivo. También usamos tecnologías similares (localStorage) para recordar preferencias y mantener la sesión.',
      'En Dentista+ priorizamos cookies técnicas necesarias para el funcionamiento. Las cookies analíticas o de marketing solo se activarán si las aceptas expresamente cuando estén disponibles.'
    ]
  },
  {
    id: 'tipos',
    title: '2. Tipos de cookies que utilizamos',
    list: [
      'Estrictamente necesarias: sesión de usuario (cookie httpOnly df_session), seguridad CSRF y equilibrio de carga.',
      'Preferencias: elección del banner de cookies (clave local dentista_cookies).',
      'Funcionales: recordatorio de interfaz en modo demostración local únicamente si PUBLIC_DEMO_MODE está activo en tu entorno.',
      'Analíticas: no activas por defecto; si se incorporan, requerirán consentimiento previo.'
    ],
    paragraphs: []
  },
  {
    id: 'tabla',
    title: '3. Detalle de cookies y almacenamiento',
    list: [
      'df_session — Cookie — Duración: sesión (8 h máx.) — Finalidad: autenticación staff/paciente/super admin — Proveedor: Dentista+',
      'dentista_cookies — localStorage — Duración: persistente hasta borrado — Finalidad: preferencia aceptar/rechazar cookies — Proveedor: Dentista+',
      'dentista_tenant_id / dentista_role — localStorage — Solo modo demostración local — Finalidad: simular acceso multi-tenant en desarrollo',
      'Cookies de Supabase Auth — Cookie — Finalidad: tokens de autenticación cuando inicias sesión con proveedor — Proveedor: Supabase'
    ],
    paragraphs: []
  },
  {
    id: 'gestion',
    title: '4. Cómo gestionar tus preferencias',
    paragraphs: [
      'Al entrar por primera vez verás el banner inferior donde puedes Aceptar todas, Rechazar no esenciales o Personalizar.',
      'Puedes eliminar cookies y localStorage desde la configuración de tu navegador. Ten en cuenta que borrar cookies esenciales cerrará tu sesión.',
      'Consulta la configuración de Chrome, Firefox, Safari o Edge en sus secciones «Privacidad» / «Cookies».'
    ]
  },
  {
    id: 'terceros',
    title: '5. Cookies de terceros',
    paragraphs: [
      'Stripe u otros proveedores de pago pueden instalar cookies propias cuando completes un pago en línea; se rigen por sus políticas.',
      'Los mapas o widgets embebidos futuros se documentarán aquí antes de su activación.'
    ]
  },
  {
    id: 'actualizacion',
    title: '6. Actualizaciones',
    paragraphs: [
      'Actualizaremos esta política cuando incorporemos nuevas cookies. La fecha de revisión figura al inicio del documento.',
      'Dudas: ' + LEGAL_ENTITY.email + '.'
    ]
  }
];
