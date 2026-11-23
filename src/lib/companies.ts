import type { Snapshot } from "./catalog-snapshot";
import type { Offer } from "./store-offers";
import { QuoteError } from "./quote-selection";
import { createDemoQuote } from "./demo-quote";
import type { BuilderFilters } from "@/types/pc-builder";
export type Company = { id: string; name: string; products: number; categories: string[] };
export function companyId(offer: Offer) { return offer.storeId ?? `store-${encodeURIComponent(offer.store)}`; }
export function catalogCompanies(snapshot: Snapshot): Company[] {
  const companies = new Map<string, Company>();
  for (const product of snapshot.products) for (const offer of snapshot.offers[String(product.id)] ?? []) {
    const id = companyId(offer);
    const company = companies.get(id) ?? { id, name: offer.store, products: 0, categories: [] };
    company.products++;
    if (!company.categories.includes(product.category)) company.categories.push(product.category);
    companies.set(id, company);
  }
  return [...companies.values()].sort((a,b) => b.categories.length-a.categories.length || b.products-a.products || a.id.localeCompare(b.id));
}
// Filter before candidate generation: selected stores determine products AND prices.
export function scopeCatalog(snapshot: Snapshot, ids?: string[]): Snapshot {
  if (ids === undefined) return snapshot;
  const available = new Set(catalogCompanies(snapshot).map(c => c.id));
  if (!ids.length || ids.some(id => !available.has(id))) throw new QuoteError("Selecciona al menos una empresa disponible en el catálogo.",400);
  const selected = new Set(ids);
  const offers: Snapshot["offers"] = {};
  const products = snapshot.products.flatMap(product => {
    const list = (snapshot.offers[String(product.id)] ?? []).filter(o => selected.has(companyId(o)));
    if (!list.length) return [];
    offers[String(product.id)] = list;
    return [{...product,priceCLP:Math.min(...list.map(o=>o.priceCLP)),store:list[0].store}];
  });
  if (!products.length) throw new QuoteError("Las empresas seleccionadas no tienen productos disponibles.");
  return {...snapshot,products,offers};
}
export function limitCatalog(snapshot: Snapshot): Snapshot {
  const companies = catalogCompanies(snapshot).slice(0,3);
  const scoped = scopeCatalog(snapshot, companies.map(c=>c.id));
  const anchors=new Set<string>();
  const defaults:BuilderFilters={budgetCLP:800000,useCase:"office",cpuPreference:"any",gpuPreference:"any",storageCapacity:"1tb",storageType:"nvme",ramCapacity:"16gb",wifiRequired:false,coolingPreference:"air",caseSize:"standard"};
  // Preserve working combinations per company before sampling price bands.
  // Pure price sampling can discard the one motherboard/RAM/case combination
  // that makes a store's catalog usable despite broad category coverage.
  for(const company of companies) for(const [useCase,budgetCLP] of [["office",800000],["gaming",1200000],["gaming",2200000]] as const){
    try{const quote=createDemoQuote({...defaults,useCase,budgetCLP},scopeCatalog(scoped,[company.id]).products);quote.components.forEach(p=>anchors.add(p.id));}catch{}
  }
  const products: Snapshot["products"] = [];
  for (const category of [...new Set(scoped.products.map(p=>p.category))]) {
    const list = scoped.products.filter(p=>p.category===category).sort((a,b)=>a.priceCLP-b.priceCLP||a.id-b.id);
    const retained=new Map(list.filter(p=>anchors.has(String(p.id))).map(p=>[p.id,p]));
    const slots=50-retained.size;
    const rest=list.filter(p=>!retained.has(p.id));
    for(let i=0;i<Math.min(slots,rest.length);i++){const p=rest[Math.round(i*(rest.length-1)/Math.max(1,Math.min(slots,rest.length)-1))];retained.set(p.id,p);}
    products.push(...retained.values());
  }
  return {...scoped,products,offers:Object.fromEntries(products.map(p=>[String(p.id),scoped.offers[String(p.id)]]))};
}
