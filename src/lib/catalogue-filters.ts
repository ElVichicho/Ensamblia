import type { ComponentCategory } from "@/types/pc-builder";
export const categoryLabels:Record<ComponentCategory,string>={cpu:"Procesadores",motherboard:"Placas madre",ram:"Memorias RAM",gpu:"Tarjetas de video",storage:"Almacenamiento",psu:"Fuentes de poder",case:"Gabinetes",cooler:"Refrigeración"};
export type CatalogueOffer={companyId:string;companyName:string;priceCLP:number;url:string};
export type CatalogueProduct={id:number;name:string;brand:string|null;category:ComponentCategory;categoryLabel:string;imageUrl?:string;referencePrice:number;features:string[];offers:CatalogueOffer[]};
export type CatalogueFilters={query:string;category:string;companyIds:string[];sort:"price-asc"|"price-desc"|"name"};
export type CatalogueResult=CatalogueProduct&{visibleOffers:CatalogueOffer[];displayPrice:number};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function filterCatalogue(products:CatalogueProduct[],filters:CatalogueFilters):CatalogueResult[]{
 const words=normalize(filters.query).trim().split(/\s+/).filter(Boolean);
 const selected=new Set(filters.companyIds);
 const results=products.flatMap(p=>{
  if(filters.category&&p.category!==filters.category)return [];
  const haystack=normalize(`${p.name} ${p.brand??""} ${p.categoryLabel} ${p.features.join(" ")}`);
  if(!words.every(word=>haystack.includes(word)))return [];
  const visibleOffers=selected.size?p.offers.filter(o=>selected.has(o.companyId)):p.offers;
  if(selected.size&&!visibleOffers.length)return [];
  return [{...p,visibleOffers,displayPrice:visibleOffers[0]?.priceCLP??p.referencePrice}];
 });
 return results.sort((a,b)=>(filters.sort==="name"?a.name.localeCompare(b.name,"es"):filters.sort==="price-desc"?b.displayPrice-a.displayPrice:a.displayPrice-b.displayPrice)||a.id-b.id);
}
