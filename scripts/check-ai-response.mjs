import assert from 'node:assert/strict';
import {loadTypescript} from './load-typescript.mjs';
const {parseAiSelection}=loadTypescript('src/lib/ai-selection.ts');
const {requestBuildFromOpenRouter}=loadTypescript('src/lib/openrouter.ts');
const valid={option:1,buildName:'Equipo',summary:'Presupuesto y compatibilidad.',upgradePath:'Revisar RAM',reasons:{cpu:'Rendimiento útil.'}};
assert.equal(parseAiSelection(JSON.stringify(valid),[1]).option,1);
assert.equal(parseAiSelection('```json\n'+JSON.stringify(valid).replace(/}$/,',}')+'\n```',[1]).summary,valid.summary);
assert.equal(parseAiSelection('{option:1,buildName:"Equipo",summary:"Texto ,}",upgradePath:"RAM",reasons:{cpu:"Motivo",},}',[1]).summary,'Texto ,}');
for(const value of [{...valid,option:999},{...valid,option:true},{...valid,option:'1'},{...valid,summary:''},null])assert.throws(()=>parseAiSelection(JSON.stringify(value),[1]));
assert.throws(()=>parseAiSelection('x'.repeat(20001),[1]));
assert.throws(()=>parseAiSelection('sin selección',[1]));
const original=globalThis.fetch;
const filters={budgetCLP:1800000,useCase:'gaming',cpuPreference:'any',gpuPreference:'any',storageCapacity:'1tb',storageType:'nvme',ramCapacity:'16gb',wifiRequired:false,coolingPreference:'air',caseSize:'standard'};
let calls=0;
function stub(contents,finishReason){calls=0;globalThis.fetch=async()=>{const content=contents[Math.min(calls++,contents.length-1)];return Response.json({model:'test:free',choices:[{finish_reason:finishReason??'stop',message:{content}}]});};}
try{
 stub([JSON.stringify(valid).replace(/}$/,',}')]);
 const repaired=await requestBuildFromOpenRouter(filters,'dummy-key');
 assert.equal(calls,1,'Repair must not spend another generation');
 assert(repaired.quote.actualCostCLP<=filters.budgetCLP);
 assert(repaired.quote.components.every(c=>c.id&&c.priceCLP>0));
 stub(['{option:999,buildName:"Wrong",summary:"Invalid",upgradePath:"RAM"}',JSON.stringify(valid)]);
 assert.equal((await requestBuildFromOpenRouter(filters,'dummy-key')).quote.buildName,'Equipo');assert.equal(calls,2);
 stub(['{option:999,}']);
 await assert.rejects(requestBuildFromOpenRouter(filters,'dummy-key'),e=>e.status===502&&!/JSON|position|Expected/.test(e.message));assert.equal(calls,2);
 stub([JSON.stringify(valid)],'length');
 await assert.rejects(requestBuildFromOpenRouter(filters,'dummy-key'),e=>e.status===502);assert.equal(calls,2,'Truncated output must never be accepted just because repair could close it');
 globalThis.fetch=async()=>{calls++;return new Response('',{status:429});};calls=0;
 await assert.rejects(requestBuildFromOpenRouter(filters,'dummy-key'),e=>e.status===429);assert.equal(calls,1);
 console.log('IA: JSON reparable sin solicitudes extra, selección validada, reintento acotado, truncamiento y límite 429 correctos.');
}finally{globalThis.fetch=original;}
