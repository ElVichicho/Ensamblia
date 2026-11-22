import assert from "node:assert/strict";
import { loadTypescript } from "./load-typescript.mjs";

const { selectCandidates, prepareConfigurations, products, matches } = loadTypescript("src/lib/quote-selection.ts");
const { withAlternatives, rebuildSelection } = loadTypescript("src/lib/component-alternatives.ts");
const { relevantProducts, createProfileIndex } = loadTypescript("src/lib/catalog-profiles.ts");
const { encodeSnapshot, decodeSnapshot } = loadTypescript("src/lib/catalog-snapshot.ts");
const { attachStoreOffers } = loadTypescript("src/lib/store-offers.ts");

const filters = {
  budgetCLP: 600000, useCase: "gaming", cpuPreference: "any", gpuPreference: "any",
  storageCapacity: "1tb", storageType: "nvme", ramCapacity: "16gb", wifiRequired: false,
  coolingPreference: "air", caseSize: "standard", consolidateStores: false,
};
const catalog = [
  ["cpu", { passmark_score: 10000, total_core_count: 6, graphics_name: "No posee", cooler_name: "No posee", tdp: 65 }],
  ["motherboard", { memory_slots_mtype_itype_type_name: "DDR5", memory_slots_quantity: 4, format_format_height: 244, format_format_width: 244 }],
  ["ram", { bus_bus_bus_type_name: "DDR5", bus_bus_bus_format_name: "DIMM", capacity_total_capacity_value: 16384, capacity_dimm_quantity_value: 1 }],
  ["gpu", { gpu_tdmark_time_spy_score: 10000, gpu_tdp: 100, length: 240, memory_quantity_value: 8192 }],
  ["storage", { capacity_value: 1000, ssd_type_bus_bus_with_version_bus_name: "PCIe 4.0" }],
  ["psu", { power_value: 650, certification_value: 3 }],
  ["case", { largest_motherboard_format_format_height: 305, largest_motherboard_format_format_width: 244, max_video_card_length: 320, max_cpu_cooler_height: 165 }],
  ["cooler", { type_name: "Aire", height: 150, grouped_sockets: [{ socket_name: "AM5" }] }],
].map(([category, specs], index) => ({
  id: index + 1, name: category === "gpu" ? "AMD Radeon sample" : category, category, specs, brand: "AMD",
  priceCLP: 50000, socket: ["cpu", "motherboard"].includes(category) ? "AM5" : null,
  tdp: 65, format: "mATX", store: "Referencia", solotodoUrl: "https://www.solotodo.cl/products/" + (index + 1),
}));
function variant(category, id, price, specs) {
  const original = catalog.find(product => product.category === category);
  const product = { ...original, id, name: category + " " + id, priceCLP: price, specs: { ...original.specs, ...specs } };
  catalog.push(product);
  return product;
}
variant("cpu", 101, 60000, { passmark_score: 11000 });
variant("cpu", 102, 40000, { passmark_score: 8500 });
const wrongSocket = variant("cpu", 103, 55000, { passmark_score: 12000 });
wrongSocket.socket = "LGA1700";
variant("cpu", 104, 500000, { passmark_score: 50000 });
variant("ram", 105, 55000, { bus_bus_bus_type_name: "DDR4" });
variant("psu", 106, 40000, { power_value: 200 });
variant("cooler", 107, 40000, { grouped_sockets: [{ socket_name: "AM4" }] });
variant("case", 108, 40000, { max_video_card_length: 200 });
variant("motherboard", 109, 40000, { format_format_height: 400 });
variant("storage", 110, 45000, { capacity_value: 500 });
variant("storage", 111, 55000, { capacity_value: 2000 });
variant("ram", 112, 40000, { capacity_total_capacity_value: 8192 });
const selections = catalog.slice(0, 8).map(({ id, category }) => ({ id: String(id), category, quantity: 1 }));
const base = rebuildSelection(selections, filters, catalog);
const enriched = withAlternatives(base, filters, catalog);
assert.equal(enriched.alternatives.cpu.length, 3);
assert.equal(enriched.alternatives.cpu.find(option => option.component.id === "101").benchmark.percent, 10);
assert.equal(enriched.alternatives.cpu.find(option => option.component.id === "102").benchmark.percent, -15);
assert(!enriched.alternatives.cpu.some(option => ["103", "104"].includes(option.component.id)));
for (const [category, id] of [["ram", "105"], ["psu", "106"], ["cooler", "107"], ["case", "108"], ["motherboard", "109"], ["storage", "110"]]) {
  assert(!enriched.alternatives[category].some(option => option.component.id === id), category);
}
assert.equal(enriched.alternatives.ram.find(option => option.component.id === "112").component.quantity, 2);
assert(enriched.alternatives.storage.every(option => option.benchmark === undefined));
assert.equal(enriched.alternatives.storage.length, 2, "Fewer than three options are valid when the catalog cannot cover them");
assert.throws(() => rebuildSelection(selections.map((item,index)=>index===1?selections[0]:item), filters, catalog), /categoría/);
assert.throws(() => rebuildSelection(selections.map(item => item.category === "cpu" ? { ...item, id: "missing" } : item), filters, catalog), /inválido/);

const changed = rebuildSelection(selections.map(item => item.category === "cpu" ? { ...item, id: "101" } : item), filters, catalog);
assert.equal(changed.actualCostCLP, 410000);
assert.equal(withAlternatives(changed, filters, catalog).alternatives.cpu.find(option => option.component.id === "1").benchmark.percent, -9.1, "Percentages must use the newly selected baseline");

const noBench = catalog.map(product => ({ ...product, specs: { ...product.specs, passmark_score: 0 } }));
assert(withAlternatives(rebuildSelection(selections, filters, noBench), filters, noBench).alternatives.cpu.every(option => option.benchmark === undefined), "Never invent scores when benchmarks are absent");

const highGpu = variant("gpu", 200, 300000, { gpu_tdp: 300, memory_quantity_value: 16384 });
const highCpu = variant("cpu", 201, 400000, { total_core_count: 24, tdp: 180 });
const office = { ...filters, useCase: "office" };
assert(!relevantProducts(catalog, office).some(product => product.id === highGpu.id || product.id === highCpu.id));
assert(relevantProducts(catalog, filters).some(product => product.id === highGpu.id));
const index = createProfileIndex(catalog);
assert(index.gaming.length > index.office.length);
assert(!matches({ ...highGpu, name: "Intel Arc B580" }, { ...filters, gpuPreference: "amd" }));

const offers = Object.fromEntries(catalog.map(product => [String(product.id), [
  { store: "Tienda A", storeUrl: "https://example.com/a/" + product.id, priceCLP: product.priceCLP },
  { store: "Tienda B", storeUrl: "https://example.com/b/" + product.id, priceCLP: product.priceCLP + 5000 },
]]));
const offered = attachStoreOffers(base, true, offers);
const offeredOptions = withAlternatives(offered, { ...filters, consolidateStores: true }, catalog, offers);
for (const options of Object.values(offeredOptions.alternatives)) {
  for (const option of options) {
    assert(option.totalCLP <= filters.budgetCLP);
    assert(option.component.storeUrl);
  }
}
const snapshot = { updatedAt: new Date().toISOString(), products: catalog, offers };
const signed = encodeSnapshot(snapshot, "test-secret");
assert.equal(decodeSnapshot(signed, "test-secret").products.length, catalog.length);
assert.throws(() => decodeSnapshot(signed, "wrong-secret"), /Firma/);

for (const useCase of ["office", "home_study", "gaming", "creative", "dev_data"]) {
  const request = { ...filters, budgetCLP: 1800000, useCase };
  const candidates = selectCandidates(request, products);
  const configurations = prepareConfigurations(request, candidates);
  assert(configurations.length, useCase + " must produce complete configurations");
  const result = withAlternatives(configurations[0].quote, request, products);
  for (const options of Object.values(result.alternatives)) {
    assert(options.length >= 1 && options.length <= 3);
    assert.equal(options[0].priceDifferenceCLP, 0);
    assert(options.every(option => option.totalCLP <= request.budgetCLP));
  }
  console.log(useCase, "catalog", products.length, "relevant", relevantProducts(products, request).length, "candidates", candidates.length,
    "alternatives", Object.fromEntries(Object.entries(result.alternatives).map(([category, options]) => [category, options.length])));
}
console.log("Passed alternatives, benchmark baseline, missing scores, single-piece compatibility, budget, quantities, store plans, profile filtering and signed legacy snapshots.");


const { requestBuildFromOpenRouter } = loadTypescript("src/lib/openrouter.ts");
let captured;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, init) => {
  captured = JSON.parse(init.body);
  return new Response(JSON.stringify({
    model: "fixture-model", choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      option: 1, buildName: "Equipo de prueba", summary: "Selección de prueba.", upgradePath: "Revisar necesidades futuras.", reasons: {},
    }) } }],
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
try {
  const result = await requestBuildFromOpenRouter({ ...filters, budgetCLP: 1800000 }, "fixture-key");
  assert(result.quote.catalogSelection.sentProducts < result.quote.catalogSelection.candidateProducts);
  assert(result.quote.catalogSelection.candidateProducts < products.length);
  assert(result.quote.catalogSelection.configurations <= 8);
  assert(captured.messages[0].content.length < 60000, "The model must receive a bounded set of configurations");
  console.log("Bounded model context:", result.quote.catalogSelection, "prompt characters", captured.messages[0].content.length);
} finally {
  globalThis.fetch = originalFetch;
}
