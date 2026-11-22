import type { BuildQuote, BuilderFilters } from "@/types/pc-builder";
import { relevantProducts, useCaseLabels } from "./catalog-profiles";
import { prepareConfigurations, products, QuoteError, selectCandidates, type Product } from "./quote-selection";

export function createDemoQuote(filters: BuilderFilters, catalog: Product[] = products): BuildQuote {
  const candidates = selectCandidates(filters, catalog);
  const configurations = prepareConfigurations(filters, candidates);
  const selected = configurations[0];
  if (!selected) throw new QuoteError("El catálogo no permite armar un equipo con este presupuesto y requisitos. Prueba ampliar el presupuesto o ajustar las preferencias.");
  return {
    ...selected.quote,
    generationMode: "demo",
    buildName: `Equipo para ${useCaseLabels[filters.useCase].toLowerCase()}`,
    executiveSummary: "Armado de demostración elegido mediante reglas de presupuesto, capacidades, compatibilidad y puntuaciones del catálogo. Puedes comparar y cambiar las piezas para ajustar la configuración.",
    performanceSummary: "Selección calculada con los datos disponibles del catálogo.",
    upgradePath: "Compara las alternativas de cada categoría y confirma las verificaciones pendientes antes de comprar.",
    catalogSelection: {
      useCase: useCaseLabels[filters.useCase], catalogProducts: catalog.length,
      relevantProducts: relevantProducts(catalog, filters).length,
      candidateProducts: candidates.length, sentProducts: 0, configurations: configurations.length,
    },
  };
}
