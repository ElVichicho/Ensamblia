import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
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

    let summary = "\n--- MUESTRA DE COMPONENTES REALES EN SOLOTODO CHILE ---\n";

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
    (cats.gpu || []).slice(0, 8).forEach(g => {
      summary += `- [ID:${g.id}] ${g.name} | $${g.priceCLP} CLP | TDP: ${g.tdp || "150"}W | URL: ${g.solotodoUrl}\n`;
    });

    // RAM
    summary += "\nMEMORIAS RAM:\n";
    (cats.ram || []).slice(0, 5).forEach(r => {
      summary += `- [ID:${r.id}] ${r.name} | $${r.priceCLP} CLP | URL: ${r.solotodoUrl}\n`;
    });

    // Storage
    summary += "\nALMACENAMIENTO:\n";
    (cats.storage || []).slice(0, 5).forEach(s => {
      summary += `- [ID:${s.id}] ${s.name} | $${s.priceCLP} CLP | URL: ${s.solotodoUrl}\n`;
    });

    // PSUs
    summary += "\nFUENTES DE PODER:\n";
    (cats.psu || []).slice(0, 5).forEach(p => {
      summary += `- [ID:${p.id}] ${p.name} | $${p.priceCLP} CLP | URL: ${p.solotodoUrl}\n`;
    });

    // Cases
    summary += "\nGABINETES:\n";
    (cats.case || []).slice(0, 5).forEach(c => {
      summary += `- [ID:${c.id}] ${c.name} | $${c.priceCLP} CLP | URL: ${c.solotodoUrl}\n`;
    });

    // Coolers
    summary += "\nCOOLERS:\n";
    (cats.cooler || []).slice(0, 5).forEach(co => {
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
): Promise<{ quote: BuildQuote; modelUsed: string }> {
  const token = apiKey || process.env.OPENROUTER_API_KEY;

  if (!token || token.trim() === "") {
    throw new Error(
      "No se ha encontrado la clave de API (OPENROUTER_API_KEY). Por favor verifica que la variable esté configurada en Vercel Settings > Environment Variables."
    );
  }

  const catalogContext = getSampleCatalogContext(filters.budgetCLP);

  const instructions = `
Eres el Asistente Experto y Asesor Virtual de Hardware para SoloTodo (Chile).
Diseña la cotización de computador más equilibrada, confiable y 100% libre de errores de compatibilidad física para el mercado chileno.

${catalogContext}

REGLAS ESTRICTAS:
1. Adapta el armado al uso seleccionado:
   - Oficina / Hogar: Prioriza estabilidad, silencio, bajo consumo y velocidad de arranque (SSD), usando gráficos integrados o tarjeta eficiente sin sobrecosto.
   - Diseño / Edición: Prioriza 32GB+ de RAM, núcleos de CPU y aceleración gráfica.
   - Juegos: Prioriza equilibrio CPU-GPU con alta fluidez.
   - Programación / IA: Prioriza núcleos, RAM y potencia de cómputo.
2. Utiliza preferentemente los componentes reales del catálogo de SoloTodo listado arriba (con nombres, precios y URLs reales).
3. Precios en Pesos Chilenos (CLP) sin superar el presupuesto máximo.
4. Compatibilidad 100%: Zócalo CPU = Placa Madre (AM4, AM5, LGA1700), tipo de RAM soportado (DDR4/DDR5), fuente con más de 30% de holgura.
5. FORMATO DE SALIDA: Debes responder ÚNICAMENTE con el objeto JSON válido. NO agregues introducciones, comentarios ni texto fuera del JSON.

Estructura JSON requerida:
{
  "buildName": "string",
  "targetUse": "string",
  "totalBudgetCLP": number,
  "actualCostCLP": number,
  "performanceSummary": "string",
  "estimatedFps1080p": number,
  "estimatedFps1440p": number,
  "totalTdpWatts": number,
  "recommendedPsuWatts": number,
  "compatibilityScore": 100,
  "executiveSummary": "string",
  "pros": ["string", "string", "string"],
  "upgradePath": "string",
  "compatibilityChecks": [
    { "title": "string", "status": "valid", "detail": "string" },
    { "title": "string", "status": "valid", "detail": "string" },
    { "title": "string", "status": "valid", "detail": "string" }
  ],
  "components": [
    {
      "id": "string",
      "category": "cpu",
      "categoryLabel": "Procesador",
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
Genera la cotización en JSON para:
- Presupuesto máximo: $${filters.budgetCLP.toLocaleString('es-CL')} CLP
- Propósito principal: ${filters.useCase}
- Preferencia de Procesador: ${filters.cpuPreference}
- Preferencia de Gráficos: ${filters.gpuPreference}
- Almacenamiento: Capacidad ${filters.storageCapacity || '1tb'}, Formato ${filters.storageType === 'nvme' ? 'M.2 NVMe' : filters.storageType === 'sata' ? 'SATA SSD' : 'Óptimo'}
- Memoria RAM: ${filters.ramCapacity || '16gb'}
- WiFi y Bluetooth integrado: ${filters.wifiRequired ? 'Sí, requerido en placa' : 'Opcional'}
- Refrigeración: ${filters.coolingPreference === 'liquid' ? 'Líquida AIO' : 'Disipador por Aire'}
- Chasis: ${filters.caseSize === 'compact' ? 'Compacto Micro-ATX' : 'Estándar ATX'}
- Instrucciones especiales: ${filters.customInstructions || 'Ninguna'}
`;

  // Modelos a intentar en caso de rate-limit en la capa gratuita
  const modelsToTry = [
    modelName,
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "cohere/north-mini-code:free"
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicar

  let lastError = "";

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Intentando consulta con modelo: ${currentModel}...`);

      // Nota: Para compatibilidad universal (especialmente con Gemma y Nemotron),
      // fusionamos las instrucciones en el mensaje de usuario para evitar errores de provider con 'role: system'.
      const fullPrompt = `${instructions}\n\n---\nSOLICITUD DEL USUARIO:\n${userPrompt}`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.trim()}`,
          "HTTP-Referer": "https://solotodo-ai.vercel.app",
          "X-Title": "SoloTodo AI PC Builder",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: "user", content: fullPrompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Error en OpenRouter con ${currentModel} (${response.status}):`, errText);
        lastError = `OpenRouter (${response.status}): ${errText}`;
        // Si es 401 (clave inválida), no tiene sentido seguir reintentando con otros modelos
        if (response.status === 401) {
          throw new Error(`Clave de OpenRouter no válida (401 Unauthorized): ${errText}`);
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim() === "") {
        lastError = "El modelo devolvió una respuesta vacía.";
        continue;
      }

      // Extraer bloque JSON con expresión regular segura
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No se encontró JSON válido en el texto devuelto:", content);
        lastError = "La IA no devolvió un JSON válido.";
        continue;
      }

      const parsedQuote: BuildQuote = JSON.parse(jsonMatch[0]);

      // Validar que tenga componentes
      if (!parsedQuote.components || parsedQuote.components.length === 0) {
        lastError = "El JSON generado no contiene lista de componentes.";
        continue;
      }

      return {
        quote: parsedQuote,
        modelUsed: currentModel
      };
    } catch (err: any) {
      if (err.message && err.message.includes("401")) {
        throw err;
      }
      lastError = err.message || String(err);
    }
  }

  // Si fallaron todos los intentos, lanzar el error real sin inventar respuestas genéricas
  throw new Error(`No fue posible generar la cotización con la IA de OpenRouter. Detalle: ${lastError}`);
}
