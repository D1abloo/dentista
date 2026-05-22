# Módulo Ajustes — guía de implementación

## Ruta y acceso

- URL: `/admin/configuracion`
- Vista Astro: `src/pages/admin/configuracion.astro` → `AdminApp view="configuracion"`
- Componente: `src/components/admin/AdminSettings.tsx`
- Estilos: `src/styles/admin-settings.css`
- Lógica de formulario: `src/lib/settingsForm.ts`

## Layout (sin sidebar del módulo)

El shell admin oculta el topbar global cuando `settingsModule` está activo (`portal-body--settings-module`). El módulo define su propia cabecera con título, subtítulo y acciones Guardar / Descartar.

## Estructura de columnas

| Zona | Contenido |
|------|-----------|
| Izquierda | Pestañas horizontales + tarjetas de formulario según sección |
| Derecha (sticky) | Vista previa de marca + resumen de configuración |
| Inferior | Atajos rápidos + franja de consejo |
| Móvil | Barra fija Guardar / Descartar |

## Pestañas

`SETTINGS_TABS` en `settingsForm.ts`: General, Marca, Facturación, Portal paciente, Notificaciones, Seguridad, Integraciones, Copia de seguridad, Avanzado.

La pestaña **General** muestra: Datos de la clínica, Agenda, Contacto adicional y Marca.

## Estado y persistencia

- Estado local `form` vs `saved` (baseline tras guardar).
- `dirty` compara firmas JSON (`settingsSignature`).
- Guardar: `commit(saveSettings(state, tenantId, next))` en demo store.
- Logo: `POST /api/clinic/branding` (mismo flujo que `ClinicLogoUpload`).

## Validación (español)

Ver `validateSettings()` — mensajes según especificación del producto. Límite de textos: 200 caracteres (`MSG_LIMIT`).

## Variables CSS

`--set-primary` en `.set-module` se actualiza al elegir color de marca; afecta botones, chips activos y vista previa.

## Pruebas manuales

1. Abrir `/admin/configuracion` en desktop y móvil.
2. Editar campos, comprobar contadores y chips de días.
3. Cambiar color y pestañas de vista previa.
4. Subir logo &lt; 400 KB y formatos permitidos.
5. Guardar → badge «Cambios guardados»; Descartar restaura.
6. Salir con cambios sin guardar → aviso del navegador.
