# CODEX_START_HERE

## Qué hacer primero

1. Ejecuta:

```bash
cp .env.example .env
npm install
npm run smoke
npm run dev
```

2. Verifica estas rutas:

- `/`
- `/login`
- `/paciente`
- `/paciente/reservar`
- `/paciente/citas`
- `/paciente/historial`
- `/paciente/perfil`
- `/paciente/pagos`
- `/paciente/mensajes`
- `/admin`
- `/admin/agenda`
- `/admin/citas`
- `/admin/pacientes`
- `/admin/dentistas`
- `/admin/tratamientos`
- `/admin/clinicas`
- `/admin/pagos`
- `/admin/reportes`
- `/admin/normativa`
- `/admin/configuracion`
- `/api/cache/health`
- `/api/treatments`
- `/api/dentists`
- `/api/locations`
- `/api/availability`
- `/api/admin/modules`
- `/api/notifications/appointment`

## Restricciones del proyecto

- Desarrollo local con `npm run dev`.
- Sin Docker.
- Sin Kubernetes.
- Redis es opcional en desarrollo; si `REDIS_URL` está vacío, usa cache en memoria.
- Mantener modo demo activo hasta que Supabase esté configurado.
- Para QA real usar modo LIVE (`PUBLIC_DEMO_MODE=false`) con `npm run seed:clinic`.
- El login demo en `/login` permite elegir rol `paciente` o `admin` y guarda el rol en `localStorage`.
- Los paneles usan datos demo persistidos en `localStorage`; no dependen de credenciales Supabase para funcionar en desarrollo.
- La app incluye PWA básica con `public/manifest.webmanifest`, `public/sw.js` e iconos SVG.
- El intervalo del calendario se gestiona desde `/admin/configuracion` y afecta a reserva de paciente y agenda admin.
- Las confirmaciones de cita usan `/api/notifications/appointment`: WhatsApp Cloud API de Meta y correo vía Resend si `.env` está configurado; si no, fallback mock.
- `/activar` activa el rol paciente en modo demo y lleva al panel de citas desde el enlace enviado.
- Toda API valida query o payload con Zod y devuelve `{ data, error, meta }`.
- `/admin` requiere rol demo `admin`; `/paciente` requiere rol demo `paciente`.
- `/` renderiza la landing pública Dentista+; la reserva completa vive en `/paciente/reservar`.
- Los endpoints de auth demo conservan credenciales ficticias: `admin@clinic.local / admin12345` y `maria@example.com / paciente123`.

## Verificación recomendada en LIVE

```bash
npm run check
npm run qa:db-security
npm run qa:live
```

## GitHub

Repositorio remoto objetivo:

```bash
https://github.com/D1abloo/dentista.git
```

Tras cada cambio:

```bash
npm run smoke
npm run git:save -- "feat: mensaje descriptivo"
```

## Siguiente tarea recomendada

Sustituir login demo por Supabase Auth con roles, añadir e2e de reserva/login y proveedores reales de notificación. No rompas el modo demo.
