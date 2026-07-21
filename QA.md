# QA - CENI para Vercel

Este repositorio es el clon adaptado para Vercel. La validacion completa debe correrse con dependencias instaladas y variables de entorno reales.

## Comandos

```bash
npm install
npm run lint
npm test
npm run test:e2e
npm run build
```

## Validacion requerida antes de produccion

- `DATABASE_URL` apunta a PostgreSQL administrado.
- `AUTH_SECRET` es aleatorio y esta configurado en Vercel.
- `STORAGE_DRIVER=vercel-blob`.
- `BLOB_READ_WRITE_TOKEN` pertenece al store Blob de produccion.
- `NEXT_PUBLIC_SITE_URL` y `SITE_URL` apuntan al dominio final.
- `GET /api/health` responde 200 despues de migraciones.
- Subida, descarga y borrado de evidencias funcionan desde el panel.

## Nota

En este entorno local no se pudo ejecutar `npm install` porque la red hacia npm esta bloqueada. La validacion de build debe hacerse en Vercel o en una maquina con acceso a npm.
