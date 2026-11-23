// Download once for initial migration or an explicitly authorized recovery.
// Normal visitors never execute this script. It does not write to the database.
import fs from 'node:fs/promises';
import {loadTypescript} from './load-typescript.mjs';
const {refreshSnapshot}=loadTypescript('src/lib/catalog-snapshot.ts');
const {limitCatalog,catalogCompanies,scopeCatalog}=loadTypescript('src/lib/companies.ts');
const {createDemoQuote}=loadTypescript('src/lib/demo-quote.ts');
const output=process.argv[2];
if(!output)throw Error('Supply an output JSON path outside the repository.');
const raw=await refreshSnapshot();
await fs.writeFile(output+'.source.json',JSON.stringify(raw));
const snapshot=limitCatalog(raw);
await fs.writeFile(output,JSON.stringify(snapshot));
const filters={budgetCLP:2200000,useCase:'gaming',cpuPreference:'any',gpuPreference:'any',storageCapacity:'1tb',storageType:'nvme',ramCapacity:'16gb',wifiRequired:false,coolingPreference:'air',caseSize:'standard'};
for(const company of catalogCompanies(snapshot)){
  for(const useCase of ['office','gaming']){
    try{
      const result=createDemoQuote({...filters,useCase},scopeCatalog(snapshot,[company.id]).products);
      console.log(company.name,useCase,result.actualCostCLP);
      if(result.actualCostCLP>filters.budgetCLP)throw Error('Budget check failed');
    }catch(error){console.log('Coverage to review:',company.name,useCase,error.message);}
  }
}
await fs.writeFile(output,JSON.stringify(snapshot));
console.log(JSON.stringify({updatedAt:snapshot.updatedAt,products:snapshot.products.length,companies:catalogCompanies(snapshot),bytes:Buffer.byteLength(JSON.stringify(snapshot))}));
