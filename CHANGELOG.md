# Registro de cambios

## Sin publicar

- El inicio muestra Pulso desde la primera respuesta; solo las tiendas esperan al catálogo, sin pantalla completa de carga.

- Publicación compatible con `safeupdate`, diagnóstico sin secretos y vigencia de recuperaciones anteriores al horario diario.

- Inicio Pulso con empresas del catálogo y cotizador independiente en `/cotizador`, conservando preferencias, tabla de piezas, alternativas y ambos temas.
- Cotización en una o varias empresas: los productos y precios se filtran antes de generar y al cambiar piezas.
- Migración del catálogo de Redis a Supabase Postgres, con RLS, versiones publicadas de forma transaccional, registros de sincronización y lectura pública sin credenciales de escritura.
- Actualización desde Supabase Cron a las 09:00 UTC mediante endpoint protegido; ninguna visita descarga productos del proveedor.
- Máximo de 50 productos por categoría y tres tiendas piloto, conservando combinaciones compatibles y diversidad de precios.

## Catálogo diario anterior

- Reconocimiento directo de las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` creadas por Vercel para Redis, conservando compatibilidad con las variables `UPSTASH_`.
- Catálogo automático diario compartido entre usuarios, con respaldo, marca persistente de concurrencia y fecha de Chile. Se elimina la actualización manual.
- Production utiliza demo; la rama Preview estable puede usar IA con credenciales privadas. Las otras ramas conservan la demo.
- Flujo de contribución mediante ramas y PRs, plantilla de revisión y CI con compilación, lint y pruebas de cotización sin credenciales.

## Demo pública

- Cotizaciones deterministas por uso, cambios de componentes y alternativas compatibles sin consumir la cuota de OpenRouter.
- Comparación de productos y agrupación de compras por tienda.
