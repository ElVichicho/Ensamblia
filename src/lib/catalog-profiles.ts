import type { BuilderFilters } from "@/types/pc-builder";
import type { Product } from "./quote-selection";

export const useCases: BuilderFilters["useCase"][] = ["office", "home_study", "creative", "gaming", "dev_data"];
export const useCaseLabels: Record<BuilderFilters["useCase"], string> = {
  office: "Oficina", home_study: "Hogar y estudio", creative: "Diseño y edición",
  gaming: "Videojuegos", dev_data: "Desarrollo y datos",
};

function value(product: Product, key: string) { return Number(product.specs[key]) || 0; }

// Profiles overlap: a desktop product can be suitable for several uses.
export function productUseCases(product: Product): BuilderFilters["useCase"][] {
  if (product.useCases) return product.useCases.filter(useCase => useCases.includes(useCase));
  const specs = product.specs;
  if (product.category === "ram" && (specs.bus_bus_bus_format_name !== "DIMM" || specs.is_ecc === true || specs.is_fully_buffered === true)) return [];
  if (product.category === "cpu" && /xeon|epyc|threadripper|opteron/i.test(product.name)) return [];
  if (product.category === "gpu" && /quadro|tesla|radeon pro|rtx [a-z]?\d{4} ada/i.test(product.name)) return ["creative", "dev_data"];
  const demanding = ["creative", "gaming", "dev_data"] as BuilderFilters["useCase"][];
  if (product.category === "cpu" && (value(product, "tdp") > 125 || value(product, "total_core_count") > 16)) return demanding;
  if (product.category === "gpu" && (value(product, "gpu_tdp") > 180 || value(product, "memory_quantity_value") > 8192)) return demanding;
  if (product.category === "ram" && value(product, "capacity_total_capacity_value") > 65536) return demanding;
  if (product.category === "psu" && value(product, "power_value") > 850) return demanding;
  if (product.category === "cooler" && /líquida|liquida/i.test(String(specs.type_name))) return demanding;
  return [...useCases];
}

export function createProfileIndex(catalog: Product[]) {
  return Object.fromEntries(useCases.map(useCase => [useCase,
    catalog.filter(product => productUseCases(product).includes(useCase)).map(product => product.id),
  ])) as Record<BuilderFilters["useCase"], number[]>;
}

export function relevantProducts(catalog: Product[], filters: BuilderFilters): Product[] {
  const lightweight = filters.useCase === "office" || filters.useCase === "home_study";
  return catalog.filter(product => {
    // Explicit requirements can broaden an otherwise lightweight profile.
    const explicitLiquid = product.category === "cooler" && filters.coolingPreference === "liquid";
    if (!explicitLiquid && !productUseCases(product).includes(filters.useCase)) return false;
    if (!lightweight) return true;
    if (product.category === "cpu") return product.priceCLP <= Math.min(filters.budgetCLP * .38, 350000);
    if (product.category === "gpu") return product.priceCLP <= Math.min(filters.budgetCLP * .25, 250000);
    return true;
  });
}
