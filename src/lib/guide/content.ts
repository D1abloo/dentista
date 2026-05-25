import type { GuideSection } from '@/lib/guide/types';

export type { GuideScreenshot, GuideStep, GuideSection } from '@/lib/guide/types';

const mobile = (name: string) => `/images/guides/mobile/${name}.png`;

export const patientGuideSections: GuideSection[] = [
  {
    id: 'acceso',
    title: 'Acceso al portal del paciente',
    summary: 'Entra con el email que te dio la clínica; el sistema te reconoce y abre tu espacio personal.',
    goal: 'Iniciar sesión de forma segura y llegar al inicio del portal sin confusiones entre paciente y personal.',
    audience: 'Pacientes con cuenta activada por la clínica.',
    prerequisites: [
      'Registro obligatorio en /registro-paciente con DNI, teléfono y clínica.',
      'Activación de la cuenta desde el correo que recibirás (enlace válido 48 h).',
      'Navegador actualizado en móvil o ordenador.'
    ],
    screenshots: [
      {
        src: mobile('pdp-inicio'),
        alt: 'Inicio del portal del paciente en móvil',
        caption: 'Tras el login verás el inicio con la próxima cita, avisos y accesos rápidos.'
      }
    ],
    steps: [
      {
        title: 'Regístrate como paciente',
        detail: 'En /registro-paciente: nombre, DNI, email, teléfono, clínica y contraseña.',
        shot: 'pdp-inicio'
      },
      {
        title: 'Activa tu cuenta por correo',
        detail: 'Abre el email «Activa tu cuenta» (48 h). Sin activación no podrás entrar.',
        shot: 'pdp-inicio'
      },
      {
        title: 'Inicia sesión',
        detail: 'En /login introduce email y contraseña. Te lleva al portal automáticamente.',
        shot: 'pdp-inicio'
      },
      {
        title: 'Revisa el inicio',
        detail: 'Citas próximas, facturas, informes y mensajes en un solo panel.',
        shot: 'pdp-inicio'
      }
    ],
    tips: ['Guarda la web en la pantalla de inicio del móvil para abrirla como una app.', 'Cierra sesión en tablets compartidas de la clínica.'],
    related: [{ label: 'Reservar cita', href: '/reserva' }]
  },
  {
    id: 'citas',
    title: 'Mis citas y reservas',
    summary: 'Consulta CIT-XXXX, estados (confirmada, pendiente, cancelada) y pide nuevos huecos.',
    goal: 'Saber en todo momento cuándo es tu próxima visita y qué puedes hacer si necesitas cambiarla.',
    audience: 'Pacientes que ya tienen al menos una cita registrada.',
    screenshots: [
      {
        src: mobile('pdp-citas'),
        alt: 'Listado de citas en móvil',
        caption: 'Cada tarjeta muestra fecha, hora, profesional, tratamiento y sede.'
      },
      {
        src: mobile('pdp-inicio'),
        alt: 'Resumen de próxima cita',
        caption: 'Desde Inicio accedes rápido a la siguiente cita confirmada.'
      }
    ],
    steps: [
      {
        title: 'Abre Mis citas',
        detail: 'Menú → Mis citas. Próximas arriba; historial abajo.',
        shot: 'pdp-citas'
      },
      {
        title: 'Interpreta el estado',
        detail: 'Confirmada · Pendiente · Cancelada — cada tarjeta lo indica con color.',
        shot: 'pdp-citas'
      },
      {
        title: 'Reserva un nuevo hueco',
        detail: 'Desde Reservar eliges tratamiento, dentista y hora libre.',
        shot: 'pdp-inicio'
      }
    ],
    warnings: ['La cancelación online puede tener plazo mínimo (p. ej. 24 h); revisa la normativa de tu clínica.']
  },
  {
    id: 'informes',
    title: 'Informes clínicos',
    summary: 'PDFs compartidos por tu dentista: resultados, planes de tratamiento y notas de evolución.',
    goal: 'Localizar y abrir informes autorizados sin depender de papel o email suelto.',
    audience: 'Pacientes con informes publicados por la clínica.',
    screenshots: [
      {
        src: mobile('pdp-informes'),
        alt: 'Informes clínicos en móvil',
        caption: 'Listado con fecha, tipo y botón para ver el PDF.'
      }
    ],
    steps: [
      { title: 'Entra en Informes', detail: 'Solo lo publicado por tu clínica.', shot: 'pdp-informes' },
      { title: 'Abre el PDF', detail: 'Pulsa el informe para leer o descargar.', shot: 'pdp-informes' },
      { title: 'Historial', detail: 'Los más recientes aparecen primero.', shot: 'pdp-informes' }
    ],
    tips: ['Descarga copias importantes para tu archivo personal si lo necesitas.']
  },
  {
    id: 'documentos',
    title: 'Documentos e imágenes',
    summary: 'Radiografías, fotografías intraorales y archivos adjuntos a tu ficha.',
    goal: 'Acceder a material diagnóstico que la clínica ha subido a tu expediente digital.',
    audience: 'Pacientes con documentos publicados en el portal.',
    screenshots: [
      {
        src: mobile('pdp-documentos'),
        alt: 'Documentos del paciente en móvil',
        caption: 'Miniaturas y tipo de archivo (RX, foto, otro).'
      }
    ],
    steps: [
      { title: 'Abre Documentos', detail: 'RX, fotos y archivos de tu ficha.', shot: 'pdp-documentos' },
      { title: 'Visualiza el archivo', detail: 'Toca para ampliar o compartir.', shot: 'pdp-documentos' },
      { title: 'Novedades en Inicio', detail: 'El inicio avisa si hay archivos nuevos.', shot: 'pdp-inicio' }
    ]
  },
  {
    id: 'facturas',
    title: 'Facturas y pagos',
    summary: 'Facturas FAC-XXXX, estados de cobro y recibos PAG-XXXX en un solo flujo.',
    goal: 'Controlar qué debes, qué está pagado y descargar justificantes oficiales.',
    audience: 'Pacientes con facturación activa en la clínica.',
    screenshots: [
      {
        src: mobile('pdp-facturas'),
        alt: 'Facturas del paciente en móvil',
        caption: 'Importe, estado y enlace al PDF de cada factura.'
      },
      {
        src: mobile('pdp-pagos'),
        alt: 'Historial de pagos en móvil',
        caption: 'Pagos vinculados a facturas con referencia PAG-XXXX.'
      }
    ],
    steps: [
      { title: 'Revisa Facturas', detail: 'Estado, importe y PDF de cada FAC-XXXX.', shot: 'pdp-facturas' },
      { title: 'Descarga el PDF', detail: 'Datos fiscales y conceptos en el documento.', shot: 'pdp-facturas' },
      { title: 'Consulta Pagos', detail: 'Historial PAG-XXXX vinculado a facturas.', shot: 'pdp-pagos' }
    ],
    warnings: ['Los pagos online solo aparecen si tu clínica los tiene activados.']
  },
  {
    id: 'consentimientos',
    title: 'Consentimientos informados',
    summary: 'Firma digital de documentos obligatorios antes de ciertos tratamientos.',
    goal: 'Completar consentimientos pendientes sin ir físicamente a recepción.',
    audience: 'Pacientes con consentimientos asignados por la clínica.',
    screenshots: [
      {
        src: mobile('pdp-consentimientos'),
        alt: 'Consentimientos informados en el portal',
        caption: 'Lista de consentimientos pendientes y firmados.'
      },
      {
        src: mobile('pdp-inicio'),
        alt: 'Aviso en inicio',
        caption: 'El inicio puede avisar de documentos por firmar.'
      }
    ],
    steps: [
      { title: 'Abre Consentimientos', detail: 'Pendientes destacados en la lista.', shot: 'pdp-consentimientos' },
      { title: 'Firma o rechaza', detail: 'Queda registrado con fecha y hora.', shot: 'pdp-consentimientos' }
    ],
    tips: ['Puedes descargar una copia del consentimiento firmado si la clínica lo habilita.']
  }
];

export const adminGuideSections: GuideSection[] = [
  {
    id: 'panel',
    title: 'Panel administrativo',
    summary: 'Vista general con KPIs, citas del día y actividad reciente de la organización.',
    goal: 'Tener una foto instantánea de la operativa diaria antes de entrar en cada módulo.',
    audience: 'Administradores, recepción y dirección de clínica.',
    prerequisites: ['Sesión de personal con rol admin, recepción o dentista autorizado.', 'Sede seleccionada si hay multi-centro.'],
    screenshots: [
      {
        src: mobile('admin-dashboard'),
        alt: 'Dashboard administrativo en móvil',
        caption: 'KPIs de citas, ingresos, ocupación y listados rápidos.'
      }
    ],
    steps: [
      {
        title: 'Revisa los indicadores',
        detail: 'Citas hoy, pendientes de confirmar, facturas vencidas y ocupación estimada de la agenda.'
      },
      {
        title: 'Usa accesos rápidos',
        detail: 'Desde la barra superior entra al portal del paciente o vuelve al panel sin cerrar sesión.'
      },
      {
        title: 'Cambia de sede',
        detail: 'Si gestionas varias clínicas, el selector de sede filtra citas, pacientes y facturación.'
      }
    ],
    related: [{ label: 'Centro de ayuda completo', href: '/ayuda#panel-admin' }]
  },
  {
    id: 'agenda-citas',
    title: 'Agenda y citas',
    summary: 'Planificación día/semana/mes y gestión de estados CIT-XXXX.',
    goal: 'Organizar la agenda clínica y modificar citas sin solapamientos.',
    audience: 'Recepción y coordinadores de agenda.',
    screenshots: [
      {
        src: mobile('admin-agenda'),
        alt: 'Agenda clínica en móvil',
        caption: 'Vista día con huecos, bloqueos y colores por estado.'
      }
    ],
    steps: [
      {
        title: 'Selecciona vista y fecha',
        detail: 'Agenda permite día, semana o mes. Filtra por dentista o gabinete si es necesario.'
      },
      {
        title: 'Crea o mueve citas',
        detail: 'En Citas das de alta manualmente o cambias estado (confirmada, pendiente, cancelada).'
      },
      {
        title: 'Bloquea huecos',
        detail: 'Marca franjas no disponibles (comidas, mantenimiento) para que no se reserven online.'
      }
    ],
    tips: ['Los recordatorios automáticos se configuran en Configuración → Notificaciones.']
  },
  {
    id: 'pacientes-informes',
    title: 'Pacientes, informes y documentos',
    summary: 'Ficha PAT-XXXX unificada con historial, RX e informes PDF.',
    goal: 'Gestionar el expediente completo y decidir qué es visible en el portal del paciente.',
    audience: 'Personal clínico y administración.',
    screenshots: [
      {
        src: mobile('admin-pacientes'),
        alt: 'Listado de pacientes en móvil',
        caption: 'Búsqueda por nombre, DNI o ID PAT-XXXX.'
      },
      {
        src: mobile('pdp-informes'),
        alt: 'Vista paciente de informes',
        caption: 'Lo que publiques aquí será lo que el paciente ve en su móvil.'
      }
    ],
    steps: [
      {
        title: 'Busca al paciente',
        detail: 'En Pacientes localiza la ficha y abre el detalle con citas, informes y documentos vinculados.'
      },
      {
        title: 'Sube informes PDF',
        detail: 'Informes → nuevo: asigna paciente, categoría y comprueba la vista previa antes de guardar.'
      },
      {
        title: 'Controla visibilidad',
        detail: 'Documentos y consentimientos tienen interruptor de publicación al PdP; solo lo activo es visible fuera.'
      }
    ],
    warnings: ['No subas datos de otro paciente: el sistema aísla por clínica pero la revisión humana es obligatoria.']
  },
  {
    id: 'facturacion',
    title: 'Facturas, pagos y reportes',
    summary: 'Emisión FAC-XXXX, cobros PAG-XXXX y métricas de ingresos.',
    goal: 'Facturar tratamientos, registrar cobros y analizar ingresos por periodo.',
    audience: 'Administración y recepción con permiso de facturación.',
    screenshots: [
      {
        src: mobile('admin-facturas'),
        alt: 'Facturas en panel admin móvil',
        caption: 'Listado con estado, importe y acciones de PDF.'
      }
    ],
    steps: [
      {
        title: 'Emite facturas',
        detail: 'Vincula paciente y conceptos; la serie FAC-XXXX es configurable en Configuración.'
      },
      {
        title: 'Registra pagos',
        detail: 'En Pagos asocia cada cobro a su factura; el estado pasa a pagada automáticamente.'
      },
      {
        title: 'Consulta reportes',
        detail: 'Reportes muestra ingresos por rango de fechas y tratamientos más demandados.'
      }
    ],
    tips: ['El logo de clínica en facturas PDF se toma de Configuración → Logo.']
  },
  {
    id: 'portal-acceso',
    title: 'Acceso al portal del paciente (PdP)',
    summary: 'Entra al PdP como el paciente con token auditado o acceso rápido desde el panel.',
    goal: 'Revisar lo que ve el paciente (informes, citas, facturas) con trazabilidad legal.',
    audience: 'Dentistas y administradores autorizados.',
    screenshots: [
      {
        src: mobile('admin-acceso'),
        alt: 'Pantalla de tokens de acceso al PdP',
        caption: 'Generación de tokens, caducidad y registro de auditoría.'
      },
      {
        src: mobile('pdp-inicio'),
        alt: 'Portal paciente tras acceso autorizado',
        caption: 'Banner ámbar indicando acceso clínico supervisado.'
      }
    ],
    steps: [
      {
        title: 'Acceso rápido',
        detail: 'En la barra superior pulsa Portal del paciente: se crea sesión autorizada y abres /paciente al instante.'
      },
      {
        title: 'Token para otro profesional',
        detail: 'Acceso PdP → elige paciente y profesional → genera token con caducidad. Compártelo solo por canal seguro.'
      },
      {
        title: 'Vuelve al panel',
        detail: 'Usa Panel administrativo en el banner del PdP o en la barra superior para regresar sin cerrar la sesión de clínica.'
      }
    ],
    warnings: ['Todas las acciones en PdP con acceso autorizado quedan en el registro de auditoría.'],
    related: [{ label: 'Guía portal paciente', href: '/ayuda#portal-paciente' }]
  },
  {
    id: 'logo-marca',
    title: 'Logo y marca de la clínica',
    summary: 'Personaliza el escudo en el menú admin y en los PDF de factura.',
    goal: 'Mostrar la identidad de tu centro en el software y documentos oficiales.',
    audience: 'Administradores de clínica.',
    screenshots: [
      {
        src: mobile('admin-dashboard'),
        alt: 'Logo en barra lateral del panel',
        caption: 'El logo subido aparece redondo con brillo en la barra lateral.'
      }
    ],
    steps: [
      {
        title: 'Sube el logo',
        detail: 'Configuración → Logo de la clínica: PNG o JPG, fondo transparente recomendado (mín. 256×256).'
      },
      {
        title: 'Comprueba en el menú',
        detail: 'Tras guardar, recarga el panel: verás el escudo redondo en la parte superior del menú lateral.'
      },
      {
        title: 'Facturas PDF',
        detail: 'El mismo logo puede imprimirse en facturas si está activado en datos de facturación.'
      }
    ]
  }
];

export const platformGuideSections: GuideSection[] = [
  {
    id: 'plataforma-panel',
    title: 'Panel de plataforma',
    summary: 'Vista global de clínicas, suscripciones e incidencias del ecosistema Dentista+.',
    goal: 'Supervisar el estado de las organizaciones y actuar ante alertas operativas.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-dashboard'), alt: 'Panel plataforma', caption: 'Resumen de clínicas y métricas.' }],
    steps: [
      { title: 'Accede a /plataforma', detail: 'Inicia sesión con cuenta de administrador global.' },
      { title: 'Revisa KPIs', detail: 'Consulta clínicas activas, usuarios y estado de servicios.' }
    ]
  },
  {
    id: 'plataforma-clinicas',
    title: 'Clínicas y usuarios',
    summary: 'Alta de centros, invitaciones y roles de personal.',
    goal: 'Gestionar el ciclo de vida de clínicas y cuentas vinculadas.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-pacientes'), alt: 'Gestión de clínicas', caption: 'Listado y detalle de organizaciones.' }],
    steps: [
      { title: 'Organizaciones', detail: 'Crea o edita clínicas desde el módulo de plataforma.' },
      { title: 'Usuarios', detail: 'Asigna roles admin, recepción o dentista por centro.' }
    ]
  },
  {
    id: 'plataforma-seguridad',
    title: 'Seguridad y auditoría',
    summary: 'Registro de accesos, políticas y revisión de incidencias.',
    goal: 'Garantizar trazabilidad y cumplimiento en todo el SaaS.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-acceso'), alt: 'Auditoría', caption: 'Historial de accesos y tokens.' }],
    steps: [
      { title: 'Historial', detail: 'Consulta accesos al portal paciente y cambios sensibles.' },
      { title: 'Políticas', detail: 'Revisa contraseñas, caducidad y bloqueos de sesión.' }
    ],
    warnings: ['Las acciones de plataforma afectan a todas las clínicas: confirma antes de aplicar cambios globales.']
  },
  {
    id: 'plataforma-organizaciones',
    title: 'Organizaciones multi-sede',
    summary: 'Crea y gestiona organizaciones con varias clínicas bajo un mismo contacto administrativo.',
    goal: 'Estructurar redes de clínicas sin mezclar datos entre centros.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-dashboard'), alt: 'Organizaciones', caption: 'Vista de organizaciones y sedes.' }],
    steps: [
      { title: 'Nueva organización', detail: 'Define nombre, contacto y sedes desde Plataforma → Organizaciones.' },
      { title: 'Vincula clínicas', detail: 'Cada sede mantiene su clinic_id y aislamiento de datos.' }
    ]
  },
  {
    id: 'plataforma-suscripciones',
    title: 'Suscripciones',
    summary: 'Planes SaaS, facturación de la clínica y estado de la suscripción.',
    goal: 'Controlar el ciclo comercial de cada centro en la plataforma.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-dashboard'), alt: 'Suscripciones', caption: 'Estado de plan y renovaciones.' }],
    steps: [
      { title: 'Listado de suscripciones', detail: 'Filtra por plan, estado o clínica.' },
      { title: 'Cambios de plan', detail: 'Coordina upgrades con el equipo comercial antes de aplicar.' }
    ]
  },
  {
    id: 'plataforma-auditoria',
    title: 'Auditoría',
    summary: 'Historial de accesos, inspección de clínica y eventos sensibles.',
    goal: 'Revisar trazabilidad para cumplimiento y soporte.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-acceso'), alt: 'Auditoría', caption: 'Registro de acciones auditadas.' }],
    steps: [
      { title: 'Abre Auditoría', detail: 'Consulta eventos por clínica, usuario y tipo.' },
      { title: 'Exporta si aplica', detail: 'Descarga informes para revisiones internas.' }
    ]
  },
  {
    id: 'plataforma-monitor',
    title: 'Monitorización',
    summary: 'Estado de servicios, incidencias y métricas operativas del SaaS.',
    goal: 'Detectar problemas antes de que afecten a pacientes y clínicas.',
    audience: 'Administradores globales Dentista+.',
    screenshots: [{ src: mobile('admin-dashboard'), alt: 'Monitorización', caption: 'Panel de estado y alertas.' }],
    steps: [
      { title: 'Estado del servicio', detail: 'Revisa disponibilidad de APIs, correo y colas.' },
      { title: 'Incidencias abiertas', detail: 'Prioriza tickets vinculados a clínicas afectadas.' }
    ]
  }
];
