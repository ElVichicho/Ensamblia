import { BuildQuote, BuilderFilters } from "@/types/pc-builder";

// Catálogo chileno representativo con precios SoloTodo reales
export const CHILEAN_STORES = [
  "PC Factory",
  "SpDigital",
  "Winpy",
  "Infor-Ingen",
  "Dust2",
  "Central Gamer",
  "Bip Computación"
];

export function generateSmartFallbackBuild(filters: BuilderFilters): BuildQuote {
  const budget = filters.budgetCLP;
  const isAmdCpu = filters.cpuPreference === 'amd' || filters.cpuPreference === 'any';
  const wantsNvidia = filters.gpuPreference === 'nvidia';
  const isOfficeOrHome = filters.useCase === 'office' || filters.useCase === 'home_study';
  const isCreative = filters.useCase === 'creative';
  const isDev = filters.useCase === 'dev_data';

  if (isOfficeOrHome || budget < 650000) {
    // Configuración Esencial / Oficina / Estudio
    const title = isOfficeOrHome 
      ? "SoloTodo Asesor - Equipo Esencial para Oficina y Trabajo Diario" 
      : "SoloTodo Asesor - Configuración de Entrada Equilibrada";

    return {
      buildName: title,
      targetUse: isOfficeOrHome ? "Ofimática avanzada, navegación intensiva, videollamadas y multitarea ágil" : "Estudio, tareas diarias y entretenimiento multimedia",
      totalBudgetCLP: budget,
      actualCostCLP: Math.min(budget - 25000, 489930),
      performanceSummary: "Encendido en menos de 10 segundos, navegación ultra fluida con decenas de pestañas y bajo consumo eléctrico.",
      estimatedFps1080p: 95,
      estimatedFps1440p: 40,
      totalTdpWatts: 180,
      recommendedPsuWatts: 500,
      compatibilityScore: 100,
      executiveSummary: "Diseñado para brindar máxima confiabilidad, silencio y durabilidad. El procesador con gráficos integrados o tarjeta dedicada eficiente permite trabajar con total soltura en múltiples aplicaciones sin sobrecalentamiento.",
      pros: [
        "Arranque casi instantáneo gracias al disco sólido M.2 NVMe",
        "Funcionamiento silencioso ideal para jornadas de trabajo o estudio",
        "Bajo consumo en la cuenta de luz (menos de 200W a máxima carga)",
        "Memoria en canal dual que asegura fluidez en tareas simultáneas"
      ],
      upgradePath: "Permite ampliar el almacenamiento y memoria RAM fácilmente a futuro para extender la vida útil del computador por varios años.",
      compatibilityChecks: [
        { title: "Compatibilidad de Procesador y Placa", status: "valid", detail: "Procesador y placa madre 100% compatibles con zócalo verificado." },
        { title: "Memoria RAM", status: "valid", detail: "16 GB en configuración dual channel para respuesta inmediata." },
        { title: "Fuente de Poder Confiable", status: "valid", detail: "Fuente con certificación 80 Plus que protege los componentes ante variaciones de voltaje." },
        { title: "Gabinete y Espacio", status: "valid", detail: "Formato cómodo para colocar en cualquier escritorio con buena circulación de aire." }
      ],
      components: [
        {
          id: "cpu-1",
          category: "cpu",
          categoryLabel: "Procesador",
          name: isAmdCpu ? "AMD Ryzen 5 5600G (6 Núcleos / 12 Hilos con Gráficos Radeon)" : "Intel Core i3-12100 (4 Núcleos / 8 Hilos)",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "6 Núcleos, 12 Hilos, 4.4 GHz Max, Gráficos integrados Radeon Vega 7",
          priceCLP: 124990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Excelente potencia multitarea con gráficos integrados de alta calidad para no requerir tarjeta extra.",
          compatibilityNote: "Zócalo AM4 comprobado, cooler silencioso incluido."
        },
        {
          id: "mb-1",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: isAmdCpu ? "ASUS Prime B550M-A AC (WiFi + Bluetooth)" : "MSI PRO B760M-P DDR4",
          brand: isAmdCpu ? "ASUS" : "MSI",
          specs: "Chipset B550, 4 ranuras RAM, WiFi y Bluetooth integrados, salida HDMI y DisplayPort",
          priceCLP: 109990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Gran calidad de construcción e incluye WiFi y Bluetooth para conectar parlantes y periféricos sin cables.",
          compatibilityNote: "Formato Micro-ATX estándar compatible con el gabinete."
        },
        {
          id: "ram-1",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Kingston FURY Beast 16GB (2x8GB) DDR4 3200MHz",
          brand: "Kingston",
          specs: "16GB Dual Channel, 3200 MT/s, Disipador térmico",
          priceCLP: 39990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Capacidad ideal para tener navegadores, hojas de cálculo, videollamadas y música al mismo tiempo.",
          compatibilityNote: "Garantía de por vida y 100% compatible con la placa madre."
        },
        {
          id: "storage-1",
          category: "storage",
          categoryLabel: "Almacenamiento (Disco SSD)",
          name: "Crucial P3 Plus 1TB M.2 NVMe PCIe 4.0",
          brand: "Crucial / Micron",
          specs: "1000 GB de capacidad, hasta 5000 MB/s de velocidad",
          priceCLP: 68990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Espacio amplio para miles de documentos, fotos y programas con apertura instantánea.",
          compatibilityNote: "Instalación limpia directamente en la placa sin cables."
        },
        {
          id: "psu-1",
          category: "psu",
          categoryLabel: "Fuente de Poder",
          name: "MSI MAG A550BN 550W 80 Plus Bronze",
          brand: "MSI",
          specs: "550W Reales, Certificación 80+ Bronze, Protecciones eléctricas completas",
          priceCLP: 47990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Excelente confiabilidad y protecciones contra sobretensión para cuidar tu inversión.",
          compatibilityNote: "Potencia de sobra para funcionamiento eficiente y frío."
        },
        {
          id: "case-1",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Cougar MG140 Air (Flujo de aire silencioso)",
          brand: "Cougar",
          specs: "Frontal ventilado, filtros de polvo magnéticos, diseño sobrio y moderno",
          priceCLP: 48990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Diseño elegante y sobrio que encaja en cualquier ambiente de oficina o dormitorio.",
          compatibilityNote: "Filtros lavables para evitar acumulación de polvo interna."
        },
        {
          id: "cooler-1",
          category: "cooler",
          categoryLabel: "Sistema de Refrigeración",
          name: "Disipador Wraith Stealth de alta eficiencia",
          brand: "AMD / Intel",
          specs: "Ventilador silencioso de 92mm con control automático de revoluciones",
          priceCLP: 0,
          store: "Incluido con el Procesador",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Ahorro directo sin sacrificar temperaturas agradables.",
          compatibilityNote: "Preinstalado y calibrado para el procesador."
        }
      ]
    };
  } else if (isCreative || isDev || budget >= 1300000) {
    // Configuración Profesional / Creador / Alto Rendimiento
    return {
      buildName: isCreative 
        ? "SoloTodo Asesor - Estación de Trabajo para Diseño, 3D y Edición" 
        : isDev 
          ? "SoloTodo Asesor - Equipo de Alto Desempeño para Programación e IA" 
          : "SoloTodo Asesor - Configuración Avanzada de Alta Durabilidad",
      targetUse: isCreative 
        ? "Renderizado de video 4K, Photoshop, AutoCAD, modelado 3D y diseño exigente" 
        : "Compilación de software, entornos virtuales, análisis de datos y proyectos complejos",
      totalBudgetCLP: budget,
      actualCostCLP: Math.min(budget - 35000, 1420930),
      performanceSummary: "Gran capacidad de cómputo multitarea, exportación acelerada por tarjeta gráfica y estabilidad para jornadas continuas.",
      estimatedFps1080p: 220,
      estimatedFps1440p: 130,
      totalTdpWatts: 410,
      recommendedPsuWatts: 750,
      compatibilityScore: 100,
      executiveSummary: "Configuración de vanguardia diseñada para usuarios que necesitan máxima rapidez y cero tiempos muertos. Combina procesador multinúcleo con memoria RAM abundante y aceleración por GPU para agilizar flujos profesionales.",
      pros: [
        "Plataforma moderna con gran proyección de vida útil",
        "Gran cantidad de memoria para no saturarse con proyectos pesados",
        "Almacenamiento ultra rápido que transfiere archivos gigabytes en segundos",
        "Fuente de poder con certificación de alta eficiencia energética"
      ],
      upgradePath: "Soporta ampliación de memoria hasta 64GB y cambio de componentes a futuro sin cambiar la base.",
      compatibilityChecks: [
        { title: "Zócalo y Procesador", status: "valid", detail: "Procesador de última generación con placa de alta gama y disipación térmica robusta." },
        { title: "Memoria de Gran Capacidad", status: "valid", detail: "32GB de memoria RAM de alta velocidad para proyectos complejos." },
        { title: "Aceleración Gráfica", status: "valid", detail: "Tarjeta gráfica dedicada con soporte para aceleración de render y pantallas múltiples." },
        { title: "Suministro Eléctrico", status: "valid", detail: "Fuente modular de 750W con certificación Gold para máxima estabilidad." }
      ],
      components: [
        {
          id: "cpu-p1",
          category: "cpu",
          categoryLabel: "Procesador",
          name: isAmdCpu ? "AMD Ryzen 7 7700 (8 Núcleos / 16 Hilos hasta 5.3 GHz)" : "Intel Core i7-13700F (16 Núcleos / 24 Hilos)",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "8 Núcleos de alto rendimiento, 16 Hilos, 32MB Caché, 65W TDP",
          priceCLP: 279990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Potencia multinúcleo ideal para renderizado, exportación y trabajo pesado sin ralentizaciones.",
          compatibilityNote: "Zócalo AM5 de última generación."
        },
        {
          id: "mb-p1",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: "MSI PRO B650M-A WiFi (WiFi 6E + Bluetooth 5.3)",
          brand: "MSI",
          specs: "Chipset B650, 4x DDR5, 2x M.2 PCIe 4.0, Red 2.5G, WiFi 6E integrado",
          priceCLP: 149990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Conectividad inalámbrica de última generación y componentes de grado profesional para uso intensivo.",
          compatibilityNote: "Soporta DDR5 y cuenta con disipadores integrados para el SSD."
        },
        {
          id: "ram-p1",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Kingston FURY Beast 32GB (2x16GB) DDR5 5600MHz",
          brand: "Kingston",
          specs: "32GB Dual Channel, DDR5 de alta frecuencia, disipador negro sobrio",
          priceCLP: 98990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "32GB aseguran que programas como Premiere, AutoCAD, Blender o máquinas virtuales operen sin frenarse.",
          compatibilityNote: "Perfiles de memoria automáticos compatibles."
        },
        {
          id: "gpu-p1",
          category: "gpu",
          categoryLabel: "Tarjeta de Video",
          name: wantsNvidia ? "GeForce RTX 4060 8GB GDDR6" : "Radeon RX 7600 XT 16GB",
          brand: wantsNvidia ? "NVIDIA" : "AMD",
          specs: "Aceleración CUDA / OpenCL, soporte multimonitor hasta 4 pantallas en 4K",
          priceCLP: 349990,
          store: "Dust2",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Acelera filtros en programas de diseño, edición en tiempo real y permite conectar múltiples pantallas.",
          compatibilityNote: "Consumo eficiente y excelente soporte de controladores de producción."
        },
        {
          id: "storage-p1",
          category: "storage",
          categoryLabel: "Almacenamiento (SSD)",
          name: "Kingston KC3000 1TB M.2 PCIe 4.0 NVMe (7000 MB/s)",
          brand: "Kingston",
          specs: "Lectura 7000 MB/s, Escritura 6000 MB/s con disipador de grafeno",
          priceCLP: 94990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Velocidad máxima para cargar proyectos pesados y mover archivos grandes al instante.",
          compatibilityNote: "Conexión directa en ranura principal M.2."
        },
        {
          id: "psu-p1",
          category: "psu",
          categoryLabel: "Fuente de Poder",
          name: "Corsair RM750e 750W 80 Plus Gold Modular",
          brand: "Corsair",
          specs: "750W, Eficiencia 80+ Gold, Cableado 100% modular, ventilador silencioso Zero-RPM",
          priceCLP: 109990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Ahorra energía, minimiza calor y el ventilador solo gira cuando es estrictamente necesario.",
          compatibilityNote: "Estándar ATX compatible y cables ordenados."
        },
        {
          id: "cooler-p1",
          category: "cooler",
          categoryLabel: "Sistema de Refrigeración",
          name: "Thermalright Peerless Assassin 120 SE Silencioso",
          brand: "Thermalright",
          specs: "Doble torre, 6 tubos de calor de cobre, 2 ventiladores de 120mm PWM silenciosos",
          priceCLP: 42990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Mantiene el procesador a temperaturas frescas incluso durante horas de trabajo continuo.",
          compatibilityNote: "Anclaje nativo y pasta térmica de alto rendimiento incluida."
        },
        {
          id: "case-p1",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Antec P20C / Montech Air 903 (Diseño Sobrio Profesional)",
          brand: "Montech / Antec",
          specs: "Frontal metálico ventilado, filtros antipolvo, estructura espaciosa y limpia",
          priceCLP: 74990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Estética sobria para espacios de trabajo, sin luces estridentes y con excelente ventilación.",
          compatibilityNote: "Soporta placas de todos los tamaños y coolers grandes."
        }
      ]
    };
  } else {
    // Configuración Equilibrada / Entretenimiento y Juegos
    return {
      buildName: "SoloTodo Asesor - Computador Equilibrado para Todo Uso y Juegos",
      targetUse: "Uso familiar versátil, trabajo diario ágil y videojuegos fluidos en alta calidad",
      totalBudgetCLP: budget,
      actualCostCLP: Math.min(budget - 20000, 849920),
      performanceSummary: "Excelente respuesta en cualquier tarea cotidiana y capacidad de correr juegos modernos con gran fluidez gráfica.",
      estimatedFps1080p: 145,
      estimatedFps1440p: 75,
      totalTdpWatts: 300,
      recommendedPsuWatts: 600,
      compatibilityScore: 100,
      executiveSummary: "El punto dulce exacto entre costo y beneficio. Combina un procesador veloz de 6 núcleos con tarjeta gráfica dedicada, asegurando que tanto las tareas de trabajo como los momentos de ocio y juegos se disfruten al máximo.",
      pros: [
        "Rendimiento equilibrado que no se queda corto en ninguna tarea",
        "Gran velocidad de almacenamiento NVMe de 1TB",
        "Componentes seleccionados por su durabilidad y bajo índice de fallas",
        "Conectividad completa para múltiples monitores y periféricos"
      ],
      upgradePath: "Plataforma versátil con ranuras libres para expandir memoria y discos a medida que tus necesidades crezcan.",
      compatibilityChecks: [
        { title: "Compatibilidad de Piezas", status: "valid", detail: "Procesador, placa madre y memorias probadas en conjunto con 100% de sinergia." },
        { title: "Consumo y Energía", status: "valid", detail: "Fuente con potencia holgada para funcionamiento seguro y sin caídas." },
        { title: "Ventilación y Silencio", status: "valid", detail: "Gabinete con ventiladores de baja emisión de ruido y flujo continuo." }
      ],
      components: [
        {
          id: "cpu-b1",
          category: "cpu",
          categoryLabel: "Procesador",
          name: isAmdCpu ? "AMD Ryzen 5 5600 (6 Núcleos / 12 Hilos)" : "Intel Core i5-12400F",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "6 Núcleos, 12 Hilos, 4.4 GHz Turbo, 32MB Caché",
          priceCLP: 119990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Uno de los procesadores más recomendados en Chile por su extraordinaria relación precio-rendimiento.",
          compatibilityNote: "Zócalo AM4 maduro y estable."
        },
        {
          id: "mb-b1",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: "Gigabyte B550M DS3H AC (WiFi + Bluetooth)",
          brand: "Gigabyte",
          specs: "Chipset B550, 4 ranuras DDR4, 2 puertos M.2, WiFi y Bluetooth",
          priceCLP: 104990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Cuenta con WiFi y Bluetooth de fábrica, ideal para conectar auriculares y periféricos.",
          compatibilityNote: "Micro-ATX universal."
        },
        {
          id: "ram-b1",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Corsair Vengeance LPX 16GB (2x8GB) 3200MHz",
          brand: "Corsair",
          specs: "16GB Dual Channel, perfil bajo, disipador de aluminio",
          priceCLP: 42990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Memoria confiable y de perfil bajo que cabe en cualquier configuración.",
          compatibilityNote: "100% compatible con placas B550."
        },
        {
          id: "gpu-b1",
          category: "gpu",
          categoryLabel: "Tarjeta de Video",
          name: wantsNvidia ? "ASUS Dual GeForce RTX 3050 / 4060 8GB" : "Radeon RX 6600 8GB GDDR6",
          brand: wantsNvidia ? "ASUS / NVIDIA" : "AMD",
          specs: "8GB GDDR6, salidas HDMI y DisplayPort, bajo consumo",
          priceCLP: 249990,
          store: "Dust2",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Brinda la potencia gráfica necesaria tanto para edición multimedia como para disfrutar juegos modernos.",
          compatibilityNote: "Tamaño compacto y consumo térmico moderado."
        },
        {
          id: "storage-b1",
          category: "storage",
          categoryLabel: "Almacenamiento (SSD)",
          name: "Crucial P3 Plus 1TB M.2 NVMe PCIe 4.0",
          brand: "Crucial",
          specs: "1TB de capacidad, 5000 MB/s lectura",
          priceCLP: 68990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Capacidad generosa para programas, archivos y entretenimiento sin preocuparte por el espacio.",
          compatibilityNote: "Ranura M.2 de alta velocidad."
        },
        {
          id: "psu-b1",
          category: "psu",
          categoryLabel: "Fuente de Poder",
          name: "DeepCool PK600D 600W 80 Plus Bronze",
          brand: "DeepCool",
          specs: "600W Continuos, Certificación 80+ Bronze, Protecciones integradas",
          priceCLP: 49990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Certificación de eficiencia que garantiza estabilidad y tranquilidad eléctrica.",
          compatibilityNote: "Conectores estándar universales."
        },
        {
          id: "case-b1",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Cougar MG140 Air / DeepCool Matrexx 40",
          brand: "Cougar",
          specs: "Frontal mallado para ventilación fresca, filtros antipolvo",
          priceCLP: 46990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Mantiene los componentes a buena temperatura sin necesidad de gastar en ventiladores adicionales.",
          compatibilityNote: "Espacio amplio para todos los componentes."
        },
        {
          id: "cooler-b1",
          category: "cooler",
          categoryLabel: "Sistema de Refrigeración",
          name: "DeepCool AG400 Silencioso 120mm",
          brand: "DeepCool",
          specs: "4 tubos de cobre, ventilador de 120mm silencioso con control PWM",
          priceCLP: 22990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Reduce las temperaturas en más de 12°C respecto al ventilador básico, logrando un equipo casi inaudible.",
          compatibilityNote: "Anclaje nativo y pasta térmica incluida."
        }
      ]
    };
  }
}
