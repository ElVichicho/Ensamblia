# Operación de Ensamblia en Vercel y Supabase

## Variables y entornos

| Variable | Production | Preview / Development |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Ensamblia | La misma URL para leer el catálogo público |
| `SUPABASE_PUBLISHABLE_KEY` | Lectura del catálogo | Lectura del catálogo, sin permisos de escritura |
| `SUPABASE_SECRET_KEY` | Publicación desde el servidor | No configurar |
| `CATALOG_SYNC_SECRET` | Secret compartido con Vault | No configurar |
| `OPENROUTER_API_KEY` | No configurar | Solo Preview, rama `preview` |
| `ENSAMBLIA_QUOTE_MODE` | `demo` o ausente | `ai` solo en rama `preview` |
| `OPENROUTER_MODEL` | Opcional | `nvidia/nemotron-3.5-lightning:free` o un modelo `:free` |

Se aceptan `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` como compatibilidad, con preferencia por las claves nuevas. Ninguna clave de escritura lleva `NEXT_PUBLIC_`. Las variables adicionales de la integración no son necesarias para el código. Las variables de lectura pueden estar en ramas de PR: sus permisos en Postgres son de lectura y solo para la versión activa.

`main` es Production. `preview` contiene el mismo código y habilita IA únicamente por su entorno. Los PR y otras ramas usan demo. Mantén Vercel Authentication en Preview y confirma la protección sin sesión antes de probar IA. No promociones un artefacto de Preview como sustituto del build de producción.

## Migraciones y primera publicación

1. Verifica que el proyecto es **Ensamblia**; no Motora. Aplica las migraciones versionadas, en orden, usando el flujo autenticado de Supabase. No contienen claves reales.
2. La primera migración crea empresas, productos, ofertas, versiones, estado y registros de sincronización. Todas las tablas tienen RLS. `anon`/`authenticated` solo leen el catálogo activo. No pueden escribir, publicar, leer registros ni adquirir marcas de sincronización. Aplica también la corrección `safe_catalog_publication`: las actualizaciones de empresas deben incluir su filtro para respetar `safeupdate` en PostgREST.
3. La segunda habilita `pg_cron` y `pg_net`, crea una clave aleatoria en Vault y el job `ensamblia-daily-catalog` **inactivo**. Copia ese secreto a `CATALOG_SYNC_SECRET` de Vercel mediante un canal autenticado, sin mostrarlo en logs ni commits.
4. El arranque inicial puede descargar una vez usando `node scripts/prepare-catalog-bootstrap.mjs <ruta-fuera-del-repo.json>`. Conserva la salida para validar cobertura, sin repetir consultas por cada prueba. Publica mediante `publish_catalog` con un registro de bootstrap separado del intento programado del día. Nunca publiques una descarga incompleta.
5. Despliega y verifica `/`, `/cotizador`, `/api/catalog` y `/api/quote`. Solo después activa el job con `select cron.alter_job(jobid, active:=true) from cron.job where jobname='ensamblia-daily-catalog';`.
6. Prueba una ejecución real de `select public.request_catalog_sync();` y revisa su respuesta en `net._http_response` y el registro de `catalog_sync_runs`. No publiques cuerpos que incluyan credenciales. Esta ejecución sí consulta SoloTodo; los intentos posteriores del mismo día se rechazan antes de contactar la fuente.

No hace falta Supabase Auth, Storage ni un panel de empresas. El acceso al catálogo público se hace desde Next.js por RPC con `apikey`. El secreto de sincronización protege el endpoint HTTP, y solo la clave de servidor puede llamar las funciones de escritura.

## Sincronización diaria

El job ejecuta a las **09:00 UTC**, equivalente a las 05:00 o 06:00 en Santiago según el horario de verano. Supabase hace un POST a `https://ensamblia.vercel.app/api/catalog/sync` con el secreto leído de Vault; no depende del notebook ni de visitas. La ruta rechaza Preview, claves ausentes o inválidas.

El adaptador de SoloTodo normaliza los productos y sus ofertas. Se conservan tres empresas por cobertura y hasta **50 productos por categoría / 400 total**. Antes de distribuir por bandas de precio se preservan combinaciones completas por tienda para oficina y gaming. Las empresas se muestran como catálogos de prueba procedentes de SoloTodo, sin declarar alianzas comerciales. Un adaptador futuro debe producir el mismo `Snapshot`, normalizar IDs y ofertas, y respetar estos límites.

`claim_catalog_sync` reserva la fecha de `America/Santiago` mediante una clave primaria en Postgres. Solo un proceso puede descargar. Un intento fallido también consume la marca del día para evitar ráfagas contra la fuente. Una interrupción deja el intento `running`; no se reintenta automáticamente ese día. La publicación rechaza marcas de más de diez minutos y versiones anteriores.

`publish_catalog` inserta la versión, productos y ofertas, cambia la versión activa y cierra el registro en una sola transacción. Cualquier error revierte todo. Se conserva la versión anterior y 30 días de registros. Si una sincronización falla, los lectores siguen usando la última publicación. Si Supabase está inaccesible, la aplicación muestra el JSON histórico como respaldo, sin presentar ofertas como verificadas. El estado considera vigente la publicación esperada según el horario de las 09:00 UTC, no la medianoche.

Al cotizar se consulta únicamente `get_catalog_snapshot`. La selección de empresas filtra ofertas, descarta productos sin oferta en esas empresas y recalcula su precio mínimo antes de preparar candidatos. Los cambios de piezas repiten la misma validación y rechazan con 409 una versión de catálogo antigua. Los precios y el presupuesto se calculan en el servidor. La agrupación minimiza tiendas para las piezas elegidas dentro del presupuesto; no asegura el mínimo global entre todos los armados posibles ni estima despacho.

## Verificación y recuperación

- `npm run lint`, `npm test`, `npm run build`: sin secretos ni llamadas reales a OpenRouter en CI.
- Production: respuesta `mode: demo`, ofertas de empresas elegidas y presupuesto respetado. Dos cotizaciones deben conservar `catalog.updatedAt` y no crear sincronizaciones.
- Preview: protección activa, `mode: ai` solo en rama `preview`; una generación real consume cuota. Cambiar piezas no consume otra llamada.
- Supabase: comprobar ocho categorías con máximo 50, tres empresas activas, ofertas válidas, RLS y permisos de funciones. Los advisors no deben indicar exposición de funciones privilegiadas.
- Cron: job activo, `0 9 * * *`, respuesta HTTP exitosa y registro `done`; un segundo disparo no descarga otra vez.

Las credenciales y la copia de Redis se conservan durante la verificación de la migración como respaldo operativo. El nuevo código no las lee. Tras validar Supabase se puede desconectar la integración antigua; no se debe borrar una base compartida con otro proyecto.

Para revertir código, abre un PR de reversión. Las migraciones son aditivas y la copia Redis anterior permanece intacta; no elimines tablas ni versiones para revertir una interfaz. Si el cron falla, consulta el registro y `net._http_response`, corrige el origen y conserva la última publicación. Una recuperación excepcional requiere revisar el intento del día antes de autorizar una nueva descarga.
