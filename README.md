<p align="center">
  <img src="public/ensamblia-icon.png" alt="Icono de Ensamblia" width="88" />
</p>

# Ensamblia

Cotizador de computadores con IA que ayuda a elegir componentes según el uso, el presupuesto y las preferencias de compra.

Ensamblia parte de un problema cotidiano al comprar un PC. Elegir cada pieza requiere comparar especificaciones, comprobar compatibilidad y coordinar ofertas de distintas tiendas. La aplicación propone un armado completo, explica la elección y permite explorar alternativas por componente antes de decidir.

El producto está orientado a evolucionar como un **SaaS para tiendas de tecnología**, conectado al catálogo de cada empresa. La demo actual utiliza la API pública de SoloTodo para trabajar con productos y ofertas de comercios chilenos.

**[Probar la demo](https://ensamblia.vercel.app)**

![Comparación de procesadores con precios, alternativas y diferencias de benchmarks en Ensamblia](public/ensamblia-preview.jpg)

## Funciones

- **Cotización por uso y presupuesto.** Perfiles de oficina, hogar y estudio, diseño y edición, videojuegos, y desarrollo y datos. Incluye preferencias de marcas, memoria, almacenamiento, refrigeración, gabinete y WiFi.
- **Hasta tres opciones por categoría.** La pieza seleccionada y hasta dos alternativas que respetan el presupuesto y las comprobaciones disponibles del resto del equipo.
- **Comparaciones con datos del catálogo.** Diferencias de puntuación PassMark para CPU y 3DMark Time Spy para GPU cuando ambos productos tienen datos. En otras categorías se comparan características como capacidad, velocidad de lectura, potencia o conectividad.
- **Ofertas y tiendas.** Precio y enlace por pieza, con la opción de priorizar el menor precio o una compra en menos tiendas dentro del presupuesto.
- **Catálogo actualizado bajo demanda.** El botón Actualizar catálogo obtiene una copia de productos y ofertas que se reutiliza al cotizar y cambiar piezas.
- **Interfaz adaptable.** Tema claro y oscuro, vista móvil y copia de la cotización.

## Cómo funciona

1. **Obtención de datos.** El catálogo de referencia permite iniciar la aplicación. Una actualización manual consulta SoloTodo y guarda en el navegador una copia comprimida y firmada por el servidor.
2. **Selección por contexto.** Las reglas clasifican los productos por uso y filtran según presupuesto y preferencias. Un producto puede pertenecer a varios perfiles.
3. **Preparación del armado.** El servidor genera hasta ocho configuraciones con las comprobaciones técnicas disponibles.
4. **Recomendación con IA.** OpenRouter recibe las configuraciones preparadas. El modelo selecciona una opción y redacta su explicación. Los precios y las piezas se recuperan del catálogo.
5. **Personalización.** El servidor calcula alternativas por categoría. Al cambiar una pieza, vuelve a validar el armado y recalcula ofertas, total y comparaciones utilizando la copia guardada.

Los cambios de componentes reutilizan las reglas del servidor y evitan una nueva consulta al modelo.

## Datos y comparaciones

El catálogo de referencia incluido contiene **1.511 productos en ocho categorías**, con un máximo de **200 por categoría**. La cantidad disponible puede variar al actualizar las ofertas.

La selección por contexto reduce los datos enviados a la IA. Por ejemplo, las reglas de oficina excluyen productos de alto consumo o de estaciones de trabajo cuando sus características quedan fuera del perfil. Después se aplican las preferencias y el presupuesto para preparar las configuraciones.

Los porcentajes de CPU y GPU se calculan en el servidor con esta fórmula:

```text
(puntaje de la alternativa / puntaje de la pieza seleccionada - 1) × 100
```

La pieza seleccionada es la referencia. Al cambiarla se recalculan las diferencias. Los porcentajes describen puntuaciones de benchmarks del catálogo y el rendimiento real depende de la tarea. Cuando falta un puntaje, la comparación utiliza las características disponibles.

Las comprobaciones abarcan socket, tipo y cantidad de RAM, dimensiones conocidas, refrigeración y potencia estimada. La interfaz muestra las verificaciones pendientes, como BIOS, conectores e interfaces. Los precios, la disponibilidad y el despacho se confirman en cada tienda.

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Interfaz | Next.js 16, React 19, TypeScript, Tailwind CSS 4 y Lucide |
| Servidor | Route Handlers de Next.js y reglas de selección y compatibilidad |
| IA | OpenRouter, con NVIDIA Nemotron 3.5 Lightning gratuito como modelo predeterminado |
| Datos | API pública de SoloTodo, catálogo JSON y copias comprimidas con firma HMAC |
| Despliegue | Vercel conectado al repositorio de GitHub |

## Ejecutar en local

Necesitas Node.js 22, npm y una API key de OpenRouter.

```bash
git clone https://github.com/ElVichicho/Ensamblia.git
cd Ensamblia
npm ci
```

Crea un archivo `.env.local` en la raíz del proyecto:

```dotenv
OPENROUTER_API_KEY=tu_clave_de_openrouter
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
```

La clave se utiliza en el servidor para consultar el modelo y firmar las copias del catálogo. El modelo predeterminado es gratuito y está sujeto a los límites y la disponibilidad del proveedor.

```bash
npm run dev
```

Abre [localhost:3000](http://localhost:3000). Puedes pulsar **Actualizar catálogo** para cargar ofertas recientes y sus tiendas.

## Comprobaciones y comandos

```bash
npm run lint
npx tsc --noEmit
node scripts/check-quote-selection.mjs
node scripts/check-component-alternatives.mjs
npm run build
```

Las comprobaciones cubren presupuestos, selección de candidatos, cantidades de RAM, compatibilidad de los cambios, cálculo de porcentajes, datos faltantes, agrupación de tiendas y filtrado por uso. La prueba de integración con OpenRouter utiliza una respuesta simulada para verificar el contenido enviado al modelo.

Para actualizar el catálogo de referencia del repositorio:

```bash
npm run fetch-catalog
```

Este comando consulta productos y ofertas de SoloTodo y reemplaza el archivo de referencia al completar la descarga.

## Estructura

```text
src/
├── app/
│   ├── api/catalog/route.ts      # Actualización y firma del catálogo
│   ├── api/quote/route.ts        # Cotización y cambios de componentes
│   └── page.tsx                 # Interfaz del cotizador
├── data/solotodo-catalog.json    # Catálogo de referencia
├── lib/
│   ├── catalog-profiles.ts      # Clasificación y filtrado por uso
│   ├── catalog-snapshot.ts      # Descarga y copias firmadas
│   ├── component-alternatives.ts
│   ├── openrouter.ts
│   ├── quote-selection.ts       # Armados y comprobaciones técnicas
│   └── store-offers.ts          # Ofertas y agrupación de compras
└── types/pc-builder.ts
```

## Evolución prevista

- Conectores para APIs de tiendas y sus propios inventarios.
- Espacios de trabajo por empresa, con autenticación y configuración de su catálogo.
- Métricas para evaluar el tiempo de cotización, las selecciones válidas y la continuación hacia la compra.

## Autor y origen

Desarrollado por **[Vicente Sampson](https://github.com/ElVichicho)**. El proyecto nació en la asignatura Aplicaciones de Inteligencia Artificial de Ingeniería en Informática y continúa como proyecto de portafolio orientado a un producto SaaS.

Los productos, ofertas y benchmarks de la demo proceden de [SoloTodo](https://www.solotodo.cl/). La inferencia se realiza mediante [OpenRouter](https://openrouter.ai/).
