# Correo transaccional (Dentista+)

## Variables (Vercel / `.env`)

| Variable | Uso |
|----------|-----|
| `EMAIL_PROVIDER` | `auto` (recomendado), `smtp`, `resend` o `mock` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Hostinger: `smtp.hostinger.com`, `465`, `true` |
| `SMTP_USER`, `SMTP_PASS` | Cuenta remitente (ej. `info@estructuraweb.es`) |
| `SMTP_FROM` | Remitente visible |
| `CONTACT_NOTIFY_EMAIL` | Bandeja que recibe contacto y altas |
| `RESEND_API_KEY` | Alternativa si no usas SMTP |

Con `auto`, se usa SMTP si hay `SMTP_PASS`; si no, Resend si hay API key.

## Formularios que envían correo

- `/contacto` → notificación a `CONTACT_NOTIFY_EMAIL` + auto-respuesta al usuario
- `/registro-clinica` → notificación + confirmación al solicitante
- Aprobación de clínica y alta de usuarios admin → credenciales por correo
- Recordatorios / citas → canal email vía el mismo servicio

## Probar en local

```bash
node --env-file=.env scripts/test-email.mjs tu@email.com
```

## Producción (Vercel)

Añade en **Settings → Environment Variables** las mismas claves que en `.env.example`, sobre todo `SMTP_PASS` y `CONTACT_NOTIFY_EMAIL`.
