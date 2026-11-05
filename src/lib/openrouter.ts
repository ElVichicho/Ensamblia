import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import { generateSmartFallbackBuild } from "./hardware-db";
import realCatalog from "@/data/solotodo-catalog.json";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

function getSampleCatalogContext(budget: number): string {
  try {
    const cats = realCatalog.categories as Record<string, Array<{
      id: number;
      name: string;
      priceCLP: number;
      socket?: string | null;
      tdp?: number | null;
      format?: string | null;
      solotodoUrl: string;
    }>>;

    let summary = "\n--- MUESTRA DEL CATÁLOGO REAL VIGENTE DE SOLOTODO (CHILE) ---\n";

    // CPUs
    summary += "PROCESADORES (CPUs):\n";
    (cats.cpu || []).slice(0, 10).forEach(c => {
      summary += `- [ID:${c.id}] ${c.name} | $${c.priceCLP} CLP | Socket: ${c.socket || "N/A"} | TDP: ${c.tdp || "65"}W | URL: ${c.solotodoUrl}\n`;
    });

    // Motherboards
    summary += "\nPLACAS MADRE:\n";
    (cats.motherboard || []).slice(0, 10).forEach(m => {
      summary += `- [ID:${m.id}] ${m.name} | $${m.priceCLP} CLP | Socket: ${m.socket || "N/A"} | Formato: ${m.format || "mATX"} | URL: ${m.solotodoUrl}\n`;
    });

    // GPUs
    summary += "\nTARJETAS DE VIDEO (GPUs):\n";
    (cats.gpu || []).slice(0, 10).forEach(g => {
      summary += `- [ID:${g.id}] ${g.name} | $${g.priceCLP} CLP | TDP: ${g.tdp || "150"}W | URL: ${g.solotodoUrl}\n`;
    });

    // RAM
    summary += "\nMEMORIAS RAM:\n";
    (cats.ram || []).slice(0, 6).forEach(r => {
      summary += `- [ID:${r.id}] ${r.name} | $${r.priceCLP} CLP | URL: ${r.solotodoUrl}\n`;
    });

    // Storage
    summary += "\nALMACENAMIENTO:\n";
    (cats.storage || []).slice(0, 6).forEach(s => {
      summary += `- [ID:${s.id}] ${s.name} | $${s.priceCLP} CLP | URL: ${s.solotodoUrl}\n`;
    });

    // PSUs
    summary += "\nFUENTES DE PODER:\n";
    (cats.psu || []).slice(0, 6).forEach(p => {
      summary += `- [ID:${p.id}] ${p.name} | $${p.priceCLP} CLP | URL: ${p.solotodoUrl}\n`;
    });

    // Cases
    summary += "\nGABINETES:\n";
    (cats.case || []).slice(0, 6).forEach(c => {
      summary += `- [ID:${c.id}] ${c.name} | $${c.priceCLP} CLP | URL: ${c.solotodoUrl}\n`;
    });

    // Coolers
    summary += "\nCOOLERS:\n";
    (cats.cooler || []).slice(0, 6).forEach(co => {
      summary += `- [ID:${co.id}] ${co.name} | $${co.priceCLP} CLP | URL: ${co.solotodoUrl}\n`;
    });

    summary += "--- FIN DEL CATÁLOGO ---\n";
    return summary;
  } catch (e) {
    return "";
  }
}

export async function requestBuildFromOpenRouter(
  filters: BuilderFilters,
  apiKey?: string,
  modelName: string = "google/gemma-4-31b-it:free"
): Promise<{ quote: BuildQuote; source: "openrouter" | "fallback"; modelUsed: string }> {
  const token = apiKey || process.env.OPENROUTER_API_KEY;

  if (!token) {
    console.log("No OpenRouter API key found. Using intelligent hardware engine fallback.");
    return {
      quote: generateSmartFallbackBuild(filters),
      source: "fallback",
      modelUsed: "Motor Experto SoloTodo (Local Fallback)"
    };
  }

  const catalogContext = getSampleCatalogContext(filters.budgetCLP);

  const systemPrompt = `
Eres el Asistente Experto de IA para SoloTodo (la plataforma líder en Chile de cotización de hardware y computadores).
Tu misión es diseñar la cotización de PC de escritorio más óptima, equilibrada y 100% libre de errores de compatibilidad de hardware para el usuario chileno.

${catalogContext}

REGLAS ESTRICTAS DE HARDWARE Y COMPATIBILIDAD:
1. Utiliza preferentemente los componentes reales del catálogo de SoloTodo listado arriba (con sus nombres exactos, precios y URLs).
2. Si requieres un componente adicional que no esté en la muestra, incluye un producto real vendido en Chile (con precios realistas en CLP y affiliateUrl apuntando a 'https://www.solotodo.cl').
3. Compatibilidad Absoluta:
   - Socket de CPU debe coincidir exactamente con el de la Placa Madre (ej: AM4 -> B450/B550/A520; AM5 -> A620/B650/X670; LGA1700 -> H610/B760/Z790).
   - Generación de RAM debe ser soportada por la Placa Madre (DDR4 con DDR4, DDR5 con DDR5).
   - La Fuente de Poder (PSU) debe tener potencia continua suficiente para el TDP total + 35% de margen, con certificación 80 Plus.
   - El Gabinete debe ser compatible con el factor de forma de la Placa Madre (ATX, Micro-ATX, Mini-ITX) y tener longitud suficiente para la GPU.
   - El disipador térmico debe soportar el TDP del procesador.
4. No superar el presupuesto indicado por el usuario (puede ser menor, pero no mayor).
5. Debes responder ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown innecesarios, sin explicaciones fuera del JSON.

Estructura JSON requerida:
{
  "buildName": "string",
  "targetUse": "string",
  "totalBudgetCLP": number,
  "actualCostCLP": number,
  "estimatedFps1080p": number,
  "estimatedFps1440p": number,
  "totalTdpWatts": number,
  "recommendedPsuWatts": number,
  "compatibilityScore": 100,
  "executiveSummary": "string",
  "pros": ["string", "string", "string"],
  "upgradePath": "string",
  "compatibilityChecks": [
    { "title": "Socket CPU y Placa Madre", "status": "valid", "detail": "string" },
    { "title": "Memoria RAM", "status": "valid", "detail": "string" },
    { "title": "Potencia de Fuente (PSU)", "status": "valid", "detail": "string" },
    { "title": "Dimensiones y Gabinete", "status": "valid", "detail": "string" },
    { "title": "Balance CPU-GPU", "status": "valid", "detail": "string" }
  ],
  "components": [
    {
      "id": "cpu",
      "category": "cpu",
      "categoryLabel": "Procesador (CPU)",
      "name": "string",
      "brand": "string",
      "specs": "string",
      "priceCLP": number,
      "store": "string",
      "affiliateUrl": "https://www.solotodo.cl",
      "aiReason": "string",
      "compatibilityNote": "string"
    }
  ]
}
`;

  const userPrompt = `
Genera una cotización optimizada para:
- Presupuesto máximo: $${filters.budgetCLP.toLocaleString('es-CL')} CLP
- Caso de uso principal: ${filters.useCase}
- Preferencia de Procesador (CPU): ${filters.cpuPreference}
- Preferencia de Gráfica (GPU): ${filters.gpuPreference}
- Almacenamiento deseado: Capacidad ${filters.storageCapacity || '1tb'}, Tipo ${filters.storageType === 'nvme' ? 'M.2 NVMe PCIe' : filters.storageType === 'sata' ? 'SATA SSD 2.5"' : 'El mejor según presupuesto'}
- Memoria RAM objetivo: ${filters.ramCapacity || '16gb'}
- Conectividad WiFi integrada en Placa Madre: ${filters.wifiRequired ? 'OBLIGATORIO que la placa madre incluya WiFi' : 'Opcional'}
- Tipo de Refrigeración: ${filters.coolingPreference === 'liquid' ? 'Refrigeración Líquida (AIO)' : filters.coolingPreference === 'air' ? 'Disipador por aire de torre' : 'La más costo-eficiente'}
- Tamaño de Gabinete: ${filters.caseSize === 'compact' ? 'Compacto (Micro-ATX / Mini-ITX)' : 'Estándar (Mid-Tower ATX)'}
- Instrucciones especiales del usuario: ${filters.customInstructions || "Ninguna adicional"}
`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "HTTP-Referer": "https://solotodo-ai.vercel.app",
        "X-Title": "SoloTodo AI PC Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API error:", response.status, errText);
      return {
        quote: generateSmartFallbackBuild(filters),
        source: "fallback",
        modelUsed: `${modelName} (Error API -> Fallback activado)`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Respuesta vacía de OpenRouter");
    }

    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsedQuote: BuildQuote = JSON.parse(cleaned);
    return {
      quote: parsedQuote,
      source: "openrouter",
      modelUsed: modelName
    };
  } catch (error) {
    console.error("Error al procesar con OpenRouter:", error);
    return {
      quote: generateSmartFallbackBuild(filters),
      source: "fallback",
      modelUsed: `${modelName} (Error parsing -> Fallback activado)`
    };
  }
}
