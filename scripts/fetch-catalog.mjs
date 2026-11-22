import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadTypescript } from "./load-typescript.mjs";

const { refreshSnapshot } = loadTypescript("src/lib/catalog-snapshot.ts");
const { createProfileIndex } = loadTypescript("src/lib/catalog-profiles.ts");
const output = fileURLToPath(new URL("../src/data/solotodo-catalog.json", import.meta.url));
const snapshot = await refreshSnapshot();
const categories = {};
for (const product of snapshot.products) {
  (categories[product.category] ??= []).push({
    ...product, store: "Precio de referencia SoloTodo",
  });
}
const catalog = {
  updatedAt: snapshot.updatedAt, totalProducts: snapshot.products.length,
  profiles: Object.fromEntries(Object.entries(createProfileIndex(snapshot.products)).map(([useCase, ids]) => [useCase, ids.length])),
  categories,
};
await fs.writeFile(output + ".tmp", JSON.stringify(catalog, null, 2) + "\n");
await fs.rename(output + ".tmp", output);
console.log(JSON.stringify({
  updatedAt: catalog.updatedAt, totalProducts: catalog.totalProducts,
  categories: Object.fromEntries(Object.entries(categories).map(([category, items]) => [category, items.length])),
  profiles: catalog.profiles,
  bytes: (await fs.stat(output)).size,
}, null, 2));
