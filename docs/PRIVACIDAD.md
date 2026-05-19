# Privacidad y datos (Dentista+)

## Modo demo

En desarrollo y demo, los datos viven en **localStorage** del navegador. No se envían a servidores externos si `PUBLIC_DEMO_MODE=true`.

Claves principales:

- `dentista_demo_v4` — estado completo (citas, pacientes, facturas, etc.)
- `dentista_role`, `dentista_patient_id`, `dentista_tenant_id` — sesión
- `dentista_cookies` — preferencia del banner de cookies

## Separación por clínica (admin)

Cada administrador demo solo accede a registros de su `tenantId`. Esto simula el aislamiento que en producción aplicaría **Row Level Security (RLS)** en Supabase.

## Portal del paciente

El paciente solo ve registros ligados a su `patientId`. Los documentos internos (`visibility: "admin"`) y los informes no publicados no aparecen en `/paciente`.

## Cookies

El banner en el sitio público permite Aceptar, Rechazar o Configurar. Detalle en `/cookies`.

## Páginas legales

- `/privacidad` — tratamiento de datos en demo y producción
- `/terminos` — condiciones de uso
- `/cookies` — tipos de cookies y gestión

## Producción

Con Supabase:

- Autenticación real (email, OAuth, magic link)
- RLS por `tenant_id` y `patient_id`
- Sin almacenar secretos en el repositorio (usar `.env`)
- Cumplimiento RGPD: exportación, borrado y consentimiento informado (ver normativa editable en `/admin/normativa`)

## Aviso médico

La aplicación **no sustituye** el diagnóstico ni el criterio clínico de un profesional sanitario. Los textos demo son orientativos.
