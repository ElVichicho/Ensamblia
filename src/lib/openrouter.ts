import { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import { createQuote, Product, QuoteError, selectCandidates, specifications } from "./quote-selection";

export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
export const OPENROUTER_RATE_LIMIT_MESSAGE =
  "El proveedor gratuito alcanzó su límite de solicitudes. Espera antes de volver a intentar.";
export function getFreeOpenRouterModel() {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  return configured?.endsWith(":free") ? configured : DEFAULT_OPENROUTER_MODEL;
}

function makePrompt(filters: BuilderFilters, candidates: Product[]) {
  const catalog = candidates.map(p=>({
    id:p.id, category:p.category, name:p.name, priceCLP:p.priceCLP, ...specifications(p),
  }));
  return `Selecciona un computador completo en Chile según estas preferencias:
${JSON.stringify(filters)}
Candidatos con precios de referencia por unidad, especificaciones y benchmarks:
${JSON.stringify(catalog)}
Objetivo: maximizar el rendimiento útil para el uso y presupuesto. Un presupuesto alto debe aprovechar mejores CPU/GPU, no repetir el armado económico. Apunta a 80-100% del presupuesto si mejora rendimiento, sin gastar por gastar.
Gaming prioriza GPU y equilibrio con CPU; creative/dev_data prioriza CPU, núcleos, RAM y GPU según uso; office/home_study prioriza respuesta y eficiencia.
CPU y placa deben compartir socket, RAM y placa el tipo DDR. No selecciones hardware sin datos para asegurar requisitos esenciales.
Incluye cpu, motherboard, ram, storage, psu y case. gpu es obligatoria para gaming o CPU sin gráficos; cooler cuando la CPU no lo incluya.
Respeta marca, capacidades mínimas, WiFi, formato e interfaz solicitados. La RAM puede tener quantity=1..4, multiplicando precio y capacidad DEL KIT. El resto quantity=1.
Suma todas las piezas con cantidades, sin exceder el presupuesto. Usa benchmarks aportados para comparar CPU/GPU, sin inventar FPS.
Responde SOLO este JSON, con UN campo por categoría y exclusivamente IDs de los candidatos:
{"buildName":"nombre","summary":"criterio y limitaciones, máximo 40 palabras","upgradePath":"mejora futura","components":{"cpu":{"id":123,"quantity":1,"reason":"motivo breve"},"motherboard":{"id":456,"reason":"motivo"},"ram":{"id":789,"quantity":2,"reason":"motivo"},"storage":{"id":123,"reason":"motivo"},"psu":{"id":123,"reason":"motivo"},"case":{"id":123,"reason":"motivo"},"gpu":{"id":123,"reason":"motivo"},"cooler":{"id":123,"reason":"motivo"}}}
Omite gpu/cooler únicamente cuando sean innecesarios. Sustituye TODOS los IDs de ejemplo por IDs válidos. No añadas markdown ni razonamiento fuera del JSON.`;
}

export async function requestBuildFromOpenRouter(
  filters: BuilderFilters, apiKey?: string, modelName = DEFAULT_OPENROUTER_MODEL,
): Promise<{ quote: BuildQuote; modelUsed: string }> {
  const token=apiKey||process.env.OPENROUTER_API_KEY;
  if (!token?.trim()) throw new QuoteError("El servicio de cotización requiere configuración del servidor.",503);
  const candidates=selectCandidates(filters);
  for (const category of ["cpu","motherboard","ram","storage","psu","case"]) {
    if (!candidates.some(p=>p.category===category)) throw new QuoteError(`El catálogo no tiene opciones de ${category} para estas preferencias. Ajusta el presupuesto o los requisitos.`);
  }
  const messages=[{role:"user",content:makePrompt(filters,candidates)}];
  const deadline=Date.now()+50000;
  let lastError="La selección no pudo completarse.";
  for (let attempt=0;attempt<2;attempt++) {
    const remaining=deadline-Date.now();
    if (remaining<5000) break;
    let data;
    try {
      const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
        method:"POST",headers:{Authorization:`Bearer ${token.trim()}`,"Content-Type":"application/json",
          "HTTP-Referer":"https://solotodo-aiproject.vercel.app","X-Title":"SoloTodo Cotizador"},
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
      return {quote:createQuote(content,filters,candidates),modelUsed:data.model||modelName};
    } catch (error) {
      lastError=error instanceof Error?error.message:"Selección inválida.";
      messages.push({role:"assistant",content},{role:"user",content:`Corrige el JSON completo. ${lastError}`});
    }
  }
  throw new QuoteError(`No encontramos una configuración válida. ${lastError}`);
}
