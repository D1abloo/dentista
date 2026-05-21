export type GuideScreenshot = {
  src: string;
  alt: string;
  caption: string;
};

export type GuideStep = {
  title: string;
  detail: string;
};

export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  goal: string;
  audience: string;
  prerequisites?: string[];
  screenshots: GuideScreenshot[];
  steps: GuideStep[];
  tips?: string[];
  warnings?: string[];
  related?: { label: string; href: string }[];
};

const mobile = (name: string) => `/images/guides/mobile/${name}.png`;

export const patientGuideSections: GuideSection[] = [
  {
    id: 'acceso',
    title: 'Acceso al portal del paciente',
    summary: 'Entra con el email que te dio la clínica; el sistema te reconoce y abre tu espacio personal.',
    goal: 'Iniciar sesión de forma segura y llegar al inicio del portal sin confusiones entre paciente y personal.',
    audience: 'Pacientes con cuenta activada por la clínica.',
    prerequisites: ['Email y contraseña facilitados por recepción o correo de bienvenida.', 'Navegador actualizado en móvil o ordenador.'],
    screenshots: [
      {
        src: mobile('pdp-inicio'),
        alt: 'Inicio del portal del paciente en móvil',
        caption: 'Tras el login verás el inicio con la próxima cita, avisos y accesos rápidos.'
      }
    ],
    steps: [
      {
        title: 'Abre Iniciar sesión',
        detail: 'Desde la web pública pulsa Iniciar sesión e introduce tu email y contraseña. No necesitas elegir tipo de usuario.'
      },
      {
        title: 'Completa el primer acceso',
        detail: 'Si la clínica te envió una contraseña temporal, el sistema te pedirá cambiarla antes de continuar.'
      },
      {
        title: 'Revisa el inicio',
        detail: 'En Inicio aparecen citas próximas, facturas pendientes, informes recientes y mensajes sin leer.'
      }
    ],
    tips: ['Guarda la web en la pantalla de inicio del móvil para abrirla como una app.', 'Cierra sesión en tablets compartidas de la clínica.'],
    related: [{ label: 'Reservar cita sin cuenta', href: '/reserva' }]
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
        detail: 'En el menú inferior o lateral entra en Mis citas. Las próximas aparecen primero; el historial queda al final.'
      },
      {
        title: 'Interpreta el estado',
        detail: 'Confirmada: asiste en la hora indicada. Pendiente: espera confirmación de la clínica. Cancelada: ya no está activa.'
      },
      {
        title: 'Reserva un nuevo hueco',
        detail: 'Usa Reservar en el menú para elegir clínica, tratamiento, dentista y franja libre en el calendario.'
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
      {
        title: 'Entra en Informes',
        detail: 'Solo verás documentos que tu clínica haya marcado como visibles para ti.'
      },
      {
        title: 'Abre la vista previa',
        detail: 'Pulsa el informe para leerlo en el navegador o descargarlo según tu dispositivo.'
      },
      {
        title: 'Consulta el historial',
        detail: 'Los más recientes aparecen arriba; usa la búsqueda si tienes muchos registros.'
      }
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
      {
        title: 'Abre Documentos',
        detail: 'Filtra mentalmente por tipo: las RX suelen ir en categoría radiografía.'
      },
      {
        title: 'Visualiza el archivo',
        detail: 'Toca el documento para ampliar. En móvil puedes compartir o guardar con las opciones del sistema.'
      },
      {
        title: 'Revisa novedades desde Inicio',
        detail: 'El panel de inicio avisa cuando hay documentos nuevos desde tu última visita.'
      }
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
      {
        title: 'Revisa Facturas',
        detail: 'Pendiente: aún no cobrada. Pagada: liquidada. Vencida: requiere atención; contacta con recepción.'
      },
      {
        title: 'Descarga el PDF',
        detail: 'Cada factura incluye datos fiscales de la clínica y desglose de conceptos.'
      },
      {
        title: 'Consulta Pagos',
        detail: 'En Pagos verás el historial de cobros y su relación con la factura correspondiente.'
      }
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
        src: mobile('pdp-inicio'),
        alt: 'Aviso de consentimiento pendiente',
        caption: 'El inicio puede mostrar alertas de documentos por firmar.'
      }
    ],
    steps: [
      {
        title: 'Entra en Consentimientos',
        detail: 'Los pendientes se destacan; léelos completos antes de aceptar.'
      },
      {
        title: 'Firma o rechaza',
        detail: 'Tu decisión queda registrada con fecha y hora. Si tienes dudas, contacta con la clínica antes de firmar.'
      }
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
