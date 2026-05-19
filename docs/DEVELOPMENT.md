# Desarrollo local

Este repositorio está pensado para trabajar en local o dentro de Codex con npm.

## Arranque

```bash
cp .env.example .env
npm install
npm run dev
```

## Sin Docker ni Kubernetes

No se usan contenedores para el flujo dev. Redis es opcional; cuando `REDIS_URL` está vacío, `src/lib/cache.ts` usa fallback en memoria.

## Guardar cambios en GitHub

```bash
npm run smoke
npm run git:save -- "feat: mensaje del cambio"
```

Repositorio: `https://github.com/D1abloo/dentista.git`.

## Checklist antes de push

- [ ] `npm run smoke`
- [ ] `npm run check` si las dependencias están instaladas.
- [ ] Revisar `/`, `/paciente`, `/reserva`, `/admin`.
- [ ] Confirmar que no hay secretos en `.env` versionados.
