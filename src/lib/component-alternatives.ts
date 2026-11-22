import type { BuildQuote, BuilderFilters, ComponentAlternative, ComponentCategory } from "@/types/pc-builder";
import { relevantProducts } from "./catalog-profiles";
import { categories, createQuote, matches, QuoteError, type Product, specifications } from "./quote-selection";
import { attachStoreOffers, type Offer } from "./store-offers";

type Selection = { id: string; category: ComponentCategory; quantity?: number };

function benchmark(product: Product) {
  const name = product.category === "cpu" ? "PassMark CPU" : "3DMark Time Spy";
  const key = product.category === "cpu" ? "passmark_score" : "gpu_tdmark_time_spy_score";
  if (product.category !== "cpu" && product.category !== "gpu") return undefined;
  const score = Number(product.specs[key]);
  return Number.isFinite(score) && score > 0 ? { name, score } : undefined;
}

function description(product: Product, quantity: number): string {
  const data = specifications(product) as Record<string, unknown>;
  switch (product.category) {
    case "cpu": return `${data.cores || "Sin dato de"} núcleos · socket ${data.socket || "por verificar"}.`;
    case "gpu": return `${data.vramGB || "Sin dato de"} GB de memoria de video · consumo ${data.tdpW || "por verificar"} W.`;
    case "ram": return `${Number(data.capacityGB) * quantity} GB en total · ${data.memoryType || "tipo por verificar"} · ${data.speedMHz || "frecuencia por verificar"} MHz.`;
    case "storage": return `${data.capacityGB || "Capacidad por verificar"} GB · ${data.interface || "interfaz por verificar"}.`;
    case "psu": return `${data.watts || "Potencia por verificar"} W · certificación ${data.certification || "por verificar"}.`;
    case "motherboard": return `${data.socket || "Socket por verificar"} · ${data.memoryType || "memoria por verificar"} · ${data.wifi ? "con WiFi" : "sin WiFi identificado"}.`;
    case "case": return `Admite formato ${data.motherboardFormat || "por verificar"} · largo máximo de GPU ${data.maxGpuMM || "por verificar"} mm.`;
    case "cooler": return `${data.type || "Tipo por verificar"} · altura ${data.heightMM || "por verificar"} mm.`;
  }
}

export function rebuildSelection(selections: Selection[], filters: BuilderFilters, catalog: Product[]): BuildQuote {
  if (!Array.isArray(selections) || selections.length < 6 || selections.length > 8) throw new QuoteError("La selección de piezas está incompleta.", 400);
  const seen = new Set<string>();
  const components: Record<string, { id: string; quantity: number; reason: string }> = {};
  for (const selection of selections) {
    if (!selection || !categories.includes(selection.category) || !["string", "number"].includes(typeof selection.id) || seen.has(selection.category)) throw new QuoteError("Selecciona una pieza válida por categoría.", 400);
    seen.add(selection.category);
    components[selection.category] = { id: selection.id, quantity: selection.quantity ?? 1, reason: "Elegido para tu configuración personalizada." };
  }
  return createQuote(JSON.stringify({
    buildName: "Tu configuración personalizada",
    summary: "Configuración actualizada con las piezas que elegiste. Se recalcularon el costo y las comprobaciones disponibles de compatibilidad.",
    upgradePath: "Revisa las comprobaciones pendientes y confirma las ofertas antes de comprar.",
    components,
  }), filters, relevantProducts(catalog, filters));
}

export function withAlternatives(quote: BuildQuote, filters: BuilderFilters, catalog: Product[], offers: Record<string, Offer[]> = {}): BuildQuote {
  const eligible = relevantProducts(catalog, filters).filter(product => product.priceCLP > 0 && matches(product, filters));
  const alternatives: BuildQuote["alternatives"] = {};
  for (const selected of quote.components) {
    const reference = catalog.find(product => String(product.id) === selected.id);
    if (!reference) continue;
    const currentBenchmark = benchmark(reference);
    const selectedAlternative: ComponentAlternative = {
      component: selected, totalCLP: quote.actualCostCLP, priceDifferenceCLP: 0,
      explanation: description(reference, selected.quantity ?? 1),
      ...(currentBenchmark?.score && { benchmark: { ...currentBenchmark, referenceScore: currentBenchmark.score, percent: 0 } }),
    };
    const valid: { product: Product; quote: BuildQuote }[] = [];
    for (const product of eligible.filter(product => product.category === selected.category && String(product.id) !== selected.id)) {
      const ramCapacity = Number(product.specs.capacity_total_capacity_value) / 1024;
      const requestedRam = filters.ramCapacity === "any" ? 0 : parseInt(filters.ramCapacity);
      const quantity = product.category === "ram" ? Math.max(1, Math.ceil(requestedRam / ramCapacity)) : 1;
      if (!Number.isFinite(quantity)) continue;
      const selections = quote.components.map(item => item.category === selected.category ?
        { id: String(product.id), category: product.category, quantity } : item);
      try {
        valid.push({ product, quote: rebuildSelection(selections, filters, eligible) });
      } catch (error) {
        if (!(error instanceof QuoteError)) throw error;
      }
    }
    valid.sort((a, b) => Math.abs(a.quote.actualCostCLP - quote.actualCostCLP) - Math.abs(b.quote.actualCostCLP - quote.actualCostCLP) || a.product.id - b.product.id);
    const cheaper = valid.find(option => option.quote.actualCostCLP < quote.actualCostCLP);
    const faster = currentBenchmark?.score ? valid.find(option => (benchmark(option.product)?.score ?? 0) > currentBenchmark.score) : undefined;
    const choices = [...new Map([...(cheaper ? [cheaper] : []), ...(faster ? [faster] : []), ...valid].map(option => [option.product.id, option])).values()].slice(0, 2);
    alternatives[selected.category] = [selectedAlternative, ...choices.map(option => {
      const updated = attachStoreOffers(option.quote, filters.consolidateStores ?? false, offers);
      const component = updated.components.find(item => item.category === selected.category)!;
      const metric = benchmark(option.product);
      return {
        component, totalCLP: updated.actualCostCLP, priceDifferenceCLP: updated.actualCostCLP - quote.actualCostCLP,
        explanation: description(option.product, component.quantity ?? 1),
        ...(metric?.score && currentBenchmark?.score && { benchmark: {
          ...metric, referenceScore: currentBenchmark.score,
          percent: Math.round((metric.score / currentBenchmark.score - 1) * 1000) / 10,
        } }),
      };
    })];
  }
  return { ...quote, alternatives };
}
