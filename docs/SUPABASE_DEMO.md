# Demo con datos en Supabase

Puedes usar **login demo** (paciente / admin por clínica) y guardar el estado completo en **PostgreSQL (Supabase)** en lugar de depender solo del `localStorage` de cada navegador.

## Cómo funciona

| Capa | Comportamiento |
|------|----------------|
| UI | Sigue igual: `/login` → rol demo, aislamiento por `tenantId` / `patientId` |
| `PUBLIC_DEMO_MODE` | `true` (no desactivar para este flujo) |
| Datos | Tabla `demo_app_state` (JSON) — una fila `scope = global` |
| API | `GET/PUT/DELETE /api/demo/state` |
| Cliente | Al abrir la app carga desde Supabase; cada cambio se sincroniza (debounce ~450 ms) |
| Caché local | `localStorage` sigue como respaldo si Supabase falla |

## 1. Supabase

1. Crea proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → ejecuta migraciones en orden (`0001` … `0007_demo_app_state.sql`).
3. **Authentication → URL Configuration**:
   - Site URL: `https://tu-app.vercel.app`
   - Redirect URLs: `https://tu-app.vercel.app/**`
4. **Settings → API** → copia URL, `anon` key y `service_role` key.

## 2. Variables en Vercel (o `.env`)

```env
PUBLIC_DEMO_MODE=true
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
AUTH_SESSION_SECRET=una-cadena-larga-aleatoria
```

La **service role** solo se usa en el servidor (API); no la expongas en el cliente.

## 3. Primera carga

Tras el deploy, la primera petición a `/api/demo/state` **inserta la semilla** (`demoData.ts`) si la tabla está vacía.

Puedes comprobar en Supabase → Table Editor → `demo_app_state` → fila `global` con JSON.

## 4. Restaurar semilla

`DELETE /api/demo/state` (o botón reset en la app si lo usas) vuelve a escribir la semilla en Supabase.

## 5. Pasar a producción real

Cuando quieras dejar el JSON y usar tablas normalizadas + RLS:

1. `PUBLIC_DEMO_MODE=false`
2. Migrar datos de `demo_app_state` a tablas `tenants`, `patients`, `appointments`, etc.
3. Auth Supabase real en lugar de selección de rol en `/login`

Ver `docs/MULTI_TENANT.md` y `supabase/migrations/0006_multi_tenant_rls.sql`.
