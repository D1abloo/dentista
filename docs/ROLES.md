# Roles y accesos (demo y producción)

## Roles en modo demo

| Rol | Clave `localStorage` | Destino tras login |
|-----|----------------------|-------------------|
| Paciente | `role: "paciente"`, `patientId: "PAT-0001"` | `/paciente` |
| Admin clínica | `role: "admin"`, `tenantId: "TEN-000x"` | `/admin` |

## Paciente

- Identificador global: **PAT-XXXX**
- Puede ver citas, informes visibles, documentos con `visibility: "paciente"`, facturas y pagos de **todas** las clínicas donde tenga historial
- **No** ve datos de otros pacientes
- Puede reservar citas, cancelar, reprogramar y editar su perfil (persistido en demo)

## Administrador de clínica

- Identificador de tenant: **TEN-XXXX** (una clínica demo por tenant)
- Solo gestiona registros con el mismo `tenantId`
- Puede crear citas, informes, documentos, facturas, pagos, dentistas y tratamientos **de su clínica**
- El banner del panel recuerda: «Estás gestionando únicamente esta clínica»

## Ejemplo multi-clínica

**María (PAT-0001)** tiene citas en Clínica Centro y Clínica Norte:

- Admin Centro (`TEN-0001`) ve solo registros de Centro
- Admin Norte (`TEN-0002`) ve solo registros de Norte
- María en `/paciente` ve **todo** lo suyo de ambas clínicas

## Producción (Supabase Auth)

En producción se mapearía:

- Usuario admin → `tenant_id` en JWT o tabla `profiles`
- Usuario paciente → `patient_id` global (puede vincularse a varios `tenant_id` vía citas)

Ver `docs/MULTI_TENANT.md` y `supabase/migrations/0006_multi_tenant_rls.sql`.
