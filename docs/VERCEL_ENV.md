# Variables de entorno en Vercel

No subas `.env` al repositorio. Copia cada clave en **Vercel → Project → Settings → Environment Variables** (entorno **Production** y, si aplica, **Preview**).

## Entrada oculta al panel clínica

Tras configurar `ADMIN_PANEL_ENTRY_SLUG` y `ADMIN_PANEL_ENTRY_SECRET` en Vercel:

- URL de acceso (no enlazar en la web pública): `https://dentista.vercel.app/entrada/{ADMIN_PANEL_ENTRY_SLUG}`
- El slug actual está en tu `.env` local (`ADMIN_PANEL_ENTRY_SLUG`).

## Obligatorias (Production)

| Variable | Notas |
|----------|--------|
| `AUTH_SESSION_SECRET` | 32+ caracteres aleatorios; **Sensitive** |
| `PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role; **Sensitive**; solo servidor |
| `PUBLIC_APP_URL` | `https://dentista.vercel.app` |
| `PUBLIC_DEMO_MODE` | `false` |
| `ADMIN_PANEL_ENTRY_SLUG` | Slug URL-safe (ver tu `.env`) |
| `ADMIN_PANEL_ENTRY_SECRET` | Secreto HMAC; **Sensitive** |
| `SUPER_ADMIN_EMAIL` | Login `/platform/login` |
| `SUPER_ADMIN_PASSWORD` | **Sensitive** |
| `CLINIC_DEFAULT_PASSWORD` | Contraseña inicial al aprobar clínicas; **Sensitive** |
| `SUPER_ADMIN_NAME` | Opcional (nombre mostrado) |

## Públicas / contacto

| Variable | Ejemplo |
|----------|---------|
| `PUBLIC_APP_NAME` | `DentalFlow` |
| `PUBLIC_CONTACT_EMAIL` | Email de soporte |
| `PUBLIC_CONTACT_PHONE` | Opcional |
| `PUBLIC_CONTACT_HOURS` | Opcional |
| `PUBLIC_CONTACT_SLA` | Opcional |
| `PUBLIC_WHATSAPP_URL` | Opcional |

## Email (SMTP — como en local si `EMAIL_PROVIDER=smtp`)

| Variable |
|----------|
| `EMAIL_PROVIDER` |
| `SMTP_HOST` |
| `SMTP_PORT` |
| `SMTP_SECURE` |
| `SMTP_USER` |
| `SMTP_PASS` (**Sensitive**) |
| `SMTP_FROM` |
| `CONTACT_NOTIFY_EMAIL` |
| `EMAIL_FROM` (si usas Resend más adelante) |

## Opcionales

| Variable | Si vacío |
|----------|----------|
| `REDIS_URL` | Cache en memoria |
| `CACHE_TTL_SECONDS` | `60` |
| `STRIPE_SECRET_KEY` | Sin Stripe |
| `STRIPE_WEBHOOK_SECRET` | Sin webhooks Stripe |
| `RESEND_API_KEY` | No Resend |
| `WHATSAPP_PROVIDER` | `mock` (o `vercel.json`) |
| `SMS_PROVIDER` | `mock` |

## Importación rápida con CLI

Desde la raíz del proyecto (con [Vercel CLI](https://vercel.com/docs/cli) instalada y `vercel link`):

```bash
# Ver qué falta en el proyecto remoto (no commitear salida)
node scripts/vercel-env-from-dotenv.mjs --check

# Subir todas las claves del .env a Production (pide confirmación por clave)
node scripts/vercel-env-from-dotenv.mjs --push production
```

Marca manualmente como **Sensitive** en el dashboard:  
`AUTH_SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PANEL_ENTRY_SECRET`, `SUPER_ADMIN_PASSWORD`, `CLINIC_DEFAULT_PASSWORD`, `SMTP_PASS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`.

## Tras cambiar variables

1. **Deployments → Redeploy** (desactivar *Use existing Build Cache*).
2. Probar: `/`, `/login/admin`, `/admin`, `/platform/login`, `/portal-paciente`.
3. Probar entrada oculta: `/entrada/{tu-slug}`.

## Seguridad

- Rota `ADMIN_PANEL_ENTRY_SECRET` y `AUTH_SESSION_SECRET` si alguna vez se filtraron.
- No compartas el slug de entrada en la landing pública; solo personal autorizado.
