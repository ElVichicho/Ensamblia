import type { BuildQuote } from "@/types/pc-builder";

type Offer = { store: string; storeUrl: string; priceCLP: number };
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

export async function attachStoreOffers(quote: BuildQuote, consolidate: boolean): Promise<BuildQuote> {
  const base = "https://publicapi.solotodo.com";
  const params = new URLSearchParams();
  quote.components.forEach(item => params.append("ids", item.id));
  try {
    const signal = AbortSignal.timeout(6500);
    const [offersResponse, storesResponse] = await Promise.all([
      fetch(`${base}/products/available_entities/?${params}`, {signal, next:{revalidate:180}}),
      fetch(`${base}/stores/`, {signal, next:{revalidate:86400}}),
    ]);
    if (!offersResponse.ok || !storesResponse.ok) throw new Error("SoloTodo no respondió correctamente.");
    const data = await offersResponse.json() as { results: {product:{id:number}; entities:Entity[]}[] };
    const stores = await storesResponse.json() as {id:number; name:string; country_id:number}[];
    const names = new Map(stores.filter(store => store.country_id === 1).map(store => [store.id,store.name]));
    const choices = quote.components.map(item => (data.results.find(row => String(row.product.id) === item.id)?.entities ?? [])
      .flatMap((entity): Offer[] => {
        const name = names.get(entity.store_id);
        const registry = entity.active_registry;
        const price = Number(registry?.offer_price) || Number(registry?.normal_price);
        if (!name || entity.currency_id !== 1 || !registry?.is_available || !entity.is_visible ||
            entity.condition !== "https://schema.org/NewCondition" || !Number.isSafeInteger(price) || price <= 0 ||
            !/^https?:\/\//i.test(entity.external_url)) return [];
        return [{store:entity.seller ? `${name} · ${entity.seller}` : name,
          storeUrl:entity.external_url, priceCLP:price*(item.quantity ?? 1)}];
      }));
    const referenceCost = quote.components.reduce((sum,item,index) => sum + (choices[index].length ? 0 : item.priceCLP),0);
    const selected = planStores(choices, quote.totalBudgetCLP-referenceCost, consolidate);
    const components = quote.components.map((item,index) => selected[index] ?
      {...item,...selected[index]} : {...item,store:"Sin oferta verificada"});
    return {...quote, components, actualCostCLP:components.reduce((sum,item)=>sum+item.priceCLP,0)};
  } catch (error) {
    console.warn("Ofertas SoloTodo:",error);
    return {...quote,components:quote.components.map(item=>({...item,store:"Sin oferta verificada"}))};
  }
}
