# Catálogo, carga e ilustración

Se conserva Pulso: blanco #ffffff, tinta #253039, coral #cc4d37, hielo #eaf2f4, acero #9bb0b9; temas claro y oscuro. Bahnschrift en titulares y Segoe UI para lectura. La portada mantiene su composición; no se agrega una nueva landing genérica.

```
inicio:     encabezado / portada con PC corregido
            presentación de empresas | franja continua de tiendas + pausa
catálogo:   encabezado / todas las tiendas integradas
            filtros                 | búsqueda / orden / productos / páginas
cotizador:  encabezado / esqueleto de formulario y tabla al cargar
```

La navegación «Empresas integradas» abre `/catalogo`; no baja a un ancla. El catálogo muestra todos los productos guardados, con ofertas, filtros por empresa/categoría, búsqueda y orden. Filtrar una tienda recalcula el precio mostrado con sus ofertas. No consulta SoloTodo por cada visita ni amplía los límites acordados de sincronización.

La franja de empresas se mueve en un bucle continuo y permite pausar; se detiene al pasar el puntero o usar el teclado y respeta movimiento reducido. Las repeticiones decorativas no duplican enlaces para lectores de pantalla.

La carga comparte formas, colores y estructura con el contenido definitivo, sin una pantalla vacía con texto. La portada está disponible inmediatamente; su franja muestra la carga local cuando hace falta. El cotizador usa un esqueleto de su propia distribución. No se agregan retrasos artificiales.

El gabinete se reconstruye como un vector con vértices compartidos para techo, vidrio y frontal. Las patas quedan unidas al chasis y la base usa un solo volumen; se eliminan los planos y cuadrados flotantes de la captura de referencia.

Revisión previa: se descartan un spinner a pantalla completa, la rotación de toda la portada y tarjetas de tiendas ficticias. El movimiento solo se concentra en la franja solicitada; el catálogo prioriza productos, precios y decisiones de compra.

Revisión final: por solicitud del usuario se elimina la carga global del inicio. Solo aparecen espacios reservados en la franja mientras llegan las tiendas. Las imágenes de los 400 productos existentes se recuperaron una vez; la sincronización diaria conservará ese dato. La fecha se formatea en el servidor para evitar diferencias de hidratación entre Node y el navegador.
