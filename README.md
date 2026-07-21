# CENI para Vercel

Clon de la plataforma **CENI - Certificación de Entornos Neuroinclusivos** preparado para desplegarse en Vercel.

## Stack

- Next.js 15 App Router
- Auth.js / NextAuth v5 con credenciales
- Prisma + PostgreSQL
- Vercel Blob para evidencias en producción
- MapLibre + OpenStreetMap
- Vitest y Playwright

## Diferencias contra la versión AWS

- No usa `docker-compose` para producción.
- La base de datos debe ser PostgreSQL administrado: Neon, Prisma Postgres, Supabase o RDS externo.
- Las evidencias no se guardan en disco persistente; en Vercel se guardan en Blob.
- El build ejecuta `prisma generate` antes de `next build`.

## Variables de entorno en Vercel

Configura estas variables en el proyecto de Vercel:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_TRUST_HOST="true"
SITE_URL="https://tu-dominio"
NEXT_PUBLIC_SITE_URL="https://tu-dominio"
NEXT_PUBLIC_TILE_URL="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
STORAGE_DRIVER="vercel-blob"
BLOB_READ_WRITE_TOKEN="..."
SEED_DEMO_DATA="false"
SEED_ADMIN_EMAIL="admin@tu-dominio"
SEED_ADMIN_PASSWORD="..."
```

Para generar `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Despliegue

1. Importa este repositorio en Vercel.
2. Agrega una base PostgreSQL administrada y copia su `DATABASE_URL`.
3. Crea un store de Vercel Blob y agrega `BLOB_READ_WRITE_TOKEN`.
4. Configura las variables anteriores.
5. Despliega desde Vercel.

Después del primer deploy, corre las migraciones y el seed:

```bash
npm run db:migrate
npm run db:seed
```

Si usas Vercel CLI:

```bash
vercel env pull .env.local
npm install
npm run db:migrate
npm run db:seed
vercel --prod
```

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Para desarrollo local, puedes usar almacenamiento en disco:

```bash
STORAGE_DRIVER="local"
UPLOAD_DIR="./data/uploads"
```

## Notas operativas

- En Vercel, `STORAGE_DRIVER` debe ser `vercel-blob`.
- No subas `.env`, llaves `.pem`, ni respaldos de base de datos.
- `GET /api/health` valida conectividad básica con la base de datos.
