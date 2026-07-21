# ASSUMPTIONS — Plataforma CENI

Decisiones tomadas de forma autónoma donde el spec era ambiguo o el entorno lo
exigió. Ante conflicto, el spec original manda.

## Infraestructura y herramientas

1. **Registro de shadcn/ui bloqueado por la política de red del entorno de
   construcción.** Los componentes de `src/components/ui/` se escribieron a
   mano siguiendo los patrones oficiales de shadcn/ui (cva + Radix +
   tailwind-merge), tematizados con los tokens de la sección 4. `components.json`
   queda en el repo para poder usar el CLI de shadcn en entornos con red abierta.
2. **`Select` se implementa sobre `<select>` nativo estilizado** en lugar de
   Radix Select: comportamiento más predecible con teclado y lectores de
   pantalla, cero JavaScript extra. Cumple el mismo contrato visual.
3. **Argon2id** se implementa con `@node-rs/argon2` (binarios precompilados
   para linux/arm64, ideal para el VPS Ampere A1) en lugar de `argon2` (que
   compila C en la instalación).
4. **Atkinson Hyperlegible** se auto-hospeda vía `@fontsource/atkinson-hyperlegible`
   (npm, licencia OFL). No hay ninguna fuente por CDN en runtime.
5. **M0 y M1 se verificaron juntos**: el header necesita la sesión (M1) para
   mostrar «Mi panel», así que `lint`/`build` se corrieron al cierre de M1;
   los commits siguen separados por milestone.

## Producto

6. **Modo calma**: se persiste en `localStorage` (`ceni-calm`) y, si hay
   sesión, en el campo `calmMode` del usuario vía `POST /api/profile/calm-mode`.
   El atributo `data-calm` se aplica antes del primer paint con un script
   inline para evitar parpadeo de paleta.
7. **Espaciado en modo calma**: se aumenta mediante el factor CSS
   `--ceni-space-factor` (1 → 1.25) aplicado a las secciones y pilas
   principales, además del +12.5 % de tipografía.
8. **«Guardado en perfil» del modo calma** aplica solo a usuarios con sesión;
   para visitantes anónimos el guardado es únicamente local.
9. **Semáforos de plazo**: verde = quedan >40 % de los días hábiles del plazo,
   ámbar = 1 día a 40 %, rojo = plazo vencido. Siempre acompañados de icono y
   texto («X días hábiles restantes» / «Plazo vencido»), nunca solo color.
10. **Días hábiles**: lunes a viernes. El catálogo de días inhábiles oficiales
    de México queda para fase 2 (el módulo `business-days` acepta una lista de
    feriados inyectable, hoy vacía).
11. **`POR_VENCER`** se calcula al vuelo en las consultas (vigente con ≤60 días
    restantes); no se materializa con un job en MVP. El estado almacenado
    `VIGENTE` se presenta como `POR_VENCER` cuando corresponde.
12. **Folio consecutivo**: se garantiza con una tabla `FolioCounter`
    (línea+año → último consecutivo) actualizada dentro de una transacción
    serializable, evitando duplicados bajo concurrencia.
13. **Renovación (`isRenewal`)**: el expediente de renovación se crea desde el
    panel de la organización con un botón en la certificación vigente o por
    vencer; el costo (70 % del inicial) es informativo, la plataforma no cobra.
14. **Subida de evidencias**: en desarrollo los archivos van a `./data/uploads`
    (configurable con `UPLOAD_DIR`); en Docker se monta el volumen en
    `/data/uploads`. Se sirven vía route handler autenticado con
    `Content-Disposition: attachment` y nombre saneado.
15. **Rate limiting**: implementación en memoria por IP (ventana deslizante,
    20 req/min en login y verificación). Suficiente para una instancia única
    en el VPS; para múltiples réplicas se migraría a Redis en fase 2.
16. **OG image**: el spec pide 1200×630; se genera `og-image.svg` como fuente y
    `og-image.png` rasterizado en build-time (los agregadores sociales no
    aceptan SVG).
17. **Contadores de impacto del home**: «personas capacitadas» y otros valores
    manuales viven en la tabla `SiteMetric` editable por ADMIN (clave/valor);
    «organizaciones certificadas» y «estados con presencia» se calculan de la BD.
18. **Bitácora inmutable**: el cliente Prisma exportado bloquea `update`,
    `updateMany`, `delete` y `deleteMany` sobre `AuditLog` mediante una
    extensión; la base además solo recibe INSERT/SELECT desde la app.
19. **Página imprimible del certificado**: orientación A4 horizontal
    (landscape), acorde al marco con guilloché.
20. **Idioma**: UI y contenido en español de México; código, identificadores,
    commits y nombres de archivo en inglés, como pide el spec.
21. **Plazos vs. total del proceso**: los máximos por etapa del spec
    (5+15+20+10+15+5) suman 70 días hábiles, mientras el total publicado es
    de 80. Ambas cifras son normativas y se muestran tal cual: el margen de
    10 días corresponde a subsanación/prórroga de Revisión Documental. No se
    alteró ninguna cifra.
22. **Prisma 6**: Prisma 7 cambió la configuración (elimina `url` en el
    schema y requiere driver adapters); se fijó Prisma 6 (estable) para
    conservar el flujo estándar `migrate dev/deploy` + `DATABASE_URL`.
23. **Dictamen persistido (`Verdict`)**: el spec separa dictamen (≤15 días) y
    emisión (≤5 días); para conservar el resultado del Comité entre ambas se
    agregó el modelo `Verdict` (respuestas revisadas, total, dimensiones,
    piso, nivel, aprobación). La autoevaluación de la organización nunca se
    sobrescribe.
24. **Emisión de renovaciones**: al emitir un certificado, cualquier
    certificado aún vigente de la misma organización y línea pasa a `VENCIDA`
    con razón «Sustituida por el folio …», garantizando la regla de «solo una
    certificación VIGENTE por línea por organización».
25. **Verificación con Docker**: el entorno donde se construyó este
    repositorio bloquea la descarga de imágenes base de Docker Hub, así que
    `docker build` no pudo ejecutarse aquí. El artefacto de runtime
    (`.next/standalone`) —lo que ejecuta el contenedor— se verificó
    directamente. Ver QA.md.
26. **Teselas OSM en desarrollo**: el sandbox también bloquea
    `tile.openstreetmap.org`; el mapa se verificó estructuralmente (capas,
    clustering, atribución) y las teselas cargan en despliegues normales.
27. **Playwright**: si el navegador administrado no está disponible, la
    config acepta `PW_CHROMIUM_PATH` para usar un Chromium del sistema.
28. **Transición a Cierre**: el paso a la etapa Cierre solo ocurre mediante
    el dictamen del Comité (aprobado o Plan de Mejora), no como transición
    manual, para impedir cierres sin decisión registrada.

## Multi-establecimiento (v1.1)

29. **Modelo `Site`**: cada organización tiene uno o más establecimientos;
    al registrarse se crea automáticamente la «Sede principal» con la
    dirección capturada, y las cadenas agregan sucursales desde su panel.
    La migración incluye backfill: despliegues existentes reciben una sede
    principal por organización y sus expedientes/certificaciones se anclan
    a ella (los folios emitidos no cambian).
30. **Alcance por línea**: CENI Espacios siempre apunta a un establecimiento
    (evalúa condiciones físicas de un lugar concreto). CENI Laboral puede
    apuntar a un centro de trabajo específico o a toda la organización
    (`siteId` nulo).
31. **Regla de unicidad reinterpretada**: «solo una certificación VIGENTE
    por línea» aplica ahora **por alcance** (por establecimiento, o por
    organización cuando el alcance es organizacional). Una cadena puede
    tener cinco sucursales con niveles distintos, cada una con su folio.
32. **Presentación pública**: la sede principal se muestra con el nombre
    comercial simple; las sucursales como «Nombre · Sucursal» en directorio,
    verificación y certificado. El certificado imprime la dirección del
    establecimiento evaluado, o «Alcance: toda la organización».
33. **Costos por tamaño**: siguen siendo informativos y por tamaño de la
    organización; si el Comité define costos por establecimiento, es un
    cambio de contenido en `/proceso`, no de arquitectura.

## Preparación para producción

34. **Datos demo opt-in**: el seed solo crea las organizaciones ficticias y
    el usuario ORG demo cuando `SEED_DEMO_DATA="true"`. En producción se
    siembran únicamente el catálogo de criterios, las métricas del sitio y
    la cuenta ADMIN inicial (bootstrap desde variables de entorno).
35. **Salud**: `GET /api/health` verifica la conexión a la base de datos
    (200/503); lo usan el HEALTHCHECK del contenedor y cualquier balanceador.
36. **Variables `NEXT_PUBLIC_*`**: se hornean en el bundle del cliente en
    build-time, por lo que son build args del Dockerfile (pasadas por
    compose desde `.env`); cambiar la URL de teselas requiere reconstruir la
    imagen.
37. **Registro con rate limit**: 5 registros por minuto por IP. El mensaje
    de «correo ya registrado» se conserva por claridad para la persona
    usuaria; el rate limit acota su uso para enumeración de cuentas.
38. **Proxy inverso**: debe reenviar `X-Forwarded-Proto` y `X-Forwarded-For`
    (cookies seguras de Auth.js y rate limiting por IP dependen de ellos).
