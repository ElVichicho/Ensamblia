import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../src/data/solotodo-catalog.json", import.meta.url));
const categories = [[3,"cpu"],[5,"motherboard"],[7,"ram"],[2,"gpu"],[39,"storage"],[9,"psu"],[10,"case"],[12,"cooler"]];

function compact(value) {
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !key.endsWith("_id") && !key.endsWith("_unicode") && !["id","unicode","picture","default_bucket"].includes(key))
      .map(([key,item]) => [key,compact(item)]));
  }
  return value;
}

const catalog = { updatedAt: new Date().toISOString(), totalProducts: 0, categories: {} };
for (const [id,category] of categories) {
  const response = await fetch(
    `https://publicapi.solotodo.com/products/browse/?categories=${id}&page_size=50`,
    { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "SoloTodo-Academic-Catalog/1.0" } },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${category}. El catálogo anterior se conserva.`);
  const data = await response.json();
  const records = new Map();
  for (const entry of data.results) {
    for (const {product:p,metadata:m} of entry.product_entries || []) {
      const s=p.specs||{};
      const price=m?.prices_per_currency?.find(item=>JSON.stringify(item).includes("CLP"))||m?.prices_per_currency?.[0];
      const priceCLP=Math.round(price?.offer_price||price?.normal_price||0);
      if (!priceCLP || p.category_id!==id) continue;
      records.set(p.id, {
        id:p.id, name:p.name, category, categoryLabel:category, brand:p.brand?.name||null,
        priceCLP, solotodoUrl:`https://www.solotodo.cl/products/${p.id}`,
        socket:s.chipset_northbridge_family_socket_socket_name||s.socket_name||s.socket_socket_name||null,
        tdp:s.tdp||null, format:s.format_format_name||s.format_name||null,
        store:"Precio de referencia SoloTodo", pictureUrl:p.picture_url||null, specs:compact(s),
      });
    }
  }
  if (!records.size) throw new Error(`Sin productos con precio para ${category}. El catálogo anterior se conserva.`);
  catalog.categories[category]=[...records.values()];
  catalog.totalProducts+=records.size;
  console.log(category, records.size);
  await new Promise(resolve=>setTimeout(resolve,750));
}
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output+".tmp", JSON.stringify(catalog,null,2)+"\n");
await fs.rename(output+".tmp",output);
console.log(`Catálogo actualizado: ${catalog.totalProducts} productos.`);
