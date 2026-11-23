# Actualización del catálogo

Supabase Cron ejecuta `ensamblia-daily-catalog` con `0 9 * * *`: una vez al día a las 09:00 UTC. En Chile continental corresponde a las 06:00 con UTC−3 y a las 05:00 con UTC−4. No depende de que el computador del desarrollador esté encendido.

El proceso consulta SoloTodo, obtiene nombres y ofertas actuales, elige las tres tiendas con mayor cobertura de categorías y luego cantidad de productos (el identificador desempata), y conserva hasta 50 productos por categoría. Estos límites están en el código; los nombres y los identificadores de las tiendas seleccionadas no están fijados. Es una selección para el catálogo de prueba, no un ranking comercial ni una lista permanente de empresas asociadas.

La portada y los filtros se calculan desde las ofertas del catálogo publicado. Por eso las tiendas, sus nombres y sus cantidades pueden cambiar en la siguiente actualización exitosa. Las cantidades por tienda se solapan cuando un componente tiene varias ofertas.

Las visitas, las cotizaciones y los filtros leen Supabase y no vuelven a descargar SoloTodo. Si la sincronización falla se conserva la versión anterior. Se permite un intento diario; una recuperación administrativa anterior al cron también cuenta como el intento de ese día. Publicar una versión nueva no cambia las cotizaciones que ya están en pantalla; cambiar piezas exige volver a cotizar si cambió la versión.

Los enlaces del catálogo apuntan a ofertas de las tiendas seleccionadas. El título usa la más económica de esas ofertas; un producto sin oferta no enlaza a SoloTodo ni inventa una tienda. Los precios y el stock finales se confirman en la tienda.

## Respuestas de IA

El modelo gratuito configurado sigue siendo `nvidia/nemotron-3.5-lightning:free`. Su ficha consultada durante este cambio no declara `response_format` ni `structured_outputs`; no se fuerza un formato que pueda dejar sin proveedores compatibles.

Las respuestas se intentan interpretar como JSON; si falla la sintaxis se reparan localmente con `jsonrepair`. La reparación no ejecuta código ni permite que la IA aporte piezas o precios: la opción debe ser un entero de las configuraciones ya validadas por el servidor. Una respuesta truncada o con una opción inexistente no se acepta. Se conserva el máximo de dos solicitudes, sin reintentar un 429; una reparación de formato válida consume solo la solicitud original. Los errores de interpretación no se muestran como excepciones técnicas al usuario.
