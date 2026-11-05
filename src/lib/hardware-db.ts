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

  if (budget < 600000) {
    // Económico / Entrada (eSports 1080p)
    return {
      buildName: "SoloTodo AI - Configuración Entrada eSports 1080p",
      targetUse: "Juegos competitivos (CS2, Valorant, LoL, Fortnite) y tareas universitarias",
      totalBudgetCLP: budget,
      actualCostCLP: 489930,
      estimatedFps1080p: 120,
      estimatedFps1440p: 45,
      totalTdpWatts: 220,
      recommendedPsuWatts: 500,
      compatibilityScore: 100,
      executiveSummary: "Configuración altamente optimizada costo/rendimiento con socket AM4 de gran madurez. Excelente fluidez en juegos tácticos y respuesta ágil en multitarea.",
      pros: [
        "Relación precio/rendimiento insuperable para 1080p",
        "Bajo consumo energético (menos de 250W a plena carga)",
        "Plataforma estable con memoria RAM en Dual Channel 3200MHz"
      ],
      upgradePath: "Posibilidad de mejorar a Ryzen 7 5700X3D o actualizar tarjeta gráfica a RTX 4060 a futuro sin cambiar la placa.",
      compatibilityChecks: [
        { title: "Zócalo CPU y Placa Madre", status: "valid", detail: "Socket AM4 100% compatible entre Ryzen 5 5500 y placa A520M (BIOS actualizada de fábrica)." },
        { title: "Memoria RAM", status: "valid", detail: "2x8GB DDR4 3200MHz operando en Dual Channel con soporte XMP." },
        { title: "Potencia de Fuente (PSU)", status: "valid", detail: "Consumo total 220W. Fuente de 550W 80+ Bronze entrega 150% de margen seguro." },
        { title: "Factor de Forma y Dimensiones", status: "valid", detail: "Placa Micro-ATX y GPU de 200mm caben perfectamente en gabinete Micro-ATX/ATX." },
        { title: "Balance CPU-GPU (Cuello de botella)", status: "valid", detail: "Índice de cuello de botella estimado en 4.2% (rango óptimo menor a 8%)." }
      ],
      components: [
        {
          id: "cpu-1",
          category: "cpu",
          categoryLabel: "Procesador (CPU)",
          name: isAmdCpu ? "AMD Ryzen 5 5500 (6C/12T hasta 4.2GHz)" : "Intel Core i3-12100F (4C/8T hasta 4.3GHz)",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "6 Núcleos, 12 Hilos, 19MB Caché, 65W TDP",
          priceCLP: 84990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Mejor relación calidad/precio para presupuestos ajustados en Chile.",
          compatibilityNote: "Socket AM4 nativo, cooler Wraith Stealth incluido."
        },
        {
          id: "mb-1",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: isAmdCpu ? "MSI A520M-A PRO Micro-ATX" : "ASRock H610M-HDV/M.2 Micro-ATX",
          brand: isAmdCpu ? "MSI" : "ASRock",
          specs: "Chipset A520, 2x DDR4 DIMM, 1x M.2 PCIe 3.0 NVMe",
          priceCLP: 59990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Económica y confiable para procesadores de 65W sin overclock.",
          compatibilityNote: "Formato Micro-ATX compatible con el gabinete."
        },
        {
          id: "ram-1",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Kingston FURY Beast 16GB (2x8GB) DDR4 3200MHz CL16",
          brand: "Kingston",
          specs: "16GB Dual Channel, CL16, Disipador de aluminio negro",
          priceCLP: 38990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "El Dual Channel es fundamental para evitar caídas de FPS mínimos.",
          compatibilityNote: "Perfil XMP 2.0 soportado por la placa."
        },
        {
          id: "gpu-1",
          category: "gpu",
          categoryLabel: "Tarjeta de Video (GPU)",
          name: wantsNvidia ? "Gigabyte GeForce GTX 1650 D6 OC 4GB" : "PowerColor Radeon RX 6500 XT ITX 4GB",
          brand: wantsNvidia ? "NVIDIA / Gigabyte" : "AMD / PowerColor",
          specs: "4GB GDDR6, 1x HDMI, 1x DisplayPort, perfil compacto",
          priceCLP: 154990,
          store: "Dust2",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "GPU accesible para superar 100 FPS en shooters competitivos en 1080p.",
          compatibilityNote: "Largo de 170mm, entra en cualquier gabinete."
        },
        {
          id: "storage-1",
          category: "storage",
          categoryLabel: "Almacenamiento (SSD)",
          name: "Kingston NV2 1TB M.2 PCIe 4.0 NVMe (hasta 3500 MB/s)",
          brand: "Kingston",
          specs: "1TB de capacidad, Lectura 3500MB/s, Escritura 2100MB/s",
          priceCLP: 54990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Excelente capacidad para sistema operativo y más de 5 juegos modernos.",
          compatibilityNote: "Compatible con el puerto M.2 de la placa."
        },
        {
          id: "psu-1",
          category: "psu",
          categoryLabel: "Fuente de Poder (PSU)",
          name: "DeepCool PK550D 550W 80 Plus Bronze",
          brand: "DeepCool",
          specs: "550W Continuos, Certificación 80+ Bronze, Protecciones OVP/OPP/SCP",
          priceCLP: 42990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Certificación comprobada y potencia de sobra para futuras mejoras.",
          compatibilityNote: "Conector ATX 24 pines y EPS 8 pines estándar."
        },
        {
          id: "case-1",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Cougar MG140 Air RGB Micro-ATX (3 Ventiladores ARGB incluidos)",
          brand: "Cougar",
          specs: "Frontal mallado (Mesh), Vidrio templado lateral, 3x Fans ARGB",
          priceCLP: 47990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Flujo de aire excepcional de fábrica sin tener que comprar fans extras.",
          compatibilityNote: "Soporta placas Micro-ATX y disipadores de hasta 160mm."
        },
        {
          id: "cooler-1",
          category: "cooler",
          categoryLabel: "Disipador CPU",
          name: "Cooler AMD Wraith Stealth (Incluido en caja de CPU)",
          brand: "AMD",
          specs: "Ventilador silencioso con pasta térmica preaplicada",
          priceCLP: 0,
          store: "Incluido con CPU",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Ahorro directo de $25.000 CLP aprovechando el cooler de fábrica suficiente para 65W.",
          compatibilityNote: "Anclaje nativo AM4."
        }
      ]
    };
  } else if (budget < 1200000) {
    // Media Gama / Gamer 1080p Ultra y 1440p
    return {
      buildName: "SoloTodo AI - Configuración Gamer Balanceada 1080p/1440p",
      targetUse: "Gaming en ultra con Ray Tracing / DLSS, streaming en Twitch y edición de video",
      totalBudgetCLP: budget,
      actualCostCLP: 894920,
      estimatedFps1080p: 165,
      estimatedFps1440p: 85,
      totalTdpWatts: 320,
      recommendedPsuWatts: 650,
      compatibilityScore: 100,
      executiveSummary: "Plataforma de alto rendimiento con el legendario Ryzen 5 5600 emparejado con una potente RTX 4060 / RX 7600. Ideal para jugar a más de 100 FPS en calidad Ultra.",
      pros: [
        "Soporte completo para DLSS 3.5 / Frame Generation o FSR 3",
        "Fuente 650W 80+ Bronze con margen para tarjetas de hasta 220W",
        "Disipador de torre con 4 heatpipes que mantiene temperaturas bajo 62°C",
        "1TB NVMe de alta velocidad Gen4"
      ],
      upgradePath: "Soporta salto a 32GB de RAM mediante 2 ranuras libres y tarjetas gráficas serie 4070.",
      compatibilityChecks: [
        { title: "Zócalo CPU y Chipset", status: "valid", detail: "Socket AM4 en placa B550 con soporte PCIe 4.0 para aprovechar el 100% del ancho de banda de la GPU." },
        { title: "Memoria RAM", status: "valid", detail: "16GB (2x8GB) 3600MHz CL18 operando en el punto dulce de frecuencia del Infinity Fabric de Ryzen." },
        { title: "Potencia de Fuente", status: "valid", detail: "Consumo total 320W. Fuente 650W opera en su curva óptima de eficiencia (50%)." },
        { title: "Dimensiones y Ventilación", status: "valid", detail: "Gabinete ATX con 390mm de clearance para GPU y disipador de 155mm garantizado." },
        { title: "Refrigeración", status: "valid", detail: "Disipador DeepCool AG400 con capacidad de disipación de hasta 220W TDP (CPU demanda 65W)." }
      ],
      components: [
        {
          id: "cpu-2",
          category: "cpu",
          categoryLabel: "Procesador (CPU)",
          name: isAmdCpu ? "AMD Ryzen 5 5600 (6C/12T hasta 4.4GHz PCIe 4.0)" : "Intel Core i5-12400F (6C/12T hasta 4.4GHz)",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "6 Núcleos, 12 Hilos, 32MB L3 Caché, 65W TDP",
          priceCLP: 119990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "El procesador rey en rendimiento por peso para juegos modernos.",
          compatibilityNote: "Socket AM4, PCIe 4.0 habilitado."
        },
        {
          id: "mb-2",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: isAmdCpu ? "Gigabyte B550M DS3H AC (WiFi + Bluetooth)" : "MSI PRO B760M-P DDR4",
          brand: isAmdCpu ? "Gigabyte" : "MSI",
          specs: "Chipset B550, 4x DDR4, 2x M.2 NVMe, WiFi AC + BT integrado",
          priceCLP: 104990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Incluye WiFi y Bluetooth integrados, ahorrando la compra de adaptadores.",
          compatibilityNote: "Formato Micro-ATX, 4 slots de RAM para expansión."
        },
        {
          id: "ram-2",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Corsair Vengeance LPX 16GB (2x8GB) DDR4 3600MHz CL18",
          brand: "Corsair",
          specs: "16GB Dual Channel, 3600MHz, Perfil bajo compatible con cualquier cooler",
          priceCLP: 44990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Frecuencia de 3600MHz optimizada para exprimir los FPS en procesadores Ryzen.",
          compatibilityNote: "100% compatible con placas B550."
        },
        {
          id: "gpu-2",
          category: "gpu",
          categoryLabel: "Tarjeta de Video (GPU)",
          name: wantsNvidia ? "ASUS Dual GeForce RTX 4060 OC 8GB GDDR6" : "Sapphire Pulse Radeon RX 7600 8GB GDDR6",
          brand: wantsNvidia ? "ASUS / NVIDIA" : "Sapphire / AMD",
          specs: "8GB GDDR6, DLSS 3 Frame Generation / FSR 3, Ray Tracing, 115W TDP",
          priceCLP: 349990,
          store: "Dust2",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Excelente eficiencia energética y tecnologías de escalado DLSS 3.5.",
          compatibilityNote: "Requiere 1 conector PCIe 8 pines, largo de 227mm."
        },
        {
          id: "storage-2",
          category: "storage",
          categoryLabel: "Almacenamiento (SSD)",
          name: "Crucial P3 Plus 1TB M.2 PCIe 4.0 NVMe",
          brand: "Crucial",
          specs: "Lectura hasta 5000 MB/s, Escritura 4200 MB/s, Micron 3D NAND",
          priceCLP: 68990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Aprovecha la velocidad Gen4 para tiempos de carga casi instantáneos.",
          compatibilityNote: "Conector M.2 2280 estándar."
        },
        {
          id: "psu-2",
          category: "psu",
          categoryLabel: "Fuente de Poder (PSU)",
          name: "MSI MAG A650BN 650W 80 Plus Bronze",
          brand: "MSI",
          specs: "650W Reales, Circuito DC-DC, Certificación 80+ Bronze, 5 años garantía",
          priceCLP: 56990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Tier B en la lista de confiabilidad de fuentes con protecciones completas.",
          compatibilityNote: "Cables mallados, potencia holgada."
        },
        {
          id: "cooler-2",
          category: "cooler",
          categoryLabel: "Disipador CPU",
          name: "DeepCool AG400 ARGB 120mm",
          brand: "DeepCool",
          specs: "4 Heatpipes de cobre, ventilador PWM 120mm silencioso, iluminación ARGB",
          priceCLP: 24990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Reduce las temperaturas en más de 15°C respecto al cooler de stock.",
          compatibilityNote: "Anclaje nativo AM4 / LGA1700 con pasta térmica incluida."
        },
        {
          id: "case-2",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Antec NX292 ARGB Mesh (4 Ventiladores ARGB incluidos)",
          brand: "Antec",
          specs: "Frontal de malla metálica de alta ventilación, panel de cristal templado lateral",
          priceCLP: 48990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Viene con 4 ventiladores incluidos, excelente relación estética/precio.",
          compatibilityNote: "Soporta GPUs de hasta 320mm y coolers de 155mm."
        }
      ]
    };
  } else {
    // Alta Gama / Entusiasta (1440p/4K, Creación de Contenido, IA)
    return {
      buildName: "SoloTodo AI - Configuración Elite AM5 / RTX 4070 Super",
      targetUse: "Gaming 1440p/4K en Ultra, Renderizado 3D, Streaming profesional e IA local",
      totalBudgetCLP: budget,
      actualCostCLP: 1479920,
      estimatedFps1080p: 240,
      estimatedFps1440p: 140,
      totalTdpWatts: 430,
      recommendedPsuWatts: 750,
      compatibilityScore: 100,
      executiveSummary: "Plataforma de última generación con socket AM5 y memoria DDR5 de 6000MHz. Potenciada con la RTX 4070 Super con núcleos Tensor para IA y aceleración gráfica de gama alta.",
      pros: [
        "Plataforma AM5 con soporte confirmado por AMD hasta más allá de 2027",
        "Memoria ultra rápida DDR5 6000MHz CL30 con perfil AMD EXPO",
        "12GB VRAM GDDR6X ideal para texturas Ultra y modelos de IA locales",
        "Fuente 750W Gold con conector nativo PCIe 5.0 (12VHPWR)"
      ],
      upgradePath: "Soporta futuras generaciones de procesadores Ryzen 9000 X3D sin cambiar la placa madre.",
      compatibilityChecks: [
        { title: "Zócalo CPU y Memoria DDR5", status: "valid", detail: "Socket AM5 en chipset B650 emparejado con RAM DDR5 EXPO certificada a 6000MHz CL30." },
        { title: "Alimentación GPU de Nueva Generación", status: "valid", detail: "Fuente incluye conector nativo 12V-2x6 / 12VHPWR de 450W para la RTX 4070 Super." },
        { title: "Refrigeración Térmica", status: "valid", detail: "Disipador de doble torre Thermalright Peerless Assassin 120 SE soporta hasta 265W de TDP." },
        { title: "Espacio de Chasis", status: "valid", detail: "Gabinete soporta tarjetas gráficas de hasta 410mm; la GPU mide 267mm." },
        { title: "Cuello de Botella CPU-GPU", status: "valid", detail: "Sinergia del 99.1% en resoluciones 1440p y 4K." }
      ],
      components: [
        {
          id: "cpu-3",
          category: "cpu",
          categoryLabel: "Procesador (CPU)",
          name: isAmdCpu ? "AMD Ryzen 5 7600X (6C/12T hasta 5.3GHz Zen 4)" : "Intel Core i5-14600KF (14C/20T hasta 5.3GHz)",
          brand: isAmdCpu ? "AMD" : "Intel",
          specs: "6 Núcleos / 12 Hilos Zen 4, 38MB Caché, Gráficos RDNA2 integrados, 105W TDP",
          priceCLP: 219990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Rendimiento gaming monstruoso en plataforma AM5 preparada para el futuro.",
          compatibilityNote: "Socket AM5, requiere memoria DDR5."
        },
        {
          id: "mb-3",
          category: "motherboard",
          categoryLabel: "Placa Madre",
          name: "ASRock B650M-HDV/M.2 AM5",
          brand: "ASRock",
          specs: "VRM 8+2+1 fases 50A Dr.MOS, 1x Blazing M.2 PCIe 5.0, 1x Hyper M.2 PCIe 4.0",
          priceCLP: 139990,
          store: "Infor-Ingen",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Los mejores VRM y disipación en su rango de precio, capaz de aguantar un Ryzen 9.",
          compatibilityNote: "Soporta DDR5 hasta 7200+ (OC)."
        },
        {
          id: "ram-3",
          category: "ram",
          categoryLabel: "Memoria RAM",
          name: "Kingston FURY Beast DDR5 32GB (2x16GB) 6000MHz CL30 AMD EXPO",
          brand: "Kingston",
          specs: "32GB Dual Channel, 6000 MT/s, Latencia ultra baja CL30, Certificación EXPO",
          priceCLP: 118990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Punto dulce exacto (sweet spot) de latencia y velocidad para AMD Zen 4.",
          compatibilityNote: "Perfil EXPO se activa con un clic en la BIOS."
        },
        {
          id: "gpu-3",
          category: "gpu",
          categoryLabel: "Tarjeta de Video (GPU)",
          name: wantsNvidia ? "PNY GeForce RTX 4070 Super 12GB Verto Dual Fan" : "PowerColor Hellhound Radeon RX 7800 XT 16GB",
          brand: wantsNvidia ? "PNY / NVIDIA" : "PowerColor / AMD",
          specs: "12GB GDDR6X, 7168 CUDA Cores, DLSS 3.5 con Ray Reconstruction, 220W TDP",
          priceCLP: 669990,
          store: "Dust2",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "La tarjeta gráfica más equilibrada para jugar en 1440p Ultra y entrenar modelos de IA.",
          compatibilityNote: "Requiere conector 16 pines 12VHPWR o adaptador dual 8 pines incluido."
        },
        {
          id: "storage-3",
          category: "storage",
          categoryLabel: "Almacenamiento (SSD)",
          name: "Kingston KC3000 1TB M.2 PCIe 4.0 NVMe",
          brand: "Kingston",
          specs: "Velocidad extrema de 7000 MB/s lectura y 6000 MB/s escritura con disipador de grafeno",
          priceCLP: 94990,
          store: "Winpy",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Rendimiento tope de gama PCIe 4.0 con controlador Phison E18 de alta durabilidad.",
          compatibilityNote: "Instalable en la ranura principal M.2 de la placa."
        },
        {
          id: "psu-3",
          category: "psu",
          categoryLabel: "Fuente de Poder (PSU)",
          name: "Corsair RM750e 750W 80 Plus Gold Modular ATX 3.0",
          brand: "Corsair",
          specs: "750W, Certificación 80+ Gold, 100% Modular, Estándar ATX 3.0 con cable PCIe 5.0",
          priceCLP: 109990,
          store: "SpDigital",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Totalmente modular para un armado limpio y eficiencia Gold que ahorra en la cuenta de luz.",
          compatibilityNote: "Incluye cable directo para tarjetas NVIDIA serie 40."
        },
        {
          id: "cooler-3",
          category: "cooler",
          categoryLabel: "Disipador CPU",
          name: "Thermalright Peerless Assassin 120 SE ARGB",
          brand: "Thermalright",
          specs: "Doble torre, 6 heatpipes AGHP, 2 ventiladores PWM 120mm silenciosos",
          priceCLP: 42990,
          store: "Central Gamer",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Rendimiento similar a una refrigeración líquida de 240mm por una fracción de su costo.",
          compatibilityNote: "Anclaje nativo AM5 con pasta térmica TF7 de alta conductividad."
        },
        {
          id: "case-3",
          category: "case",
          categoryLabel: "Gabinete",
          name: "Montech AIR 903 MAX (4 Ventiladores PWM 140mm incluidos)",
          brand: "Montech",
          specs: "Frontal Ultra-Mesh, 3x fans frontales 140mm ARGB + 1x trasero 140mm, soporte E-ATX",
          priceCLP: 82990,
          store: "PC Factory",
          affiliateUrl: "https://www.solotodo.cl",
          aiReason: "Considerado internacionalmente el mejor gabinete por precio y flujo de aire térmico.",
          compatibilityNote: "Espacio de sobra para cualquier disipador y tarjeta gráfica gigante."
        }
      ]
    };
  }
}
