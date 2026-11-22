# Cómo contribuir a Ensamblia

`main` contiene la versión pública de Vercel. Crea una rama `codex/descripcion` o `feat/descripcion` desde `main` y abre un PR. Mantén el PR en borrador mientras falten partes por revisar. Usa issues para errores o funcionalidades que necesiten seguimiento.

Usa commits como `feat(catalogo): reutiliza la descarga diaria`, `fix(cotizacion): valida el presupuesto` o `docs: explica la configuración`. Registra los cambios visibles en [CHANGELOG.md](CHANGELOG.md).

Antes de integrar, revisa el diff y espera los checks **Lint and regression tests** y **Build and type check**. Para repetirlos con Node.js 22:

```bash
npm ci
npm run lint
npm test
npm run build
```

Las pruebas usan respuestas simuladas para OpenRouter; no necesitan claves ni consumen cuota. Al modificar cotizaciones, conserva las comprobaciones de presupuesto, compatibilidad y precios del catálogo. Al modificar caché o entornos, comprueba las peticiones simultáneas, el cambio de día y el aislamiento de las credenciales.

Prueba el recorrido afectado en la vista previa de Vercel. Describe en el PR las variables nuevas y cualquier orden de configuración necesario. No subas archivos `.env`, tokens, respuestas privadas ni datos personales.

Integra con **Squash and merge** para conservar un commit por cambio. Después de integrar, verifica el despliegue de producción y el recorrido modificado. Para revertir código, abre un PR que revierta el commit; ante una incidencia activa puedes restaurar el despliegue anterior en Vercel y registrar después la corrección en Git.

## Controles del repositorio

La protección de `main` debe exigir PR y ambos checks de CI, e impedir force pushes y borrado. Una aprobación externa solo es necesaria cuando haya otra persona disponible para revisar. No incluyas credenciales de proveedores en GitHub Actions: la compilación y las pruebas deben funcionar sin ellas.

Este flujo adapta las prácticas utilizadas en Motora al catálogo y los entornos de Ensamblia. Los controles específicos de talleres y Supabase pertenecen a aquel proyecto.
