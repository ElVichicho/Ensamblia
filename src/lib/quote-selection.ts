import { BuildQuote, BuilderFilters, ComponentCategory, ComponentItem, CompatibilityCheck } from "@/types/pc-builder";
import rawCatalog from "@/data/solotodo-catalog.json";

export interface Product {
  id: number; name: string; category: ComponentCategory; brand: string | null;
  priceCLP: number; solotodoUrl: string; socket: string | null; tdp: number | null;
  format: string | null; store: string; specs: Record<string, unknown>;
}
export const products = Object.values(rawCatalog.categories).flat() as unknown as Product[];
export const categories: ComponentCategory[] = ["cpu", "motherboard", "ram", "gpu", "storage", "psu", "case", "cooler"];
const labels: Record<ComponentCategory, string> = {
  cpu: "Procesador", motherboard: "Placa madre", ram: "Memoria", gpu: "Tarjeta de video",
  storage: "Almacenamiento", psu: "Fuente de poder", case: "Gabinete", cooler: "Refrigeración",
};
export class QuoteError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}
function num(p: Product, key: string) { return Number(p.specs[key]) || 0; }
function str(p: Product, key: string) { return String(p.specs[key] ?? ""); }
function capacity(value: string | undefined) {
  if (!value || value === "any") return 0;
  return parseInt(value) * (value.endsWith("tb") ? 1000 : 1);
}
function normalize(value: string) { return value.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function ramGB(p: Product) { return num(p, "capacity_total_capacity_value") / 1024; }
function memoryType(p: Product) {
  return str(p, p.category === "ram" ? "bus_bus_bus_type_name" : "memory_slots_mtype_itype_type_name");
}
function wifi(p: Product) { return /wi.?fi|802\.11/i.test(p.name + JSON.stringify(p.specs.ports)); }

export function specifications(p: Product) {
  switch (p.category) {
    case "cpu": return { socket: p.socket, cores: num(p,"total_core_count"), threads: num(p,"thread_count_value"),
      passmark: num(p,"passmark_score"), cinebenchSingle: num(p,"cinebench_r20_single_score"),
      tdpW: p.tdp, integratedGraphics: str(p,"graphics_name"), includedCooler: str(p,"cooler_name") };
    case "motherboard": return { socket: p.socket, memoryType: memoryType(p), ramSlots: num(p,"memory_slots_quantity"), format: p.format, wifi: wifi(p) };
    case "ram": return { capacityGB: ramGB(p), kitModules: num(p,"capacity_dimm_quantity_value"),
      memoryType: memoryType(p), format: str(p,"bus_bus_bus_format_name"), speedMHz: num(p,"bus_frequency_value") };
    case "gpu": return { vramGB: num(p,"memory_quantity_value") / 1024, timeSpy: num(p,"gpu_tdmark_time_spy_score"),
      tdpW: num(p,"gpu_tdp"), lengthMM: num(p,"length") };
    case "storage": return { capacityGB: num(p,"capacity_value"), interface: str(p,"ssd_type_bus_bus_with_version_bus_name"),
      connector: str(p,"ssd_type_connector_name"), readMBs: num(p,"sequential_read_speed") };
    case "psu": return { watts: num(p,"power_value"), certification: str(p,"certification_name") };
    case "case": return { motherboardFormat: str(p,"largest_motherboard_format_format_name"),
      maxGpuMM: num(p,"max_video_card_length"), maxCoolerMM: num(p,"max_cpu_cooler_height") };
    case "cooler": return { type: str(p,"type_name"), heightMM: num(p,"height"),
      sockets: [...new Set([...JSON.stringify(p.specs.grouped_sockets ?? []).matchAll(/"socket_name":"([^"]+)"/g)].map(m=>m[1]))] };
  }
}

function matches(p: Product, f: BuilderFilters) {
  if (p.category === "cpu" && f.cpuPreference !== "any" && p.brand?.toLowerCase() !== f.cpuPreference) return false;
  if (p.category === "gpu" && f.gpuPreference !== "any") {
    const isNvidia = /geforce|nvidia/i.test(p.name);
    if ((f.gpuPreference === "nvidia") !== isNvidia) return false;
  }
  if (p.category === "ram" && (str(p,"bus_bus_bus_format_name") !== "DIMM" || ramGB(p) * 2 < capacity(f.ramCapacity))) return false;
  if (p.category === "storage") {
    if (num(p,"capacity_value") < capacity(f.storageCapacity)) return false;
    const sata = /sata/i.test(str(p,"ssd_type_bus_bus_with_version_bus_name"));
    if (f.storageType === "sata" && !sata || f.storageType === "nvme" && sata) return false;
  }
  if (p.category === "motherboard" && f.wifiRequired && !wifi(p)) return false;
  if (p.category === "cooler" && f.coolingPreference !== "any") {
    const liquid = /líquida|liquida/i.test(str(p,"type_name"));
    if (liquid !== (f.coolingPreference === "liquid")) return false;
  }
  if (p.category === "case" && f.caseSize === "compact" && /^(ATX|E-ATX)$/i.test(str(p,"largest_motherboard_format_format_name"))) return false;
  return true;
}

export function selectCandidates(f: BuilderFilters): Product[] {
  const shares: Record<ComponentCategory, number> = {
    cpu: f.useCase === "gaming" ? .2 : .28, gpu: .38, motherboard: .12,
    ram: .1, storage: .1, psu: .06, case: .05, cooler: .04,
  };
  return categories.flatMap(category => {
    const pool = products.filter(p => p.category === category && p.priceCLP > 0 && p.priceCLP < f.budgetCLP * .65 && matches(p, f));
    const target = f.budgetCLP * shares[category];
    const tier = category === "cpu" || category === "gpu" ? pool.filter(p=>p.priceCLP >= target * .45) : pool;
    const eligible = tier.length ? tier : pool;
    const nearby = [...eligible].sort((a,b)=>Math.abs(a.priceCLP-target)-Math.abs(b.priceCLP-target)).slice(0,7);
    const performance = [...eligible].filter(p=>p.priceCLP <= target * 1.5).sort((a,b)=>
      (num(b,category === "cpu" ? "passmark_score" : "gpu_tdmark_time_spy_score") -
       num(a,category === "cpu" ? "passmark_score" : "gpu_tdmark_time_spy_score"))).slice(0,3);
    const cheapest = [...eligible].sort((a,b)=>a.priceCLP-b.priceCLP).slice(0,3);
    return [...new Map([...nearby,...performance,...cheapest].map(p=>[p.id,p])).values()];
  });
}

export function createQuote(content: string, f: BuilderFilters, candidates: Product[]): BuildQuote {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new QuoteError("La respuesta del modelo no contiene una selección válida.");
  const result = JSON.parse(match[0]);
  if (typeof result.buildName !== "string" || typeof result.summary !== "string" || typeof result.upgradePath !== "string") {
    throw new QuoteError("La respuesta del modelo está incompleta.");
  }
  // Keyed selections prevent duplicate categories. Accept older array-shaped replies too.
  const selections: Record<string, {id: unknown; reason: unknown; quantity?: unknown}> = {};
  if (Array.isArray(result.components)) {
    for (const choice of result.components) {
      const p = candidates.find(p=>String(p.id)===String(choice?.id));
      if (!p) throw new QuoteError("El modelo eligió un producto fuera de los candidatos.");
      if (selections[p.category] && String(selections[p.category].id) !== String(p.id)) {
        throw new QuoteError(`Devuelve un único ID en el campo ${p.category}. Usa quantity para módulos de RAM.`);
      }
      selections[p.category] = choice;
    }
  } else if (result.components && typeof result.components === "object") {
    Object.assign(selections, result.components);
  } else throw new QuoteError("Falta la selección de componentes.");
  const chosen = new Map<ComponentCategory, {p: Product; quantity: number}>();
  const components: ComponentItem[] = [];
  for (const [category, choice] of Object.entries(selections)) {
    if (choice === null) continue;
    const source = candidates.find(p=>String(p.id)===String(choice?.id) && p.category===category);
    const quantity = Number(choice.quantity ?? 1);
    if (!source || typeof choice.reason !== "string") throw new QuoteError(`ID o motivo inválido en ${category}.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > (category === "ram" ? 4 : 1)) {
      throw new QuoteError("La cantidad de módulos de RAM debe ser un entero entre 1 y 4.");
    }
    chosen.set(source.category, {p:source,quantity});
    components.push({
      id: String(source.id), category: source.category, categoryLabel: labels[source.category], name: source.name,
      brand: source.brand || "", specs: Object.entries(specifications(source)).filter(([,v])=>v!==null && v!=="" && v!==0)
        .map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(", "):v}`).join(" · "),
      priceCLP: source.priceCLP * quantity, quantity, store: source.store, affiliateUrl:source.solotodoUrl,
      aiReason: choice.reason, compatibilityNote:"Revisar soporte y versión de BIOS con el fabricante.",
    });
  }
  for (const category of ["cpu","motherboard","ram","storage","psu","case"] as ComponentCategory[]) {
    if (!chosen.has(category)) throw new QuoteError(`Falta el componente ${category}.`);
  }
  const cpu=chosen.get("cpu")!.p, board=chosen.get("motherboard")!.p, ram=chosen.get("ram")!, storage=chosen.get("storage")!.p;
  const gpu=chosen.get("gpu")?.p, psu=chosen.get("psu")!.p, chasis=chosen.get("case")!.p, cooler=chosen.get("cooler")?.p;
  if ((f.useCase === "gaming" || /no posee/i.test(str(cpu,"graphics_name"))) && !gpu) throw new QuoteError("Este equipo requiere una tarjeta de video.");
  if (/no posee/i.test(str(cpu,"cooler_name")) && !cooler) throw new QuoteError("Este procesador requiere un cooler adicional.");
  if (cpu.socket && board.socket && normalize(cpu.socket)!==normalize(board.socket)) throw new QuoteError("CPU y placa madre deben compartir socket.");
  const ramType=memoryType(ram.p), boardType=memoryType(board);
  if (ramType && boardType && ramType!==boardType) throw new QuoteError("RAM y placa madre deben compartir DDR4 o DDR5.");
  if (ramGB(ram.p)*ram.quantity < capacity(f.ramCapacity)) throw new QuoteError("La cantidad total de RAM es menor a la solicitada.");
  if (num(ram.p,"capacity_dimm_quantity_value")*ram.quantity > num(board,"memory_slots_quantity")) throw new QuoteError("Los módulos exceden las ranuras de RAM.");
  if (num(storage,"capacity_value") < capacity(f.storageCapacity)) throw new QuoteError("El almacenamiento es menor al solicitado.");
  const checks: CompatibilityCheck[] = [
    {title:"Socket",status:cpu.socket&&board.socket?"valid":"warning",detail:cpu.socket&&board.socket?`${cpu.socket} en CPU y placa madre.`:"Socket pendiente de verificar."},
    {title:"Memoria",status:ramType&&boardType?"valid":"warning",detail:`${ramGB(ram.p)*ram.quantity} GB ${ramType}. ${ram.quantity} unidad(es) del producto seleccionado.`},
  ];
  const cpuTdp=num(cpu,"tdp"), gpuTdp=gpu?num(gpu,"gpu_tdp"):0;
  const totalTdpWatts=cpuTdp && (!gpu||gpuTdp) ? cpuTdp+gpuTdp+75 : 0;
  const recommendedPsuWatts=totalTdpWatts?Math.ceil(totalTdpWatts*1.35/50)*50:0;
  if (recommendedPsuWatts && num(psu,"power_value") < recommendedPsuWatts) throw new QuoteError(`Elige fuente de al menos ${recommendedPsuWatts}W.`);
  if (gpu && num(gpu,"length") && num(chasis,"max_video_card_length") && num(gpu,"length") > num(chasis,"max_video_card_length")) throw new QuoteError("La GPU supera el largo admitido por el gabinete.");
  if (cooler && !/líquida/i.test(str(cooler,"type_name")) && num(cooler,"height") && num(chasis,"max_cpu_cooler_height") && num(cooler,"height")>num(chasis,"max_cpu_cooler_height")) throw new QuoteError("El cooler supera la altura admitida por el gabinete.");
  checks.push({title:"Alimentación",status:recommendedPsuWatts?"valid":"warning",detail:recommendedPsuWatts?`Estimación con 75W auxiliares y margen de 35%. Fuente mínima sugerida: ${recommendedPsuWatts}W.`:"Falta información para estimar el consumo."},
    {title:"Comprobaciones pendientes",status:"warning",detail:"Verificar BIOS, conectores eléctricos, montaje de refrigeración e interfaces con las fichas del fabricante."});
  const actualCostCLP=components.reduce((sum,item)=>sum+item.priceCLP,0);
  if (actualCostCLP>f.budgetCLP) throw new QuoteError(`Total ${actualCostCLP} excede ${f.budgetCLP}. Reduce el costo manteniendo los requisitos.`);
  return {buildName:result.buildName,targetUse:f.useCase,totalBudgetCLP:f.budgetCLP,actualCostCLP,
    performanceSummary:result.summary,executiveSummary:result.summary,totalTdpWatts,recommendedPsuWatts,
    compatibilityScore:0,pros:[],upgradePath:result.upgradePath,components,compatibilityChecks:checks};
}


export interface Configuration {
  option: number;
  quote: BuildQuote;
  benchmarkScore: number;
}
export function prepareConfigurations(f: BuilderFilters, candidates: Product[]): Configuration[] {
  const of = (category: ComponentCategory) => candidates.filter(p=>p.category===category).sort((a,b)=>a.priceCLP-b.priceCLP);
  const configurations: Configuration[] = [];
  const storage = of("storage")[0];
  if (!storage) return [];
  const maxCpu = Math.max(1,...of("cpu").map(p=>num(p,"passmark_score")));
  const maxGpu = Math.max(1,...of("gpu").map(p=>num(p,"gpu_tdmark_time_spy_score")));
  for (const cpu of of("cpu")) {
    const boards=of("motherboard").filter(p=>cpu.socket && p.socket && normalize(cpu.socket)===normalize(p.socket)).slice(0,5);
    const needsGpu=f.useCase==="gaming" || /no posee/i.test(str(cpu,"graphics_name"));
    const gpuOptions: (Product|undefined)[]=needsGpu?of("gpu"):[undefined,...of("gpu")];
    for (const board of boards) {
      const ramOptions=of("ram").filter(p=>memoryType(p)===memoryType(board)).map(p=>({
        p,quantity:Math.max(1,Math.ceil(capacity(f.ramCapacity)/ramGB(p))),
      })).filter(r=>Number.isFinite(r.quantity)&&r.quantity<=4 &&
        r.quantity*num(r.p,"capacity_dimm_quantity_value")<=num(board,"memory_slots_quantity"));
      ramOptions.sort((a,b)=>a.p.priceCLP*a.quantity-b.p.priceCLP*b.quantity);
      const ram=ramOptions[0];
      if (!ram) continue;
      const needsCooler=/no posee/i.test(str(cpu,"cooler_name")) || f.coolingPreference==="liquid";
      const cooler=needsCooler?of("cooler").find(p=>
        (specifications(p) as {sockets:string[]}).sockets.some(s=>normalize(s)===normalize(cpu.socket||""))):undefined;
      if (needsCooler&&!cooler) continue;
      for (const gpu of gpuOptions) {
        const estimatedTdp=num(cpu,"tdp")+(gpu?num(gpu,"gpu_tdp"):0)+75;
        const psu=of("psu").find(p=>num(p,"power_value")>=Math.max(450,estimatedTdp*1.35));
        const chasis=of("case").find(p=>
          num(p,"largest_motherboard_format_format_height")>=num(board,"format_format_height") &&
          num(p,"largest_motherboard_format_format_width")>=num(board,"format_format_width") &&
          (!gpu||!num(gpu,"length")||num(p,"max_video_card_length")>=num(gpu,"length")) &&
          (!cooler||/líquida/i.test(str(cooler,"type_name"))||!num(cooler,"height")||num(p,"max_cpu_cooler_height")>=num(cooler,"height")));
        if (!psu||!chasis) continue;
        const chosen=[cpu,board,ram.p,storage,psu,chasis,...gpu?[gpu]:[],...cooler?[cooler]:[]];
        const components=Object.fromEntries(chosen.map(p=>[p.category,{
          id:p.id,quantity:p.category==="ram"?ram.quantity:1,reason:"Seleccionado según requisitos y presupuesto.",
        }]));
        try {
          const quote=createQuote(JSON.stringify({buildName:"Configuración compatible",summary:"",upgradePath:"",components}),f,candidates);
          const cpuScore=num(cpu,"passmark_score")/maxCpu;
          const gpuScore=gpu?num(gpu,"gpu_tdmark_time_spy_score")/maxGpu:0;
          const benchmarkScore=f.useCase==="gaming"?cpuScore*.35+gpuScore*.65:cpuScore*.85+gpuScore*.15;
          configurations.push({option:0,quote,benchmarkScore});
        } catch (error) {
          if (!(error instanceof QuoteError)) throw error;
        }
      }
    }
  }
  configurations.sort((a,b)=>b.benchmarkScore-a.benchmarkScore||a.quote.actualCostCLP-b.quote.actualCostCLP);
  const unique=new Map<string,Configuration>();
  for (const config of configurations) {
    const key=config.quote.components.filter(p=>p.category==="cpu"||p.category==="gpu").map(p=>p.id).join("-");
    if (!unique.has(key)) unique.set(key,config);
  }
  return [...unique.values()].slice(0,8).map((config,i)=>({...config,option:i+1}));
}
