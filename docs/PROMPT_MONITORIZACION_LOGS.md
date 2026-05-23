# Prompt: Sistema de logs y monitorización — Dentista+

Documento de referencia funcional (especificación). Implementación en código: `src/lib/audit/`, migración `0030_audit_monitoring_system.sql`, paneles `/platform/auditoria` y `/admin/monitorizacion`.

## Objetivo

Registrar de forma centralizada eventos de uso, seguridad, errores, inicios de sesión, cambios de datos, acciones sensibles y actividad por usuario, clínica, tenant y paciente. Sistema consultable desde Plataforma (Super Admin) y panel clínica (alcance limitado).

## Áreas instrumentadas

Landing · Login plataforma/clínica/paciente · Paneles · Supabase · Storage · API · Formularios · Descargas · Errores · Acciones sensibles

## Tipos de registro

1. **Autenticación** — login ok/fallo, logout, reset password, sesión, acceso denegado  
2. **Actividad** — CRUD pacientes, citas, informes, documentos, facturas, pagos, consentimientos, mensajes  
3. **Seguridad** — cross-tenant, RLS, permisos, tokens, descargas bloqueadas (severidad bajo→crítico)  
4. **Errores** — API, BBDD, storage, PDF, pagos (stack solo interno)  
5. **Monitorización** — métricas agregadas por módulo y clínica  
6. **Supabase** — tablas `audit_logs`, `login_events`  
7. **RLS** — inmutables en UI; inserción solo servicios autorizados  
8. **Plataforma** — KPIs, filtros, detalle, exportación, alertas críticas  
9. **Clínica** — vista filtrada por `clinic_id`  
10. **Notificaciones** — umbrales (p. ej. 5 logins fallidos / 10 min)  
11. **Frontend** — `logClientEvent()` sin `console.log` en producción  
12. **Backend** — logs server-side obligatorios en acciones sensibles  
13. **Descargas** — PDF informe, documento, factura, recibo, CSV  
14. **Sesiones** — `login_events` con dispositivo e IP  
15. **Técnica** — errores JS, tiempo de respuesta (extensible)  
16. **Retención** — 30/90/365 días  
17. **Exportación** — genera `audit.exported`

## event_type (ejemplos)

`auth.login_success`, `auth.login_failed`, `patient.created`, `appointment.cancelled`, `report.downloaded`, `security.cross_tenant_attempt`, `security.rls_blocked`, `error.api`, `audit.exported`

## Criterios de aceptación

- Cada login y acción sensible genera log  
- Super Admin ve logs globales; admin clínica solo su clínica  
- Pacientes no acceden a logs  
- Sin PHI completo ni secretos en metadata  
- RLS protege tablas  
- Filtros y exportación operativos  
