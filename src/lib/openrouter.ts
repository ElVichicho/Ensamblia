import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import { generateSmartFallbackBuild } from "./hardware-db";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function requestBuildFromOpenRouter(
  filters: BuilderFilters,
  apiKey?: string,
  modelName: string = "google/gemini-2.0-flash-001"
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

  const systemPrompt = `
Eres el Asistente Experto de IA para SoloTodo (la plataforma líder en Chile de cotización de hardware y computadores).
Tu misión es diseñar la cotización de PC de escritorio más óptima, equilibrada y 100% libre de errores de compatibilidad de hardware para el usuario chileno.

REGLAS ESTRICTAS DE HARDWARE Y COMPATIBILIDAD:
1. Precios en Pesos Chilenos (CLP) acordes al mercado nacional (tiendas como SpDigital, PC Factory, Winpy, Dust2, Infor-Ingen, Central Gamer).
2. Compatibilidad Absoluta:
   - Socket de CPU debe coincidir exactamente con el de la Placa Madre (ej: AM4 -> B450/B550/A520; AM5 -> A620/B650/X670; LGA1700 -> H610/B760/Z790).
   - Generación de RAM debe ser soportada por la Placa Madre (DDR4 con DDR4, DDR5 con DDR5).
   - La Fuente de Poder (PSU) debe tener potencia continua suficiente para el TDP total + 35% de margen, con certificación 80 Plus.
   - El Gabinete debe ser compatible con el factor de forma de la Placa Madre (ATX, Micro-ATX, Mini-ITX) y tener longitud suficiente para la GPU.
   - El disipador térmico debe soportar el TDP del procesador.
3. No superar el presupuesto indicado por el usuario (puede ser menor, pero no mayor).
4. Debes responder ÚNICAMENTE con un objeto JSON válido, sin bloques de código markdown innecesarios, sin explicaciones fuera del JSON.

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
    },
    ... (motherboard, ram, gpu, storage, psu, case, cooler)
  ]
}
`;

  const userPrompt = `
Genera una cotización optimizada para:
- Presupuesto máximo: $${filters.budgetCLP.toLocaleString('es-CL')} CLP
- Caso de uso: ${filters.useCase}
- Preferencia de CPU: ${filters.cpuPreference}
- Preferencia de GPU: ${filters.gpuPreference}
- Instrucciones especiales: ${filters.customInstructions || "Ninguna adicional"}
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

    // Limpieza de posibles tags markdown de json
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
