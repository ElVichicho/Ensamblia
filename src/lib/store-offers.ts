import type { BuildQuote } from "@/types/pc-builder";

export type Offer = { storeId?: string; store: string; storeUrl: string; priceCLP: number };
type Plan = { cost: number; offers: (Offer | undefined)[] };
type Entity = {
  currency_id: number; condition: string; is_visible: boolean; store_id: number;
  seller: string | null; external_url: string;
  active_registry?: { is_available: boolean; normal_price: string; offer_price: string };
};

export function planStores(choices: Offer[][], budget: number, consolidate: boolean) {
  const cheapest = choices.map(list => [...list].sort((a,b) => a.priceCLP-b.priceCLP)[0]);
  if (!consolidate) return cheapest;
  const known = choices.reduce((mask, list, index) => list.length ? mask | (1 << index) : mask, 0);
  const stores = new Set(choices.flat().map(offer => offer.store));
  const states = new Map<string, Plan>([["0:0", {cost:0, offers:[]}]]);
  for (const store of stores) {
    const available = choices.map(list => list.filter(offer => offer.store === store)
      .sort((a,b) => a.priceCLP-b.priceCLP)[0]);
    const coverage = available.reduce((mask, offer, index) => offer ? mask | (1 << index) : mask, 0);
    for (const [key, plan] of [...states]) {
      const [mask,count] = key.split(":").map(Number);
      const remaining = coverage & ~mask;
      for (let subset = remaining; subset; subset = (subset-1) & remaining) {
        const offers = [...plan.offers];
        let cost = plan.cost;
        available.forEach((offer,index) => {
          if (subset & (1 << index)) { offers[index] = offer; cost += offer!.priceCLP; }
        });
        if (cost > budget) continue;
        const next = `${mask | subset}:${count+1}`;
        if (cost < (states.get(next)?.cost ?? Infinity)) states.set(next, {cost, offers});
      }
    }
  }
  for (let count=1; count<=choices.length; count++) {
    const plan = states.get(`${known}:${count}`);
    if (plan) return choices.map((_, index) => plan.offers[index]);
  }
  return cheapest;
}

const base = "https://publicapi.solotodo.com";

export async function fetchStoreOffers(ids: string[], signal: AbortSignal) {
  const storesResponse = await fetch(`${base}/stores/`, {signal,cache:"no-store"});
  if (!storesResponse.ok) throw new Error("No se pudieron consultar las tiendas.");
  const stores = await storesResponse.json() as {id:number; name:string; country_id:number}[];
  const names = new Map(stores.filter(store => store.country_id === 1).map(store => [store.id,store.name]));
  const offers: Record<string, Offer[]> = {};
  async function loadBatch(batch: string[]) {
    const params = new URLSearchParams();
    batch.forEach(id => params.append("ids",id));
    let url = new URL(`${base}/products/available_entities/?${params}`);
    const visited = new Set<string>();
    while (true) {
      if (url.origin !== base || visited.has(url.href)) throw new Error("Paginación de ofertas inválida.");
      visited.add(url.href);
      const response = await fetch(url,{signal,cache:"no-store"});
      if (!response.ok) throw new Error(`Falló la consulta de ofertas (${response.status}).`);
      const data = await response.json() as {next:string|null;results:{product:{id:number};entities:Entity[]}[]};
      for (const row of data.results) {
        const id = String(row.product.id);
        if (!batch.includes(id)) continue;
        const byStore = new Map<string, Offer>();
        for (const entity of row.entities) {
          const name = names.get(entity.store_id);
          const registry = entity.active_registry;
          const price = Number(registry?.offer_price) || Number(registry?.normal_price);
          if (!name || entity.currency_id !== 1 || !registry?.is_available || !entity.is_visible ||
              entity.condition !== "https://schema.org/NewCondition" || !Number.isSafeInteger(price) || price <= 0 ||
              !/^https?:\/\//i.test(entity.external_url)) continue;
          const store = entity.seller ? `${name} · ${entity.seller}` : name;
          if (price < (byStore.get(store)?.priceCLP ?? Infinity)) byStore.set(store,{storeId:`solotodo-${entity.store_id}${entity.seller?`-${Buffer.from(entity.seller).toString('base64url')}`:''}`,store,storeUrl:entity.external_url,priceCLP:price});
        }
        offers[id] = [...byStore.values()];
      }
      if (!data.next) break;
      url = new URL(data.next,base);
    }
  }
  for (let offset=0; offset<ids.length; offset+=80) {
    await Promise.all([0,20,40,60].map(start=>ids.slice(offset+start,offset+start+20))
      .filter(batch=>batch.length).map(loadBatch));
  }
  return offers;
}

export function attachStoreOffers(quote: BuildQuote, consolidate: boolean, offers: Record<string, Offer[]> = {}): BuildQuote {
  const choices = quote.components.map(item => (offers[item.id] ?? []).map(offer => ({
    ...offer, priceCLP:offer.priceCLP*(item.quantity ?? 1),
  })));
  const referenceCost = quote.components.reduce((sum,item,index) => sum + (choices[index].length ? 0 : item.priceCLP),0);
  const selected = planStores(choices,quote.totalBudgetCLP-referenceCost,consolidate);
  const components = quote.components.map((item,index) => selected[index] ?
    {...item,...selected[index]} : {...item,store:"Sin oferta verificada"});
  return {...quote,components,actualCostCLP:components.reduce((sum,item)=>sum+item.priceCLP,0)};
}
