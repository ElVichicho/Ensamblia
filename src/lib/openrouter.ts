import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import { type Product, products, QuoteError, selectCandidates, specifications, prepareConfigurations } from "./quote-selection";
import { relevantProducts, useCaseLabels } from "./catalog-profiles";

export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
export const OPENROUTER_RATE_LIMIT_MESSAGE =
  "El proveedor gratuito alcanzó su límite de solicitudes. Espera antes de volver a intentar.";
export function getFreeOpenRouterModel() {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  return configured?.endsWith(":free") ? configured : DEFAULT_OPENROUTER_MODEL;
}

export async function requestBuildFromOpenRouter(
  filters: BuilderFilters, apiKey?: string, modelName = DEFAULT_OPENROUTER_MODEL, catalog?: Product[],
): Promise<{ quote: BuildQuote; modelUsed: string }> {
  const token=apiKey||process.env.OPENROUTER_API_KEY;
  if (!token?.trim()) throw new QuoteError("El servicio de cotización requiere configuración del servidor.",503);
  const candidates=selectCandidates(filters,catalog);
  const configurations=prepareConfigurations(filters,candidates);
  if (!configurations.length) throw new QuoteError("El catálogo no permite armar un equipo con este presupuesto y requisitos. Prueba ampliar el presupuesto o ajustar las preferencias.");
  const options=configurations.map(config=>({
    option:config.option, totalCLP:config.quote.actualCostCLP, comparativeScore:Math.round(config.benchmarkScore*100),
    components:config.quote.components.map(item=>{
      const p=candidates.find(p=>String(p.id)===item.id)!;
      return {category:item.category,name:item.name,quantity:item.quantity,subtotalCLP:item.priceCLP,...specifications(p)};
    }),
  }));
  const prompt = `Elige el mejor computador para estas preferencias: ${JSON.stringify(filters)}.
Estas configuraciones ya cumplen presupuesto y comprobaciones del catálogo:
${JSON.stringify(options)}
Compara benchmarks, capacidad, costo y el uso solicitado. Aprovecha el presupuesto para rendimiento útil; no selecciones siempre la opción más barata.
comparativeScore es una puntuación relativa de benchmarks para este conjunto, no una medición de FPS.
Explica solo los datos proporcionados. No prometas FPS, resolución, ausencia de cuellos de botella ni mejoras porcentuales en juegos. Las diferencias de benchmarks se calculan aparte en el servidor.
Respeta el tipo de memoria de la placa: un cambio entre DDR4 y DDR5 requiere cambiar la placa y la RAM. No afirmes soporte de actualizaciones sin datos del fabricante.
Responde SOLO JSON:
{"option":1,"buildName":"nombre breve","summary":"justificación y limitaciones, máximo 40 palabras","upgradePath":"mejora futura breve","reasons":{"cpu":"motivo de CPU","gpu":"motivo de GPU","ram":"motivo de RAM","storage":"motivo de SSD"}}
option debe ser un número de las configuraciones proporcionadas. No cambies piezas. No inventes mediciones.`;
  const messages=[{role:"user",content:prompt}];
  const deadline=Date.now()+50000;
  let lastError="La selección no pudo completarse.";
  for (let attempt=0;attempt<2;attempt++) {
    const remaining=deadline-Date.now();
    if (remaining<5000) break;
    let data;
    try {
      const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",headers:{Authorization:`Bearer ${token.trim()}`,"Content-Type":"application/json",
          "HTTP-Referer":"https://ensamblia.vercel.app","X-Title":"Ensamblia"},
        body:JSON.stringify({model:modelName,messages,temperature:0.1,max_tokens:1500,
          ...(modelName===DEFAULT_OPENROUTER_MODEL&&{reasoning:{enabled:false}})}),
        signal:AbortSignal.timeout(Math.min(30000,remaining)),
      });
      if (response.status===429) throw new QuoteError(OPENROUTER_RATE_LIMIT_MESSAGE,429);
      if (!response.ok) throw new QuoteError("El proveedor de IA no está disponible en este momento. Intenta nuevamente.",503);
      data=await response.json();
    } catch (error) {
      if (error instanceof QuoteError) throw error;
      if (error instanceof Error && ["AbortError","TimeoutError"].includes(error.name)) {
        throw new QuoteError("El proveedor tardó demasiado en responder. Intenta nuevamente en unos momentos.",504);
      }
      throw new QuoteError("No se pudo conectar con el proveedor de IA.",503);
    }
    const content=data.choices?.[0]?.message?.content;
    if (typeof content!=="string"||!content.trim()) throw new QuoteError("El proveedor devolvió una respuesta vacía. Intenta nuevamente.",503);
    try {
      if (data.choices[0].finish_reason==="length") throw new QuoteError("La respuesta quedó incompleta.");
      const match=content.match(/\{[\s\S]*\}/);
      if (!match) throw new QuoteError("La respuesta no contiene JSON.");
      const result=JSON.parse(match[0]);
      const config=configurations.find(c=>c.option===Number(result.option));
      if (!config||typeof result.buildName!=="string"||typeof result.summary!=="string"||typeof result.upgradePath!=="string") {
        throw new QuoteError("Selecciona un número option válido y completa buildName, summary y upgradePath.");
      }
      const quote:BuildQuote={
        ...config.quote,buildName:result.buildName,executiveSummary:result.summary,
        performanceSummary:result.summary,upgradePath:result.upgradePath,
        catalogSelection: {
          useCase:useCaseLabels[filters.useCase], catalogProducts:(catalog ?? products).length,
          relevantProducts:relevantProducts(catalog ?? products,filters).length,
          candidateProducts:candidates.length,
          sentProducts:new Set(configurations.flatMap(config=>config.quote.components.map(item=>item.id))).size,
          configurations:configurations.length,
        },
        components:config.quote.components.map(item=>({
          ...item,aiReason:typeof result.reasons?.[item.category]==="string"?result.reasons[item.category]:item.aiReason,
        })),
      };
      return {quote,modelUsed:data.model||modelName};
    } catch (error) {
      lastError=error instanceof Error?error.message:"Selección inválida.";
      messages.push({role:"assistant",content},{role:"user",content:`Corrige el JSON completo. ${lastError}`});
    }
  }
  throw new QuoteError(`No encontramos una configuración válida. ${lastError}`);
}
