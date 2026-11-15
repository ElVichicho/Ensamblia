import { createHmac, timingSafeEqual } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import type { Product } from "./quote-selection";
import { fetchStoreOffers, type Offer } from "./store-offers";

const categories = [[3,"cpu"],[5,"motherboard"],[7,"ram"],[2,"gpu"],[39,"storage"],[9,"psu"],[10,"case"],[12,"cooler"]] as const;
export const maxSnapshotLength = 2_000_000;
type Snapshot = { updatedAt: string; products: Product[]; offers: Record<string, Offer[]> };
type BrowseProduct = {
  id:number; name:string; category_id:number; brand?:{name:string}; specs?:Record<string,unknown>;
};

function compact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key])=>!key.endsWith("_id")&&!key.endsWith("_unicode")&&!["id","unicode","picture","default_bucket"].includes(key))
    .map(([key,item])=>[key,compact(item)]));
  return value;
}

export async function refreshSnapshot(): Promise<Snapshot> {
  const signal = AbortSignal.timeout(45000);
  const products: Product[] = [];
  for (const group of [categories.slice(0,4),categories.slice(4)]) {
    const batches = await Promise.all(group.map(async ([id,category])=>{
      const response = await fetch(`https://publicapi.solotodo.com/products/browse/?categories=${id}&page_size=50`,{signal,cache:"no-store"});
      if (!response.ok) throw new Error(`Falló la consulta de ${category} (${response.status}).`);
      const data = await response.json() as {results:{product_entries:{product:BrowseProduct}[]}[]};
      const entries = new Map<number,Product>();
      for (const {product:p} of data.results.flatMap(row=>row.product_entries)) {
        if (p.category_id!==id || entries.size>=50) continue;
        const specs = compact(p.specs ?? {}) as Record<string,unknown>;
        const socket = specs.chipset_northbridge_family_socket_socket_name || specs.socket_name || specs.socket_socket_name;
        const format = specs.format_format_name || specs.format_name;
        entries.set(p.id,{
          id:p.id,name:p.name,category,brand:p.brand?.name ?? null,priceCLP:0,
          solotodoUrl:`https://www.solotodo.cl/products/${p.id}`,socket:typeof socket==="string"?socket:null,
          tdp:Number(specs.tdp)||null,format:typeof format==="string"?format:null,store:"Sin oferta verificada",specs,
        });
      }
      return [...entries.values()];
    }));
    products.push(...batches.flat());
  }
  const offers = await fetchStoreOffers(products.map(p=>String(p.id)),signal);
  const priced = products.flatMap(p=>{
    const list = offers[String(p.id)];
    return list?.length ? [{...p,priceCLP:Math.min(...list.map(o=>o.priceCLP))}] : [];
  });
  if (categories.some(([,category])=>!priced.some(p=>p.category===category))) {
    throw new Error("La actualización no devolvió ofertas para todas las categorías.");
  }
  return {updatedAt:new Date().toISOString(),products:priced,offers};
}

function sign(payload:string, key:string) {
  return createHmac("sha256",key).update("solotodo-catalog-v1:").update(payload).digest();
}
export function encodeSnapshot(snapshot:Snapshot,key:string) {
  const payload = gzipSync(JSON.stringify(snapshot)).toString("base64url");
  const token = `${payload}.${sign(payload,key).toString("base64url")}`;
  if (token.length > maxSnapshotLength) throw new Error("El catálogo supera el tamaño permitido.");
  return token;
}
export function decodeSnapshot(token:string,key:string): Snapshot {
  const [payload,encodedSignature,extra] = token.split(".");
  if (!payload || !encodedSignature || extra!==undefined || token.length>maxSnapshotLength) throw new Error("Catálogo inválido.");
  const signature = Buffer.from(encodedSignature,"base64url");
  if (signature.length!==32 || !timingSafeEqual(signature,sign(payload,key))) throw new Error("Firma de catálogo inválida.");
  return JSON.parse(gunzipSync(Buffer.from(payload,"base64url"),{maxOutputLength:8_000_000}).toString("utf8")) as Snapshot;
}
