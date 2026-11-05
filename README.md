# 🚀 SoloTodo AI PC Builder - Asistente Consultivo de Hardware

> **Proyecto de Inteligencia Artificial para SoloTodo (Chile)**  
> Asignatura: **Aplicaciones de Inteligencia Artificial (TI2082)** · Evaluaciones Sumativas 3 y 4 (ES3 - ES4)  
> Estudiante: **Vicente Sampson**  
> Docente: **Paul André Beltrand Urra**  

![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-API-orange?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)

---

## 📌 1. Definición del Proyecto y Contexto de Negocio

El proyecto consiste en integrar un **asistente de venta consultiva basado en modelos de lenguaje (LLM vía la API de OpenRouter)** dentro de la plataforma **SoloTodo**, el comparador y cotizador de tecnología más grande de Chile.

### 🏢 La Organización y el Problema Concreto
* **Situación actual:** SoloTodo cuenta con un cotizador y armador de PC que opera de manera **completamente manual**.
* **El problema:** Usuarios sin conocimientos avanzados de hardware se abruman al validar compatibilidades críticas (zócalos de CPU, chipsets de placa madre, estándares de memoria DDR4/DDR5, potencia continua de la fuente de poder, factores de forma y espacio físico en gabinetes). Esto provoca una alta tasa de **abandono de sesión**.
* **Impacto económico:** Cada abandono representa una pérdida directa de ingresos por clics no concretados hacia las tiendas asociadas (modelo de afiliados / costo por clic - CPC).

### 💡 Impacto y Modelo de Negocio (Business Model Canvas)
* **Tipo de Modelo de IA:** *"IA que mejora un producto existente"*. Transforma una herramienta pasiva de filtrado en un asesor consultivo inteligente.
* **Propuesta de Valor:**
  > *"Para usuarios de SoloTodo que desean armar un computador sin conocimientos técnicos, nuestro asesor con IA diseña cotizaciones personalizadas y 100% compatibles en segundos, eliminando el abandono por dudas de hardware y conectando directamente con las mejores ofertas en tiendas chilenas."*
* **Indicador de Negocio:** Aumento en la tasa de conversión de armados a clics de compra hacia tiendas asociadas (Meta: >20%) y reducción del tiempo de cotización.
* **Indicador de IA:** Porcentaje de presupuestos generados sin errores de incompatibilidad de hardware (Meta: >96%) con latencia inferior a 3 segundos.

---

## ✨ 2. Características del Prototipo

* **🎨 Identidad Visual Oficial SoloTodo:** Paleta moderna en tonos anaranjados corporativos (`#f97316` / `#ea580c`), contraste oscuro de alta legibilidad y tarjetas de componentes fieles al diseño de SoloTodo.
* **🎛️ Wizard Consultivo Interactivo:**
  * Control deslizante de presupuesto en pesos chilenos (**CLP**) con presets rápidos ($500.000, $850.000, $1.400.000, $2.200.000).
  * Selección de propósito (eSports 1080p, Gaming AAA 1440p/4K, Edición & Streaming, IA/Deep Learning, Productividad).
  * Preferencias de marca (AMD Ryzen / Intel Core, NVIDIA GeForce / AMD Radeon).
  * Campo de requerimientos especiales en lenguaje natural.
* **🛡️ Auditoría de Compatibilidad en Tiempo Real:**
  * Socket CPU vs Placa Madre (AM4, AM5, LGA1700).
  * Memoria RAM soportada y perfiles XMP/EXPO.
  * Estimación de consumo eléctrico (TDP total) y cálculo de fuente recomendada con margen >35%.
  * Dimensiones de gabinete vs longitud de GPU y cooler de CPU.
  * Índice de balance para evitar cuellos de botella CPU-GPU.
* **🛒 Tarjetas de Hardware con Enlaces de Afiliados (CPC):**
  * Desglose completo de piezas con precios de tiendas chilenas (*SpDigital, PC Factory, Winpy, Dust2, Infor-Ingen, Central Gamer*).
  * Explicación del criterio de la IA para cada pieza.
  * Botones *"Ver en tienda"* para simular el flujo comercial de SoloTodo.
* **💬 Asesor Consultivo por Chat en Vivo:**
  * Permite al usuario dialogar con el asistente para resolver dudas de compatibilidad o solicitar modificaciones sobre su presupuesto actual.
* **⚡ Resiliencia Doble (OpenRouter + Motor Local de Fallback):**
  * Conexión a OpenRouter con soporte para múltiples LLMs (Gemini 2.0 Flash, Llama 3.3 70B, etc.).
  * Si la clave de API no está presente o falla la red, el sistema activa un **motor inteligente local** para garantizar que la demostración en vivo nunca falle.

---

## 🛠️ 3. Pila Tecnológica (Stack)

* **Frontend:** [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
* **Iconografía:** [Lucide React](https://lucide.dev/)
* **Backend:** Next.js Route Handlers (`/api/quote`, `/api/chat`)
* **Proveedor de IA:** [OpenRouter API](https://openrouter.ai/)
* **Despliegue:** [Vercel](https://vercel.com/)

---

## 🚀 4. Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ElVichicho/SoloTodo-AI-Project.git
   cd SoloTodo-AI-Project/solotodo-ai
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (Opcional):**
   Crea un archivo `.env.local` en la raíz de `solotodo-ai`:
   ```env
   OPENROUTER_API_KEY=tu_clave_de_openrouter_aqui
   ```
   *(También puedes ingresar la clave directamente desde el botón "Configurar IA" en la interfaz web).*

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📦 5. Estructura del Proyecto

```plaintext
solotodo-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # Endpoint del asesor por chat
│   │   │   └── quote/route.ts     # Endpoint de cotización y validación
│   │   ├── globals.css            # Estilos globales y temas
│   │   ├── layout.tsx             # Layout principal y metadatos
│   │   └── page.tsx               # Interfaz de usuario SoloTodo AI
│   ├── lib/
│   │   ├── hardware-db.ts         # Catálogo chileno y motor de respaldo local
│   │   └── openrouter.ts          # Integración con API de OpenRouter
│   └── types/
│       └── pc-builder.ts          # Tipos de datos para cotización y compatibilidad
├── package.json
└── README.md
```

---

## 👤 Autor
* **Vicente Sampson** - Estudiante de Ingeniería en Informática  
* Proyecto desarrollado para la asignatura **TI2082 - Aplicaciones de Inteligencia Artificial** (2026).
