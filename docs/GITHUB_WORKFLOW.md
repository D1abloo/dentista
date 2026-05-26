# Workflow GitHub

Repositorio objetivo: `https://github.com/D1abloo/dentista.git`.

## Guardar cada cambio

```bash
npm run smoke
npm run check          # recomendado antes de push
npm run git:save -- "feat: mensaje descriptivo"
```

Ejemplos de mensaje: `docs: actualizar documentación al estado actual`, `feat(ai-appointments): …`, `fix(admin): …`.

El script:

1. Inicializa Git si no existe.
2. Configura `origin` con el repo objetivo.
3. Usa la rama `main`.
4. Añade todos los cambios.
5. Crea commit.
6. Hace push.

## Variables opcionales

```bash
GITHUB_REMOTE_URL=https://github.com/D1abloo/dentista.git
GIT_BRANCH=main
```
