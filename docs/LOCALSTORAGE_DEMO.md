# Persistencia demo en localStorage

> **Solo desarrollo** (`PUBLIC_DEMO_MODE=true`). En producción y para el **asistente IA** (`/citas-con-ia`) los huecos y citas reales vienen de Supabase; este modo no sustituye la BD.

## Claves

| Clave | Contenido |
|-------|-----------|
| `dentista_demo_v4` | Estado JSON completo (`DemoState`) |
| `dentista_role` | `"paciente"` \| `"admin"` |
| `dentista_patient_id` | Ej. `PAT-0001` |
| `dentista_tenant_id` | Ej. `TEN-0001` (solo admin) |
| `dentista_cookies` | `"accepted"` \| `"rejected"` \| `"configured"` |

Definidas en `src/lib/storage/keys.ts`.

## Sesión tras login

```json
{
  "role": "paciente",
  "patientId": "PAT-0001"
}
```

```json
{
  "role": "admin",
  "tenantId": "TEN-0001"
}
```

`setDemoSession()` en `src/lib/demoStore.ts` escribe las claves anteriores.

## Semilla inicial

`src/data/demoData.ts` exporta `demoState` con:

- 3 tenants (Centro, Norte, Sur)
- Pacientes **PAT-0001** (portal), **PAT-0002** y **PAT-0003** (agenda admin)
- 20 citas, 9 informes, 9 facturas, 11 documentos y 6 consentimientos con PDF en `public/demo/`
- Archivos estáticos: `prueba/`, `facturas/`, `documentos/`, `consentimientos/`, `informes/` (`npm run seed:demo-assets`)

Al primer arranque se hidrata desde la semilla si no hay estado guardado.

## Crear registros

Las funciones `createAppointment`, `createTreatment`, `createDentist`, etc. en `demoStore.ts` asignan:

- `tenantId` desde `getStoredTenantId()` (admin activo)
- IDs secuenciales (`CIT-0004`, `FAC-0003`, …)

## Resetear demo

En el navegador: DevTools → Application → Local Storage → borrar claves `dentista_*` y recargar.

O desde consola:

```javascript
Object.keys(localStorage).filter(k => k.startsWith('dentista_')).forEach(k => localStorage.removeItem(k));
location.reload();
```

## Migración de versión

Si cambia la estructura, actualiza `STORAGE_STATE` en `demoData.ts` (actualmente `dentista_demo_v4`) para forzar nueva semilla en clientes antiguos.
