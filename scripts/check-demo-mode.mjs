import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { loadTypescript } from "./load-typescript.mjs";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");
const { POST } = loadTypescript("src/app/api/quote/route.ts");
const { products } = loadTypescript("src/lib/quote-selection.ts");
const { encodeSnapshot } = loadTypescript("src/lib/catalog-snapshot.ts");
const originalFetch = globalThis.fetch;
const originalKey = process.env.OPENROUTER_API_KEY;
const originalSigningKey = process.env.CATALOG_SIGNING_SECRET;
let networkCalls = 0;
globalThis.fetch = async () => {
  networkCalls++;
  throw new Error("Demo must not make network requests");
};
process.env.OPENROUTER_API_KEY = "test-provider-key-must-not-be-used";
process.env.CATALOG_SIGNING_SECRET = "test-catalog-signing-secret";
const filters = {
  budgetCLP: 1800000, useCase: "gaming", cpuPreference: "any", gpuPreference: "any",
  storageCapacity: "1tb", storageType: "nvme", ramCapacity: "16gb",
  wifiRequired: false, coolingPreference: "air", caseSize: "standard",
};
async function send(body) {
  const response = await POST(new NextRequest("http://localhost/api/quote", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json() };
}
try {
  for (const useCase of ["office", "home_study", "creative", "gaming", "dev_data"]) {
    const response = await send({ filters: { ...filters, useCase }, mode: "ai", useAI: true });
    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.mode, "demo");
    assert.equal(response.body.quote.generationMode, "demo");
    assert.equal(response.body.quote.catalogSelection.sentProducts, 0);
    assert(response.body.quote.actualCostCLP <= filters.budgetCLP);
    assert(response.body.quote.alternatives.cpu.length > 1);
  }
  const catalogToken = encodeSnapshot({ updatedAt: new Date().toISOString(), products, offers: {} }, process.env.CATALOG_SIGNING_SECRET);
  const initial = await send({ filters, catalogToken });
  assert.equal(initial.status, 200);
  const option = initial.body.quote.alternatives.cpu[1];
  const selection = initial.body.quote.components.map(item => item.category === "cpu" ? option.component : item);
  const changed = await send({ filters, selection, catalogToken, mode: "ai" });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.quote.generationMode, "demo");
  assert.equal(changed.body.quote.actualCostCLP, option.totalCLP);
  delete process.env.CATALOG_SIGNING_SECRET;
  const legacyToken = encodeSnapshot({ updatedAt: new Date().toISOString(), products, offers: {} }, process.env.OPENROUTER_API_KEY);
  assert.equal((await send({ filters, catalogToken: legacyToken })).status, 200, "Existing catalog signatures must keep working without consuming AI requests");
  delete process.env.OPENROUTER_API_KEY;
  const withoutApiKey = await send({ filters });
  assert.equal(withoutApiKey.status, 200, "The public demo must work without an OpenRouter key");
  assert.equal(networkCalls, 0, "Direct endpoint calls, signed catalogs and swaps must consume zero provider requests");
  console.log("Passed demo endpoint checks for all five uses, mode bypass attempts, signed catalogs, component changes and zero network/provider calls.");
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalKey;
  if (originalSigningKey === undefined) delete process.env.CATALOG_SIGNING_SECRET;
  else process.env.CATALOG_SIGNING_SECRET = originalSigningKey;
}
