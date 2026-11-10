import { BuildQuote, BuilderFilters, ComponentItem } from "@/types/pc-builder";
import realCatalog from "@/data/solotodo-catalog.json";

export const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
export const OPENROUTER_RATE_LIMIT_MESSAGE =
  "OpenRouter alcanzó el límite temporal de uso gratuito. Espera antes de volver a intentar.";

export function getFreeOpenRouterModel() {
  const configured = process.env.OPENROUTER_MODEL?.trim();
  return configured?.endsWith(":free") ? configured : DEFAULT_OPENROUTER_MODEL;
}

const catalog = Object.values(realCatalog.categories).flat();
const labels: Record<string, string> = {
  cpu: "Procesador", motherboard: "Placa madre", ram: "Memoria RAM",
  gpu: "Tarjeta gráfica", storage: "Almacenamiento", psu: "Fuente de poder",
  case: "Gabinete", cooler: "Refrigeración",
};

function createQuote(content: string, filters: BuilderFilters): BuildQuote {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("La IA no devolvió un JSON válido.");
  const result = JSON.parse(match[0]);
  if (typeof result.buildName !== "string" || typeof result.summary !== "string" ||
      typeof result.upgradePath !== "string" || !Array.isArray(result.components)) {
    throw new Error("La selección de la IA está incompleta.");
  }
  const seen = new Set<string>();
  const components: ComponentItem[] = result.components.map((choice: { id: unknown; reason: unknown }) => {
    const source = catalog.find(product => String(product.id) === String(choice?.id));
    if (!source || typeof choice.reason !== "string") {
      throw new Error(`ID inválido: ${choice?.id}. Usa IDs exactos del catálogo.`);
    }
    if (seen.has(source.category)) throw new Error("Selecciona una pieza por categoría.");
    seen.add(source.category);
    return {
      id: String(source.id), category: source.category as ComponentItem["category"],
      categoryLabel: labels[source.category], name: source.name,
      brand: source.name.split(" ")[0], specs: source.name,
      priceCLP: source.priceCLP, store: source.store, affiliateUrl: source.solotodoUrl,
      aiReason: choice.reason,
      compatibilityNote: "Verificar especificaciones y soporte del fabricante antes de comprar.",
    };
  });
  const required = ["cpu", "motherboard", "ram", "storage", "psu", "case"];
  if (filters.useCase === "gaming") required.push("gpu");
  if (required.some(category => !seen.has(category))) throw new Error("Faltan componentes esenciales.");
  const actualCostCLP = components.reduce((sum, item) => sum + item.priceCLP, 0);
  if (actualCostCLP > filters.budgetCLP) {
    throw new Error(`El total es ${actualCostCLP}, superior al presupuesto ${filters.budgetCLP}. Elige piezas más económicas.`);
  }
  const cpu = catalog.find(product => String(product.id) === components.find(item => item.category === "cpu")?.id);
  const motherboard = catalog.find(product => String(product.id) === components.find(item => item.category === "motherboard")?.id);
  const socketVerified = Boolean(cpu?.socket && motherboard?.socket && cpu.socket === motherboard.socket);
  if (cpu?.socket && motherboard?.socket && !socketVerified) throw new Error("Socket de CPU y placa madre incompatible.");
  return {
    buildName: result.buildName, targetUse: filters.useCase,
    totalBudgetCLP: filters.budgetCLP, actualCostCLP,
    performanceSummary: result.summary, executiveSummary: result.summary,
    totalTdpWatts: 0, recommendedPsuWatts: 0, compatibilityScore: 0,
    pros: [], upgradePath: result.upgradePath, components,
    compatibilityChecks: [
      { title: "Socket CPU y placa", status: socketVerified ? "valid" : "warning",
        detail: socketVerified ? `Socket ${cpu?.socket} coincidente en el catálogo.` : "El catálogo no permite verificar ambos sockets." },
      { title: "RAM, BIOS, dimensiones y alimentación", status: "warning",
        detail: "Requieren comprobación con las fichas de los fabricantes. Consumo y fuente recomendada pendientes de cálculo." },
    ],
  };
}

export async function requestBuildFromOpenRouter(
  filters: BuilderFilters, apiKey?: string, modelName = DEFAULT_OPENROUTER_MODEL,
): Promise<{ quote: BuildQuote; modelUsed: string }> {
  const token = apiKey || process.env.OPENROUTER_API_KEY;
  if (!token?.trim()) throw new Error("Falta configurar OPENROUTER_API_KEY en el servidor.");
  const candidates = Object.entries(realCatalog.categories).flatMap(([category, products]) =>
    products.filter(product => product.priceCLP > 0 && product.priceCLP <= filters.budgetCLP &&
      !(category === "ram" && product.name.includes("SO-DIMM")))
      .sort((a, b) => a.priceCLP - b.priceCLP)
      .slice(0, 8)
      .map(product => ({ id: product.id, category, name: product.name, priceCLP: product.priceCLP, socket: product.socket }))
  );
  const prompt = `Selecciona un PC completo para estas preferencias: ${JSON.stringify(filters)}.
Catálogo: ${JSON.stringify(candidates)}
Usa exclusivamente IDs de este catálogo, una pieza por categoría. Obligatorios cpu, motherboard, ram, storage, psu, case; gpu obligatoria para gaming. Cooler si hace falta.
Respeta socket, RAM y presupuesto TOTAL. Si una preferencia no se puede satisfacer, indícalo en summary.
Responde SOLO JSON breve sin markdown ni razonamiento:
{"buildName":"nombre breve","summary":"resumen y limitaciones, máximo 40 palabras","upgradePath":"mejora futura breve","components":[{"id":123,"reason":"motivo de máximo 8 palabras"}]}
Incluye todas las piezas. No repitas nombres, precios, URLs ni especificaciones en la respuesta.`;
  const messages = [{ role: "user", content: prompt }];
  const deadline = Date.now() + 50000;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 5000) break;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json",
        "HTTP-Referer": "https://solotodo-aiproject.vercel.app", "X-Title": "SoloTodo AI PC Builder" },
      body: JSON.stringify({
        model: modelName, messages, temperature: 0.1, max_tokens: 1000,
        ...(modelName === DEFAULT_OPENROUTER_MODEL && { reasoning: { enabled: false } }),
      }),
      signal: AbortSignal.timeout(Math.min(30000, remaining)),
    });
    const data = await response.json();
    if (response.status === 429) throw new Error(OPENROUTER_RATE_LIMIT_MESSAGE);
    if (!response.ok || data.error) throw new Error(`OpenRouter respondió con error ${response.status}.`);
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("OpenRouter devolvió una respuesta vacía.");
    try {
      if (data.choices[0].finish_reason === "length") throw new Error("JSON incompleto por límite de salida.");
      return { quote: createQuote(content, filters), modelUsed: data.model || modelName };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Selección inválida.";
      messages.push({ role: "assistant", content }, { role: "user", content: `Corrige el JSON. ${lastError}` });
    }
  }
  throw new Error(`No se pudo completar una selección válida: ${lastError}`);
}
