# CHANGELOG — Plataforma CENI

Formato por hito, commits convencionales al cierre de cada uno.

## M7 — Preparación para despliegue (2026-07-13)

- Endpoint de salud `GET /api/health` (verifica BD; 200/503) + HEALTHCHECK
  en la imagen Docker.
- Seed apto para producción: datos demo solo con `SEED_DEMO_DATA="true"`;
  en producción siembra criterios, métricas y la cuenta ADMIN inicial.
- Build args `NEXT_PUBLIC_*` en Dockerfile/compose (los valores públicos se
  hornean en el bundle en build-time).
- Rate limit en el registro de organizaciones (5/min/IP) con mensaje
  literal.
- README: guía de despliegue en AWS EC2 (Graviton o x86, security groups,
  proxy con X-Forwarded-*, respaldos de volúmenes, opción RDS).

## M6 — Multi-establecimiento (2026-07-13)

- Nuevo modelo `Site`: cada organización tiene una sede principal (creada en
  el registro con backfill para datos existentes) y puede dar de alta
  sucursales desde su panel, con map picker y campos manuales accesibles.
- Expedientes y certificaciones con alcance: un establecimiento concreto
  (obligatorio en CENI Espacios) o toda la organización (opción de CENI
  Laboral). Flujo «Nueva solicitud» con selección de línea y alcance.
- Regla de unicidad por alcance: una certificación vigente por línea por
  establecimiento; la emisión sustituye solo certificados del mismo alcance
  y las renovaciones conservan el alcance original.
- Directorio, mapa, verificación pública, certificado imprimible y paneles
  muestran el establecimiento certificado («Nombre · Sucursal», dirección
  del local, o «Toda la organización»).
- Seed con caso demo multi-sucursal (Café Luz Cívica: sede Oro + Sucursal
  Roma Plata) y seed idempotente (contadores de folio precargados de BD).
- Pruebas: 6 unitarias nuevas del helper de presentación de alcance y 3 e2e
  del caso multi-sucursal (15 e2e en total, 50 unitarias).

## M5 — QA, endurecimiento y empaquetado (2026-07-13)

- Suite e2e Playwright: ciclo completo de certificación (registro →
  autoevaluación → etapas → dictamen → emisión → directorio → verificación),
  axe sin violaciones críticas/serias en 8 vistas, modo calma persistente y
  `prefers-reduced-motion`.
- Lighthouse desktop: Accesibilidad 100 y Performance 100 en home,
  directorio y panel.
- Corrección: detección de cookie de sesión en middleware para HTTP y HTTPS.
- Docker multi-arch (amd64/arm64): Dockerfile multi-stage con runtime
  standalone, compose db+migrate+web, Makefile (dev/seed/test/prod).
- Documentación: README (setup + despliegue OCI ARM), QA.md (tab-order y
  resultados), ASSUMPTIONS.md actualizado, 17 capturas en docs/screenshots.

## M4 — Panel de administración del Comité (2026-07-13)

- Tablero con KPIs (expedientes por etapa, plazos vencidos, certificaciones
  por nivel/línea, por vencer ≤60 días) y mapa de cobertura.
- Bandeja de expedientes: tabla filtrable + kanban por etapa; transición de
  etapa con nota obligatoria, validación de orden y reinicio de plazo.
- Dictamen con los 30 criterios precargados desde la autoevaluación, cálculo
  automático (total, dimensiones, piso 40 %, nivel) y cierre como nivel o
  Plan de Mejora con dimensiones señaladas (modelo `Verdict`).
- Emisión transaccional de certificados: folio consecutivo por línea/año,
  qrToken criptográfico, vigencia por nivel, sustitución de certificados
  vigentes previos de la misma línea, publicación inmediata en directorio.
- Registro Nacional con suspender/reactivar/retirar y causal obligatoria.
- Gestión de usuarios (alta ADMIN, reseteo de contraseña ORG) y bitácora de
  solo lectura con filtros. Toda acción del Comité queda en `AuditLog`.

## M3 — Panel de organización y motor de autoevaluación (2026-07-13)

- Onboarding de registro: cuenta, datos, ubicación con map picker (con campos
  manuales accesibles), selección de líneas y código de embajador; crea un
  expediente por línea en etapa Solicitud.
- Dashboard con stepper de etapas, semáforo de plazos en días hábiles y
  «siguiente paso esperado» literal; renovación desde certificados por
  vencer/vencidos.
- Autoevaluación interactiva: acordeón por dimensión, escala 0/50/100 %,
  alertas de piso 40 %, puntaje y nivel estimado en vivo con la leyenda
  obligatoria, autoguardado con debounce de 800 ms.
- Evidencias por dimensión (PDF/PNG/JPG ≤10 MB) tras `StorageService`;
  eliminables hasta Revisión Documental.
- Certificado imprimible A4 horizontal con QR generado en servidor.

## M2 — Sitio público y assets (2026-07-13)

- Home con eslogan, 3 pasos, líneas, niveles e impacto desde BD.
- Directorio con mapa MapLibre (OSM, clustering, colores por nivel) y lista
  sincronizada con filtros; lista como vista por defecto.
- Verificación por folio con estados semaforizados y explicación literal.
- Páginas de proceso (6 etapas, 80 días hábiles, costos, FAQ), principios
  (manifiesto, Derechos Índigo, venta≠auditoría) y aviso de privacidad.
- Set completo de SVG originales: logos, favicon, OG, insignias de nivel y
  compromiso, ilustración hero, 12 iconos de dimensión, 3 estados vacíos,
  patrón de nodos y marco de certificado con guilloché.
- Cabeceras de seguridad (CSP, X-Frame-Options DENY, Referrer-Policy).

## M1 — Datos, autenticación y seed (2026-07-13)

- Esquema Prisma completo con bitácora solo-inserción y contador de folios.
- Constantes normativas y módulos puros con 44 pruebas unitarias (puntajes,
  niveles, piso 40 %, días hábiles, semáforo, folios, estados efectivos).
- Seed: 60 criterios de ambas líneas, 10 organizaciones demo con coordenadas
  reales aproximadas (1 suspendida, 1 por vencer), usuarios demo con
  contraseñas desde variables de entorno.
- Auth.js v5 con Argon2id, roles ORG/ADMIN, middleware y rate limiting.

## M0 — Scaffold y design system (2026-07-13)

- Next.js 15 + TypeScript estricto + Tailwind v4 con tokens CENI.
- Atkinson Hyperlegible auto-hospedada; cuerpo ≥16 px, interlineado ≥1.5.
- Modo calma (paleta desaturada, +12.5 % tipografía, espaciado ampliado,
  ilustraciones ocultas) persistente y aplicado antes del primer paint.
- Layout base: skip link, header con navegación estable, footer con eslogan,
  bloque «¿Qué hay en esta página?», migas de pan, kit UI estilo shadcn.
- `ASSUMPTIONS.md` iniciado.
