import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = fs.readFileSync("src/lib/quote-selection.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)(
  id => id.startsWith("@/") ? require(path.resolve("src", id.slice(2))) : require(id),
  module, module.exports,
);
const { selectCandidates, createQuote } = module.exports;
const base = {
  budgetCLP: 500000, useCase: "gaming", cpuPreference: "any", gpuPreference: "any",
  storageCapacity: "1tb", storageType: "nvme", ramCapacity: "16gb",
  wifiRequired: false, coolingPreference: "air", caseSize: "standard",
};
const basic = selectCandidates(base);
const powerful = selectCandidates({ ...base, budgetCLP: 2200000 });
const basicCpu = basic.filter(p => p.category === "cpu").map(p => p.id);
const powerfulCpu = powerful.filter(p => p.category === "cpu").map(p => p.id);
assert.notDeepEqual(basicCpu, powerfulCpu, "Budget must change the CPU candidate pool");
assert(Math.max(...powerful.filter(p => p.category === "cpu").map(p => p.specs.passmark_score || 0)) >
       Math.min(...basic.filter(p => p.category === "cpu").map(p => p.specs.passmark_score || 0)));
assert(powerful.some(p => p.category === "gpu" && p.specs.gpu_tdmark_time_spy_score > 0));
assert(powerful.filter(p=>p.category==="storage").every(p=>p.specs.capacity_value>=1000));
assert(powerful.filter(p=>p.category==="ram").every(p=>p.specs.bus_bus_bus_format_name==="DIMM"));

const categories = ["cpu","motherboard","ram","storage","psu","case","gpu","cooler"];
const fixture = categories.map((category,i)=>({
  id:i+1, name:category, category, brand:"test", priceCLP:10000,
  solotodoUrl:"https://www.solotodo.cl/products/"+(i+1), socket:["cpu","motherboard"].includes(category)?"AM5":null,
  tdp:category==="cpu"?65:null, store:"Reference", specs:{
    graphics_name:"No posee",cooler_name:"No posee",tdp:65,
    memory_slots_mtype_itype_type_name:"DDR5",bus_bus_bus_type_name:"DDR5",
    capacity_total_capacity_value:8192,capacity_dimm_quantity_value:1,memory_slots_quantity:4,
    capacity_value:1000,power_value:750,gpu_tdp:100,
  },
}));
const selection = Object.fromEntries(fixture.map(p=>[p.category,{id:p.id,quantity:p.category==="ram"?2:1,reason:"Test"}]));
const response = {buildName:"Test",summary:"Test",upgradePath:"Test",components:selection};
const quote = createQuote(JSON.stringify(response), base, fixture);
assert.equal(quote.components.find(p=>p.category==="ram").quantity,2);
assert.equal(quote.actualCostCLP,90000, "The server must multiply quantities and sum catalog prices");
assert.equal(quote.components.find(p=>p.category==="ram").priceCLP,20000);
const duplicate = [...Object.values(selection), selection.cpu];
assert.equal(createQuote(JSON.stringify({...response,components:duplicate}),base,fixture).components.length,8);
assert.throws(()=>createQuote(JSON.stringify({...response,components:{...selection,ram:{...selection.ram,quantity:1}}}),base,fixture),/RAM/);
assert.throws(()=>createQuote(JSON.stringify(response),{...base,budgetCLP:80000},fixture),/excede/);
assert.throws(()=>createQuote(JSON.stringify({...response,components:{...selection,cpu:{id:999,reason:"Unknown"}}}),base,fixture),/inválido/);
console.log("Passed budget candidate diversity, specifications, quantities, duplicate IDs, RAM, budget and unknown product checks.");

