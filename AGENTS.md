# Ensamblia

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de publicar cambios. Trabaja mediante ramas y PRs; revisa el diff y espera CI antes de integrar.

- Conserva la validación de presupuesto, compatibilidad y precios en el servidor.
- Mantén las claves fuera del navegador, los logs y las pruebas. La demo pública debe funcionar sin credenciales de IA.
- Usa español de Chile y conserva la accesibilidad y ambos temas visuales.
- Ejecuta lint, pruebas y compilación según la guía. Documenta las variables y dependencias operativas que cambien.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
