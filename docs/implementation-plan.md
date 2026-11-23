# Ensamblia: plataforma de cotización entre empresas

## Alcance aprobado

- Inicio Pulso (blanco, coral y PC ilustrado), descripción breve y empresas reales del catálogo. Cotizador en `/cotizador` con la distribución actual, preferencias, tabla de piezas y alternativas; temas claro y oscuro.
- Elegir una o varias empresas; precio mínimo o menor número de tiendas dentro del presupuesto. Filtrar productos y recalcular precios antes de recomendar, también al cambiar piezas.
- Un dominio y un repositorio Next.js. Vercel para web/API; Supabase Postgres para empresas, productos, ofertas, versiones y sincronizaciones. Sin área empresarial ni pagos.
- SoloTodo como adaptador inicial. Tres tiendas piloto según cobertura. Hasta 50 productos por categoría (400 total), distribuidos por precios. La arquitectura permite incorporar otras fuentes sin cambiar el cotizador.
- Cron diario 09:00 UTC desde Supabase al endpoint protegido de producción. Lecturas del catálogo al cotizar, ninguna descarga del proveedor por visita. Exclusión distribuida, publicación transaccional y conservación de la última versión válida.
- Producción demo sin IA; rama estable `preview` con OpenRouter gratuito y protección Vercel. Preview solo lee el catálogo; no recibe la clave de escritura de producción.
- Migraciones versionadas, RLS, permisos mínimos, pruebas de filtros, concurrencia, fallos y presupuesto. CI y revisión del diff antes de integrar; verificar Preview y Production.

## Dirección visual

Paleta clara: blanco #ffffff, tinta #253039, coral #ec654d, hielo #eaf2f4, acero #9bb0b9. Variante oscura: superficies azul pizarra con coral accesible. Bahnschrift para títulos y Segoe UI para lectura. Inicio con texto izquierdo y gabinete CSS a la derecha; empresas en franja inferior. El gabinete es el único gesto visual protagonista. Se conserva la estructura de formulario lateral y resultados del cotizador, sin convertirlo en una landing ni copiar los controles de las maquetas descartadas.

```text
inicio:    marca / navegación / tema
           descripción + cotizar | PC ilustrado
           empresas disponibles del catálogo
cotizador: marca / inicio / tema
           preferencias y tiendas | piezas / precios / alternativas
```

## Entrega

Cambios por rama y PR; validar catálogo inicial y cron, publicar producción, avanzar `preview`, verificar aislamiento de IA. No retirar Redis hasta comprobar que Supabase mantiene el catálogo persistente.
