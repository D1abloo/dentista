# Matriz QA E2E — Dentista+

Última revisión: 2026-05-23.  
Scripts: `npm run qa:audit` (estructura) · `npm run qa:live` (E2E API en vivo) · `npm run test:unit`

## Leyenda de estado

| Estado | Significado |
|--------|-------------|
| **PASS-C** | Verificado en código / auditoría estática / script |
| **PASS-L** | Verificado en entorno live con credenciales |
| **MANUAL** | Requiere prueba manual en Supabase + navegador |
| **FIX** | Corregido en esta revisión |

## Resumen ejecutivo

| Área | Resultado |
|------|-----------|
| Aislamiento API (clinic/tenant/patient) | **FIX** — guards en pacientes, citas, métricas, facturación, notificaciones |
| RLS Supabase | **FIX** — migración `0028_rls_records_gaps.sql` |
| Bloqueos agenda | **FIX** — inserción robusta + fin de tramo válido |
| Multi-sede UI | **PASS-C** — `useActiveClinic` + `ClinicBranchSwitcher` |
| E2E API live (auth, agenda, plataforma) | **PASS-L** — ver `docs/QA_E2E_LIVE_RESULTS.json` |
| E2E datos reales multi-org | **MANUAL** — crear Mediterráneo + 3 clínicas en UI |

## Matriz por módulo

| Módulo | Prueba | Usuario | Esperado | Obtenido | Estado | Corrección |
|--------|--------|---------|----------|----------|--------|------------|
| Plataforma | Crear org multi-sede | Super Admin | 2+ sedes, tenant, admin | — | MANUAL | — |
| Plataforma | Aislamiento orgs | Super Admin | Sin PHI cruzado | Metadatos vía `platform/*` | PASS-C | — |
| Clínica A/B | Admin no ve pacientes B | Admin A | 403 / lista vacía | `assertClinicScopeAsync` | PASS-C | `patients.ts`, guards |
| Paciente A/B | No ve informes B | Paciente A | Solo propios | Filtro `patientId` + RLS | PASS-C | `0028`, APIs records |
| Agenda | Crear / cancelar / reprogramar cita | Admin | Sincronía panel + PdP | — | MANUAL | `appointments.ts` async scope |
| Agenda | Bloquear horario Dr/Dra | Admin | Rojo en agenda + PdP | — | MANUAL | `scheduleBlocks.ts` |
| Agenda | Eliminar bloqueo (ids) | Admin | Eliminado en API + UI | `npm run qa:live` | PASS-L | `e2e-live-full.mjs` |
| Agenda | Eliminar bloqueo grupo | Admin | Grupo eliminado | — | MANUAL | `deleteScheduleBlockGroup` |
| Multi-sede | Cambiar sede activa | Admin org | Datos de sede B | `useActiveClinic` | PASS-C | `AdminAgenda`, switcher |
| PdP | Reservar sin slot ocupado | Paciente | 422 / no disponible | `isSlotBlocked` | PASS-C | `availability.ts` |
| Informes | Crear + visible PdP | Admin → Paciente | PDF en Mis informes | `assertReportPayloadScope` | PASS-C | `records.ts` |
| Documentos | Visible / interno | Admin → Paciente | Solo si visibility | RLS `patient_read_*` | PASS-C | `0028` |
| Facturas | Crear + PdP | Admin | Mis facturas | `patient_read_invoices` | PASS-C | `0028`, `invoice.ts` |
| Pagos | Vincular factura | Admin | Estado pagada | — | MANUAL | `billing` service |
| Consentimientos | Firmar PdP | Paciente | Estado firmado | RLS patient sign | PASS-C | `0028` |
| Mensajes | Bandeja sin cruce | Clínica / Paciente | Solo propios | `assertStaffOrOwnPatient` | PASS-C | `message.ts` API |
| Notificaciones | POST appointment | Anónimo | 401 | `requireStaffSession` | FIX | `notifications/appointment.ts` |
| Recordatorios | POST reminders | Staff otra sede | 403 | `assertClinicScopeAsync` | FIX | `reminders/send.ts` |
| Stripe checkout | Pago otro paciente | Paciente A | 403 | `assertOwnPatient` | FIX | `stripe-checkout.ts` |
| Auditoría | Eventos críticos | Sistema | Registro en audit | — | MANUAL | `platform/inspect` |
| Storage | Buckets sensibles | — | No públicos | Service role en API | PASS-C | Sin keys en cliente |

## Usuarios de prueba sugeridos

| Rol | Email sugerido | Panel |
|-----|----------------|-------|
| Super Admin | `SUPER_ADMIN_EMAIL` (.env) | `/platform` |
| Admin Clínica A | admin sede centro | `/admin` |
| Admin Clínica B | admin sede norte | `/admin` |
| Doctor A | dentista@… | `/admin` agenda propia |
| Paciente A | maria@… | `/paciente` |
| Paciente B | otro@… | `/paciente` |

Organización demo sugerida: **Grupo Dental Mediterráneo** (Centro + Norte).  
Clínicas independientes: Nova, Sonrisa, Horizonte.

## Supabase — migraciones aplicadas en repo

| Migración | Contenido |
|-----------|-----------|
| `0021_schedule_blocks.sql` | Tabla bloqueos |
| `0025` / `0026` | Multi-profesional |
| `0027_schedule_block_group.sql` | `block_group_id` |
| `0028_rls_records_gaps.sql` | RLS consentimientos, documentos, mensajes, pagos, facturas paciente |

**Aplicar en remoto:** `npm run db:migrate` o SQL Editor Supabase.

## Políticas RLS revisadas (`0028`)

- `informed_consents` — staff tenant + paciente read/sign
- `patient_documents` — staff + paciente read (visibility)
- `messages` — staff + paciente read
- `payments` — staff + paciente read
- `invoices` — paciente read (añadida)
- `schedule_blocks` — solo `is_clinic_staff()`
- `notification_jobs`, `stripe_checkout_sessions` — staff por `clinic_id`
- `clinical_reports` — super admin bypass

## Comandos de verificación

```bash
npm run smoke          # estructura
npm run check          # TypeScript + lint
npm run test:unit      # tests ligeros seguridad/agenda
npm run qa:audit       # auditoría + API live opcional
npm run build          # build producción
```

API live (servidor en marcha; Astro suele escuchar en `[::1]:4321`):

```bash
npm run dev
npm run qa:live
# Opcional paciente:
PATIENT_EMAIL=maria@... PATIENT_PASSWORD=... npm run qa:live
npm run qa:audit
```

Informe JSON: `docs/QA_E2E_LIVE_RESULTS.json`

## Pendiente manual (no automatizable sin entorno)

1. Crear org **Grupo Dental Mediterráneo** con 2 sedes en Plataforma.
2. Crear 3 clínicas independientes y verificar aislamiento en UI.
3. Flujo completo informe → PDF → descarga PdP.
4. Firma consentimiento con canvas en PdP.
5. Verificar buckets Storage en dashboard Supabase (privados + signed URLs).
6. Procesar webhook Stripe con firma real.

## Confirmación aislamiento

| Cruce | Mitigación |
|-------|------------|
| Paciente A → datos B | `assertOwnPatient`, filtros API, RLS |
| Clínica A → clínica B | `assertClinicScopeAsync`, `clinic_id` en queries |
| Staff → plataforma | `requireStaffSession` vs `requireSuperAdmin` |
| Service role en cliente | No expuesto — solo servidor |
