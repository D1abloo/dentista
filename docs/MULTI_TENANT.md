# Multi-tenant (multi-clínica)

## Modelo

Cada **tenant** representa un dentista o clínica independiente (`TEN-0001`, `TEN-0002`, …).

Los registros operativos llevan `tenantId`:

- Citas (`CIT-XXXX`)
- Informes (`INF-XXXX`)
- Documentos (`DOC-XXXX`)
- Facturas (`FAC-XXXX`)
- Pagos (`PAG-XXXX`)
- Dentistas, tratamientos, clínicas físicas asociadas al tenant

Los **pacientes** (`PAT-XXXX`) son globales: un mismo paciente puede visitar varios tenants.

## Filtrado en el frontend demo

```typescript
// Admin
records.filter((r) => r.tenantId === activeTenantId);

// Paciente
records.filter((r) => r.patientId === activePatientId);
// + informes: visibleToPatient === true
// + documentos: visibility === "paciente"
```

Implementación: `src/lib/tenant.ts` (`adminScope`, `patientScope`, `forTenant`, `forPatient`).

## Aislamiento admin

Un admin de Clínica Centro **nunca** debe ver citas, facturas o informes de Clínica Norte. Las listas del panel usan `useTenant()` → `adminScope`.

## Portal paciente unificado

El paciente agrupa por `patientId`:

- Próxima cita (cualquier clínica)
- Facturas pendientes de todos los tenants
- Informes con `visibleToPatient: true`
- Documentos con `visibility: "paciente"`

En las tarjetas se muestra la clínica de origen (`tenantName`).

## Supabase RLS (producción)

Políticas recomendadas:

1. **Admin/staff:** `tenant_id = auth.jwt() -> tenant_id` en SELECT/INSERT/UPDATE/DELETE
2. **Paciente:** `patient_id = auth.uid() mapeado a PAT` en SELECT; sin acceso a filas de otros pacientes
3. **Documentos:** paciente solo si `visibility = 'paciente'`
4. **Informes:** paciente solo si `visible_to_patient = true`

Migración de referencia: `supabase/migrations/0006_multi_tenant_rls.sql`.

## Cómo probar

1. `npm run dev`
2. `/login` → Admin Clínica Centro → revisar que solo aparecen datos `TEN-0001`
3. Cerrar sesión → Admin Clínica Norte → datos distintos
4. `/login` → Paciente PAT-0001 → ver citas/facturas de Centro y Norte juntas
