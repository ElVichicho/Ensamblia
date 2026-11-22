# Despliegue y catálogo diario

## Configuración en Vercel

1. En Settings → Git, conserva `main` como Production Branch. Publica producción integrando PRs en `main`, para que Vercel compile con las variables de Production.
2. En Storage/Marketplace, conecta una base Redis de Upstash al proyecto. Usa la misma base en Production y Preview. La app utiliza directamente `KV_REST_API_URL` y `KV_REST_API_TOKEN`, creadas por la integración, sin copiar ni duplicar valores. Se necesita el token de lectura y escritura, no `KV_REST_API_READ_ONLY_TOKEN`. También se admite una pareja completa `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` para instalaciones existentes; la pareja `KV_` tiene prioridad y no se mezclan credenciales entre parejas.
3. Usa `CATALOG_CACHE_NAMESPACE=ensamblia:catalog:v1` en ambos entornos. Este prefijo identifica la caché; cambiarlo crea otra caché y permite una descarga nueva. En pruebas locales con API real, usa otra base o prefijo para preservar la caché publicada.
4. En Environment Variables, elimina `OPENROUTER_API_KEY` de Production y Development si no la necesitas allí. En Production deja `ENSAMBLIA_QUOTE_MODE=demo` o sin definir. El código fuerza demo en Production.
5. Agrega `OPENROUTER_API_KEY` y `ENSAMBLIA_QUOTE_MODE=ai` únicamente a Preview con alcance a la rama `preview`. Opcionalmente configura `OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free` en el mismo alcance. El código solo acepta modelos terminados en `:free`.
6. En Deployment Protection, activa Vercel Authentication para Preview. Conserva accesible el dominio público de Production. Comprueba la protección desde una sesión sin autenticar antes de usar la clave. La clave es de servidor y nunca lleva prefijo `NEXT_PUBLIC_`.
7. Despliega la rama `preview`. Vercel genera una URL por rama distinta de `ensamblia.vercel.app`; copia la que aparece en el despliegue, sin deducirla del nombre del proyecto. Si tienes un dominio propio, puedes asignar un subdominio a esa rama en Settings → Domains → Git Branch. La URL automática es suficiente.
8. Despliega de nuevo los entornos afectados después de configurar variables. Habilita Fluid Compute si el proyecto aún usa los límites antiguos: la ruta reserva hasta 180 segundos para la actualización inicial y la respuesta del proveedor.

Las ramas de PR usan demo, incluso si tienen variables generales de Preview. Para actualizar el entorno estable tras integrar un PR, avanza `preview` hasta `main` sin force push. Mantén ambas ramas con el mismo código; el comportamiento depende del entorno. Evita promover un artefacto de Preview con sus variables de IA como sustituto de la compilación de Production.

## Decisión: primera cotización del día

La actualización se inicia al cotizar, sin cron ni botón manual. Evita descargar productos en días sin visitas y no necesita que el navegador conserve datos. Una actualización comprende varias peticiones a SoloTodo para páginas, categorías, tiendas y ofertas: el límite es **un proceso de actualización al día**, compartido por todos los usuarios.

La fecha se calcula en `America/Santiago`, incluyendo horario de verano. Antes de descargar se crea una marca diaria con `SET NX EX` en Redis. Solo una instancia puede obtenerla. Las demás esperan la publicación de la copia, hasta 48 segundos. Se guarda un JSON comprimido con gzip/base64; el catálogo de referencia comprimido ocupa aproximadamente 200 KB con esa codificación, y las ofertas añaden espacio. El límite de escritura es 900 KB. Si se supera, se conserva el respaldo y debe revisarse el tamaño antes de ampliar el límite según el plan del proveedor.

La publicación del catálogo y el cierre de la marca se realizan mediante Lua de forma atómica. La marca dura 48 horas y la última copia no tiene vencimiento. Esto permite reutilizarla tras un despliegue o arranque en frío. La fecha de publicación impide que una descarga antigua sobrescriba una más reciente.

Si SoloTodo falla, se conserva la última copia válida y se cierra el intento de ese día. Si la función se interrumpe, su marca sigue impidiendo nuevas descargas ese día. La siguiente fecha permite un intento nuevo. Este comportamiento prioriza el límite diario; puede dejar precios antiguos durante una incidencia. La interfaz muestra la fecha y el uso del respaldo.

Si Redis falta o no responde, el servidor usa el JSON incluido en el repositorio y no consulta SoloTodo sin coordinación. La interfaz informa que la actualización está pendiente o no disponible. No se presenta ese respaldo como catálogo del día.

Al cambiar piezas se compara la fecha del catálogo usado por la cotización con la del servidor. Si cambió, se responde 409 y se solicita cotizar nuevamente. El servidor valida IDs, compatibilidad y precios. Las copias firmadas antiguas del navegador ya no se utilizan; la ruta pública de actualización manual se eliminó.

## Verificación después de publicar

- Production: cotiza para dos usos, comprueba `mode: demo` en `/api/quote` y ausencia del botón de actualizar. No debe existir una clave de OpenRouter en las variables de Production.
- Catálogo: la primera cotización debe devolver `catalog.status: current`; la segunda, desde otro navegador, debe conservar `catalog.updatedAt`. En Redis deben existir `ensamblia:catalog:v1:snapshot`, `:updatedAt` y `:attempt:AAAA-MM-DD`. Revisa que la marca esté en `done`. No borres la marca para repetir pruebas en el mismo día.
- Preview: abre la URL desde una sesión sin autenticar y comprueba que exige acceso de Vercel. Después de autenticar, cotiza una vez y comprueba `mode: ai` y `quote.generationMode: ai`. Esta prueba sí consume cuota. Un cambio de pieza posterior no debe consumir otra llamada de IA.
- Otras ramas: deben mostrar la demo. No uses la rama `preview` para ejecutar código de un PR externo sin revisar.

`npm test` verifica la concurrencia con un almacenamiento simulado y OpenRouter simulado. CI también ejecuta `node scripts/check-redis-integration.mjs` contra Redis 7 en un contenedor desechable, para comprobar el Lua real, exclusión simultánea, TTL y orden de publicación. CI no dispone de claves ni consulta proveedores externos. La prueba posterior al despliegue confirma los permisos, la conexión REST y la persistencia del servicio conectado.

## Incidencias y recuperación

`unconfigured` indica que faltan las variables de Redis. `unavailable` indica un fallo al leer o escribir el almacenamiento. `stale` indica un intento fallido, interrumpido o todavía pendiente. Comprueba variables, permisos, límites del proveedor y conectividad sin copiar secretos a logs o issues.

Para recuperar un cambio de código, revierte su commit mediante PR y verifica el despliegue. Si restauras una versión anterior de Vercel, revisa también su comportamiento de IA y catálogo: versiones anteriores usaban actualización manual. Conserva las variables de Redis y la copia persistida durante la recuperación. Cambiar credenciales requiere actualizar las variables y desplegar de nuevo.

## Referencias

- [Entornos de Vercel](https://vercel.com/docs/deployments/environments)
- [Variables por entorno](https://vercel.com/docs/environment-variables)
- [Protección de despliegues](https://vercel.com/docs/deployment-protection)
- [Duración de funciones](https://vercel.com/docs/functions/configuring-functions/duration)
- [Redis REST API de Upstash](https://upstash.com/docs/redis/features/restapi)
