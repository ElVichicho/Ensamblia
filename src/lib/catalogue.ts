import type { Snapshot } from "./catalog-snapshot";
import { companyId } from "./companies";
import { specifications, type Product } from "./quote-selection";

import { categoryLabels, type CatalogueProduct } from "./catalogue-filters";
function features(product:Product):string[]{
 const s=specifications(product) as Record<string,unknown>;
 const list:unknown[]=product.category==="cpu"?[s.socket,s.cores?`${s.cores} núcleos`:null,s.threads?`${s.threads} hilos`:null]:
 product.category==="motherboard"?[s.socket,s.memoryType,s.format,s.wifi?"WiFi integrado":null]:
 product.category==="ram"?[s.capacityGB?`${s.capacityGB} GB`:null,s.memoryType,s.speedMHz?`${s.speedMHz} MHz`:null]:
 product.category==="gpu"?[s.vramGB?`${s.vramGB} GB de video`:null,s.lengthMM?`${s.lengthMM} mm`:null]:
 product.category==="storage"?[s.capacityGB?`${s.capacityGB} GB`:null,s.interface,s.readMBs?`${s.readMBs} MB/s`:null]:
 product.category==="psu"?[s.watts?`${s.watts} W`:null,s.certification]:
 product.category==="case"?[s.motherboardFormat,s.maxGpuMM?`GPU hasta ${s.maxGpuMM} mm`:null]:[s.type,s.heightMM?`${s.heightMM} mm`:null];
 return list.filter((x):x is string=>typeof x==="string"&&x.length>0);
}
export function catalogueProducts(snapshot:Snapshot):CatalogueProduct[]{
 return snapshot.products.map(p=>({id:p.id,name:p.name,brand:p.brand,category:p.category,categoryLabel:categoryLabels[p.category],
  ...(p.imageUrl?.startsWith("https://media.solotodo.com/")?{imageUrl:p.imageUrl}:{}),referencePrice:p.priceCLP,features:features(p),
  offers:(snapshot.offers[String(p.id)]??[]).map(o=>({companyId:companyId(o),companyName:o.store,priceCLP:o.priceCLP,url:o.storeUrl})).sort((a,b)=>a.priceCLP-b.priceCLP)
 }));
}
