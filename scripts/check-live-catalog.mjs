// Read-only catalog checks and demo quotes. Refuses AI before generating quotes.
import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3000';
const res=await fetch(base+'/api/catalog');assert.equal(res.status,200);
const catalog=await res.json();assert.equal(catalog.status,'current');assert(catalog.companies.length>0);assert(catalog.count<=400);
const filters={budgetCLP:800000,useCase:'office',cpuPreference:'any',gpuPreference:'any',storageCapacity:'1tb',storageType:'nvme',ramCapacity:'16gb',wifiRequired:false,coolingPreference:'air',caseSize:'standard'};
const page=await(await fetch(base+'/cotizador')).text();assert(page.includes('Demo interactiva sin IA'),'Use this check only on a demo deployment.');
async function quote(filters,extra={}){const r=await fetch(base+'/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filters,...extra})});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));assert.equal(data.mode,'demo');assert(data.quote.actualCostCLP<=filters.budgetCLP);assert.equal(data.catalog.updatedAt,catalog.updatedAt);return data;}
for(const company of catalog.companies){
 for(const [useCase,budgetCLP] of [['office',800000],['gaming',1200000],['gaming',2200000]]){
  const request={...filters,useCase,budgetCLP,companyIds:[company.id]};
  const data=await quote(request);assert(data.quote.components.every(p=>p.store===company.name&&p.storeUrl));
  for(const choices of Object.values(data.quote.alternatives))for(const option of choices){assert.equal(option.component.store,company.name);assert(option.totalCLP<=budgetCLP);}
  console.log(company.name,useCase,budgetCLP,data.quote.actualCostCLP);
 }
}
const data=await quote({...filters,budgetCLP:2200000,useCase:'gaming',consolidateStores:true});
await quote({...filters,budgetCLP:2200000,useCase:'gaming',consolidateStores:true},{selection:data.quote.components,catalogUpdatedAt:data.catalog.updatedAt});
console.log('Verified live catalog reads, selected-company prices/alternatives, budget bands, grouping and swaps without AI.');
