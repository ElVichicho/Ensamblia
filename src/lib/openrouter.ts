import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import realCatalog from "@/data/solotodo-catalog.json";

export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";

export const OPENROUTER_RATE_LIMIT_MESSAGE =
  "OpenRouter alcanzó el límite temporal de uso gratuito. Espera antes de volver a intentar.";

export function getFreeOpenRouterModel() {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  return configured?.endsWith(":free") ? configured : DEFAULT_OPENROUTER_MODEL;
}

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
      summary += `- [ID:${c.id}] ${c.name} | $${c.priceCLP} CLP | Socket: ${c.socket || "N/A"} | TDP: ${c.tdp ?? "desconocido"}W | URL: ${c.solotodoUrl}\n`;
    });

    // Motherboards
    summary += "\nPLACAS MADRE:\n";
    (cats.motherboard || []).slice(0, 10).forEach(m => {
      summary += `- [ID:${m.id}] ${m.name} | $${m.priceCLP} CLP | Socket: ${m.socket || "N/A"} | Formato: ${m.format || "desconocido"} | URL: ${m.solotodoUrl}\n`;
    });

    // GPUs
    summary += "\nTARJETAS DE VIDEO (GPUs):\n";
    (cats.gpu || []).slice(0, 8).forEach(g => {
      summary += `- [ID:${g.id}] ${g.name} | $${g.priceCLP} CLP | TDP: ${g.tdp ?? "desconocido"}W | URL: ${g.solotodoUrl}\n`;
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
  modelName = DEFAULT_OPENROUTER_MODEL
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
Diseña una cotización equilibrada para el mercado chileno. Señala con status warning cualquier compatibilidad que los datos no permitan verificar.

${catalogContext}

REGLAS ESTRICTAS:
1. Adapta el armado al uso seleccionado:
   - Oficina / Hogar: Prioriza estabilidad, silencio, bajo consumo y velocidad de arranque (SSD), usando gráficos integrados o tarjeta eficiente sin sobrecosto.
   - Diseño / Edición: Prioriza 32GB+ de RAM, núcleos de CPU y aceleración gráfica.
   - Juegos: Prioriza equilibrio CPU-GPU con alta fluidez.
   - Programación / IA: Prioriza núcleos, RAM y potencia de cómputo.
2. Utiliza preferentemente los componentes reales del catálogo de SoloTodo listado arriba (con nombres, precios y URLs reales).
3. Precios en Pesos Chilenos (CLP) sin superar el presupuesto máximo.
4. Comprueba compatibilidad: Zócalo CPU = Placa Madre (AM4, AM5, LGA1700), tipo de RAM soportado (DDR4/DDR5), fuente con más de 30% de holgura.
5. Incluye cpu, motherboard, ram, storage, psu y case, además de gpu y cooler cuando sean necesarios. Los campos descriptivos deben tener como máximo 20 palabras. No inventes FPS sin mediciones.
6. FORMATO DE SALIDA: Debes responder ÚNICAMENTE con el objeto JSON válido. NO agregues texto fuera del JSON. Usa una frase breve por campo descriptivo.

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
  "compatibilityScore": number,
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

  const modelsToTry = [modelName];
  let lastError = "";

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Intentando consulta con modelo: ${currentModel}...`);

      const fullPrompt = `${instructions}\n\n---\nSOLICITUD DEL USUARIO:\n${userPrompt}`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "HTTP-Referer": "https://solotodo-aiproject.vercel.app",
          "X-Title": "SoloTodo AI PC Builder",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [{ role: "user", content: fullPrompt }],
          temperature: 0.2,
          max_tokens: 3200,
          ...(currentModel === DEFAULT_OPENROUTER_MODEL && {
            reasoning: { enabled: false },
          }),
          ...(currentModel === "openrouter/free" && {
            response_format: { type: "json_object" },
          }),
        }),
        signal: AbortSignal.timeout(45000),
      });
      const rawResponseText = await response.text();

      if (response.status === 429) throw new Error(OPENROUTER_RATE_LIMIT_MESSAGE);

      if (!response.ok) {
        console.error(`Error en OpenRouter con ${currentModel} (${response.status}):`, rawResponseText);
        lastError = `OpenRouter (${response.status}): ${rawResponseText.slice(0, 200)}`;
        if (response.status === 401) {
          throw new Error(`Clave de OpenRouter no válida (401 Unauthorized): ${rawResponseText}`);
        }
        continue;
      }

      let data: any;
      try {
        data = JSON.parse(rawResponseText);
      } catch {
        lastError = `El proveedor envió texto en vez de JSON: ${rawResponseText.slice(0, 150)}`;
        continue;
      }

      if (data.error) {
        lastError = `Error de API: ${data.error.message || JSON.stringify(data.error)}`;
        continue;
      }

      if (data.choices?.[0]?.finish_reason === "length") {
        throw new Error("La IA agotó el límite de salida antes de completar la cotización.");
      }
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim() === "") {
        lastError = "El modelo devolvió una respuesta vacía.";
        continue;
      }

      // Extraer bloque JSON con expresión regular segura
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No se encontró JSON válido en el texto devuelto:", content);
        lastError = "La IA no devolvió un JSON con la estructura esperada.";
        continue;
      }

      const parsedQuote: BuildQuote = JSON.parse(jsonMatch[0]);

      // Reject partial responses before passing them to the UI.
      if (!Array.isArray(parsedQuote.components) || parsedQuote.components.length === 0) {
        lastError = "El JSON generado no contiene lista de componentes.";
        continue;
      }

      const textFields = ["buildName", "targetUse", "performanceSummary", "executiveSummary", "upgradePath"] as const;
      const numericFields = ["totalBudgetCLP", "actualCostCLP", "totalTdpWatts", "recommendedPsuWatts", "compatibilityScore"] as const;
      if (textFields.some(key => typeof parsedQuote[key] !== "string") ||
          numericFields.some(key => !Number.isFinite(parsedQuote[key])) ||
          !Array.isArray(parsedQuote.pros) ||
          !Array.isArray(parsedQuote.compatibilityChecks)) {
        throw new Error("La cotización de la IA está incompleta.");
      }
      if (parsedQuote.components.some(item =>
        !item || !["cpu", "motherboard", "ram", "gpu", "storage", "psu", "case", "cooler"].includes(item.category) ||
        !Number.isFinite(item.priceCLP) || item.priceCLP <= 0 ||
        ["id", "categoryLabel", "name", "brand", "specs", "store", "affiliateUrl", "aiReason", "compatibilityNote"]
          .some(key => typeof item[key as keyof typeof item] !== "string")
      )) {
        throw new Error("La IA devolvió componentes con datos incompletos.");
      }
      const required = ["cpu", "motherboard", "ram", "storage", "psu", "case"];
      if (required.some(category => !parsedQuote.components.some(item => item.category === category))) {
        throw new Error("La IA omitió componentes esenciales del equipo.");
      }
      parsedQuote.actualCostCLP = parsedQuote.components.reduce((sum, item) => sum + item.priceCLP, 0);
      parsedQuote.totalBudgetCLP = filters.budgetCLP;
      if (parsedQuote.actualCostCLP > filters.budgetCLP) {
        throw new Error("La cotización de la IA supera el presupuesto solicitado.");
      }

      return {
        quote: parsedQuote,
        modelUsed: data.model || currentModel
      };
    } catch (err: any) {
      if (err.message === OPENROUTER_RATE_LIMIT_MESSAGE || err.message?.includes("401")) {
        throw err;
      }
      if (err.name === "TimeoutError") {
        lastError = `Tiempo de espera agotado con ${currentModel} (más de 45s).`;
      } else {
        lastError = err.message || String(err);
      }
    }
  }

  // Si fallaron todos los intentos, lanzar el error real sin inventar respuestas genéricas
  throw new Error(`No fue posible generar la cotización con la IA de OpenRouter. Detalle: ${lastError}`);
}
