# Usuarios y contraseñas de prueba — Dentista+

Listado maestro en texto: [DEMO_USUARIOS.txt](./DEMO_USUARIOS.txt)

> **Solo entorno de desarrollo / QA.** No uses estas credenciales en producción ni subas contraseñas reales de PRO a repositorios públicos.  
> Generado: 2026-05-23 · Fuente: Supabase Auth + seeds (`npm run seed:clinic`, `npm run seed:qa-mediterraneo`).

## Contraseña común de desarrollo

Todos los usuarios creados por los scripts de semilla comparten la misma contraseña definida en `.env`:

| Variable | Uso |
|----------|-----|
| `SUPER_ADMIN_PASSWORD` | Super Admin plataforma + mismo usuario si hace de admin |
| `CLINIC_DEFAULT_PASSWORD` | Pacientes seed, admin de clínicas nuevas, Mediterráneo |

**Valor actual en tu `.env` (ambas suelen coincidir):**

```
CambiaSuperAdmin2026!
```

Si el login falla, ejecuta de nuevo el seed para resetear Auth:

```bash
npm run seed:clinic
npm run seed:qa-mediterraneo
```

---

## Resumen rápido por panel

| Rol | Email | Contraseña | URL de acceso |
|-----|-------|------------|---------------|
| Super Admin | `admin@dentista.app` | Ver arriba | [/platform/login](http://localhost:4321/platform/login) |
| Admin clínica (Nova) | `admin@dentista.app` | Ver arriba | [/login/admin](http://localhost:4321/login/admin) |
| Admin Mediterráneo | `mediterraneo.admin@dentista.app` | Ver arriba | [/login/admin](http://localhost:4321/login/admin) |
| Paciente (María) | `maria.gonzalez@clinicadentalnova.es` | Ver arriba | [/login/paciente](http://localhost:4321/login/paciente) |
| Paciente (Carlos) | `carlos.ruiz@clinicadentalnova.es` | Ver arriba | [/login/paciente](http://localhost:4321/login/paciente) |
| Paciente (Ana) | `ana.torres@clinicadentalnova.es` | Ver arriba | [/login/paciente](http://localhost:4321/login/paciente) |
| Paciente (Lucía) | `lucia.mendez@clinicadentalnova.es` | Ver arriba | [/login/paciente](http://localhost:4321/login/paciente) |

---

## 1. Plataforma / Super Admin

| Campo | Valor |
|-------|--------|
| Email | `admin@dentista.app` |
| Contraseña | `CambiaSuperAdmin2026!` (desde `.env`) |
| Nombre | Administrador plataforma |
| Accesos | Plataforma `/platform`, panel clínica Nova, portal paciente (perfil demo) |
| Auth ID | `1ebb3d4d-4b3d-4bef-92c0-8adec9856321` |

**Pruebas sugeridas:** organizaciones, clínicas, registros, suscripciones, usuarios, aislamiento, auditoría.

---

## 2. Panel clínica — Clínica Dental Nova

| Campo | Valor |
|-------|--------|
| Clínica | Clínica Dental Nova |
| Slug | `clinica-dental-nova` |
| Clinic ID | `0858d185-af49-4734-8fa0-d858d4bac67e` |
| Tenant ID | `80e9a6b1-407f-4a73-9f48-e7582cf1fbc6` |

### Admin clínica

| Email | Contraseña | Rol |
|-------|------------|-----|
| `admin@dentista.app` | `CambiaSuperAdmin2026!` | `clinic_admin` |

Acceso directo: `/login/admin?email=admin@dentista.app`

---

## 3. Panel clínica — Grupo Mediterráneo (clínicas independientes)

Cada sede tiene **su propio tenant** (aislamiento total).

| Sede | Slug | Clinic ID |
|------|------|-----------|
| Mediterráneo Centro | `mediterraneo-centro` | `d997ad60-210e-422f-aa64-6089ae5ce6c4` |
| Mediterráneo Norte | `mediterraneo-norte` | `2998eb98-544f-461d-8f60-4b4c41f2b5ad` |

### Admin (perfiles en ambas sedes)

| Email | Contraseña | Rol |
|-------|------------|-----|
| `mediterraneo.admin@dentista.app` | `CambiaSuperAdmin2026!` | `clinic_admin` |

Acceso directo: `/login/admin?email=mediterraneo.admin@dentista.app`  
Tras login, usa el selector de clínica si tienes varias asignadas.

---

## 4. Portal del paciente — Clínica Nova

Todos con la misma contraseña de `.env`. Deben tener `activated_at` en perfil (el seed lo configura).

| Nombre | Email | Patient / profile |
|--------|-------|-------------------|
| María González | `maria.gonzalez@clinicadentalnova.es` | `5e2a1f16…` (vinculado a Nova) |
| Carlos Ruiz | `carlos.ruiz@clinicadentalnova.es` | Paciente Nova |
| Ana Torres | `ana.torres@clinicadentalnova.es` | Paciente Nova |
| Lucía Méndez | `lucia.mendez@clinicadentalnova.es` | Paciente Nova |

**Contraseña:** `CambiaSuperAdmin2026!`

Acceso directo: `/login/paciente?email=maria.gonzalez@clinicadentalnova.es`

**Pruebas E2E:** `PATIENT_EMAIL=maria.gonzalez@clinicadentalnova.es npm run qa:live`

---

## 5. Usuario dual admin + paciente (Nova)

`admin@dentista.app` tiene **dos perfiles** en la misma cuenta Auth:

- **Clínica:** `/admin` → rol `clinic_admin`
- **Paciente:** `/paciente` → mismo email, elige portal “Paciente” si aparece selector

---

## 6. Clínicas en Supabase (referencia)

| Nombre | Estado | Notas |
|--------|--------|--------|
| Clínica Dental Nova | active | Principal para QA / E2E |
| Mediterráneo Centro | active | Tenant propio |
| Mediterráneo Norte | active | Tenant propio |
| Duplicados legacy `…-w1tr` / `…-w21o` | active | Pueden ignorarse o limpiarse en Plataforma |

Listar en vivo:

```bash
npm run users:clinics
npm run users:list
```

---

## 7. Crear usuarios nuevos

```bash
# Super Admin
npm run users -- add --email nuevo.super@dentista.app --password 'TuClave123!' \
  --name "Super QA" --access platform --permission execute

# Admin de clínica (sustituye UUID)
npm run users -- add --email admin@nueva-clinica.es --password 'TuClave123!' \
  --name "Admin Nueva" --access clinic --clinic-id <CLINIC_UUID> --role clinic_admin --permission execute

# Paciente
npm run users -- add --email paciente@ejemplo.es --password 'TuClave123!' \
  --name "Paciente Prueba" --access public --clinic-id <CLINIC_UUID> --role patient
```

---

## 8. Variables `.env` relacionadas

```env
SUPER_ADMIN_EMAIL=admin@dentista.app
SUPER_ADMIN_PASSWORD=CambiaSuperAdmin2026!
CLINIC_DEFAULT_PASSWORD=CambiaSuperAdmin2026!
PUBLIC_DEMO_MODE=false
```

---

## 9. Comandos útiles

```bash
npm run dev
npm run seed:clinic          # Nova + pacientes + admin@dentista.app
npm run seed:qa-mediterraneo # 2 clínicas independientes Mediterráneo
npm run users:list
npm run qa:live              # E2E API (servidor en marcha)
```

---

## Matriz de aislamiento (recordatorio)

| Usuario A | No debe ver datos de |
|-----------|----------------------|
| Paciente María | Paciente Carlos |
| Admin Nova | Pacientes de Mediterráneo (otro tenant) |
| Admin Mediterráneo Centro | Clínica Nova |
| Super Admin | Datos clínicos sensibles (solo metadatos en plataforma) |
