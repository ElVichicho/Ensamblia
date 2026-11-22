# Registro de cambios

## Sin publicar

- Reconocimiento directo de las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` creadas por Vercel para Redis, conservando compatibilidad con las variables `UPSTASH_`.
- Catálogo automático diario compartido entre usuarios, con respaldo, marca persistente de concurrencia y fecha de Chile. Se elimina la actualización manual.
- Production utiliza demo; la rama Preview estable puede usar IA con credenciales privadas. Las otras ramas conservan la demo.
- Flujo de contribución mediante ramas y PRs, plantilla de revisión y CI con compilación, lint y pruebas de cotización sin credenciales.

## Demo pública

- Cotizaciones deterministas por uso, cambios de componentes y alternativas compatibles sin consumir la cuota de OpenRouter.
- Comparación de productos y agrupación de compras por tienda.
