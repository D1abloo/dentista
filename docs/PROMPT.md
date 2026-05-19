# Prompt maestro para Codex

Eres un agente senior full-stack. Trabaja sobre este repositorio para terminar DentalFlow, una app SaaS premium para clínicas dentales.

## Contexto de producto

DentalFlow permite a pacientes reservar, confirmar, reprogramar y consultar citas dentales. Permite a administradores gestionar agenda, pacientes, dentistas, gabinetes, tratamientos, facturación, pagos, recordatorios, campañas, roles, auditoría, reportes e integraciones.

## Stack obligatorio

- Astro SSR.
- React para UI interactiva.
- Supabase para auth, PostgreSQL, RLS y storage.
- Redis cache.
- Tailwind CSS.
- TypeScript estricto.

## Entregables prioritarios

1. Persistencia real Supabase para citas, pacientes, tratamientos, odontólogos y gabinetes.
2. Auth con roles: paciente, recepcionista, dentista, admin, owner.
3. Panel admin operativo con filtros, CRUD y métricas cacheadas.
4. Portal paciente con reserva, historial, pagos, mensajes y soporte.
5. Recordatorios mock reemplazables por WhatsApp/email/SMS.
6. Tests unitarios/e2e básicos.
7. Documentación actualizada.

## Criterios UX

- Diseño premium, limpio y profesional.
- Mobile-first y responsive 100%.
- Estados vacíos, loading, error y success.
- Accesibilidad: labels, contraste, focus states.
- Mensajes en español.

## Criterios backend

- Nunca confiar en payload del cliente.
- Validar con Zod.
- Usar `clinic_id` en todas las entidades multi-tenant.
- Aplicar RLS.
- Cachear solo datos no sensibles o agregados.
- Invalidar cache al crear/editar/cancelar citas.

## Primeras tareas recomendadas

1. Ejecuta `npm run smoke`.
2. Instala dependencias y corrige incompatibilidades si aparecen.
3. Implementa tests mínimos.
4. Conecta endpoints a Supabase cuando `.env` no esté en modo demo.
5. Crea pantallas CRUD completas para admin.
