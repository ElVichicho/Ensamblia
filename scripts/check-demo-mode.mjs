import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {loadTypescript} from './load-typescript.mjs';
const require=createRequire(import.meta.url),{NextRequest}=require('next/server');
const {POST}=loadTypescript('src/app/api/quote/route.ts');
const {quoteMode}=loadTypescript('src/lib/deployment-mode.ts');
const originalEnv={...process.env},originalFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=async()=>{calls++;throw Error('Unexpected network request')};
const filters={budgetCLP:1800000,useCase:'gaming',cpuPreference:'any',gpuPreference:'any',storageCapacity:'1tb',storageType:'nvme',ramCapacity:'16gb',wifiRequired:false,coolingPreference:'air',caseSize:'standard'};
async function send(body){const r=await POST(new NextRequest('http://localhost/api/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,body:await r.json()};}
try{
  delete process.env.UPSTASH_REDIS_REST_URL;delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;
  process.env.VERCEL='1';process.env.VERCEL_ENV='production';process.env.VERCEL_GIT_COMMIT_REF='preview';
  process.env.ENSAMBLIA_QUOTE_MODE='ai';process.env.OPENROUTER_API_KEY='dummy-key-must-not-be-used';
  assert.equal(quoteMode(),'demo');
  for(const useCase of ['office','home_study','creative','gaming','dev_data']){
    const r=await send({filters:{...filters,useCase},mode:'ai',useAI:true,catalogToken:'untrusted-client-data'});
    assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.mode,'demo');
    assert.equal(r.body.quote.generationMode,'demo');assert.equal(r.body.quote.catalogSelection.sentProducts,0);
    assert.equal(r.body.catalog.status,'unconfigured');assert(r.body.quote.actualCostCLP<=filters.budgetCLP);
  }
  const initial=await send({filters}),option=initial.body.quote.alternatives.cpu[1];
  const selection=initial.body.quote.components.map(item=>item.category==='cpu'?option.component:item);
  const changed=await send({filters,selection,catalogUpdatedAt:initial.body.catalog.updatedAt});
  assert.equal(changed.status,200);assert.equal(changed.body.quote.actualCostCLP,option.totalCLP);
  assert.equal((await send({filters,selection,catalogUpdatedAt:'old'})).status,409);
  delete process.env.OPENROUTER_API_KEY;assert.equal((await send({filters})).status,200);
  assert.equal(calls,0,'Production never calls the IA provider even with an AI flag or leftover key');
  process.env.VERCEL_ENV='preview';process.env.VERCEL_GIT_COMMIT_REF='codex/untrusted-feature';
  assert.equal(quoteMode(),'demo');
  process.env.VERCEL_GIT_COMMIT_REF='preview';assert.equal(quoteMode(),'ai');
  assert.equal((await send({filters})).status,503,'AI preview needs a server key');
  assert.equal(calls,0);
  process.env.OPENROUTER_API_KEY='dummy-preview-key';
  globalThis.fetch=async(url,init)=>{
    calls++;assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(init.headers.Authorization,'Bearer dummy-preview-key');
    return Response.json({choices:[{message:{content:JSON.stringify({option:1,buildName:'Prueba IA',summary:'Selección de prueba.',upgradePath:'Revisar almacenamiento',reasons:{cpu:'Prueba',gpu:'Prueba',ram:'Prueba',storage:'Prueba'}}).replace(/}$/,',}')}}]});
  };
  const ai=await send({filters});assert.equal(ai.status,200,JSON.stringify(ai.body));
  assert.equal(ai.body.mode,'ai');assert.equal(ai.body.quote.generationMode,'ai');assert.equal(calls,1);
  const swap=await send({filters,selection:ai.body.quote.components,catalogUpdatedAt:ai.body.catalog.updatedAt});
  assert.equal(swap.status,200);assert.equal(calls,1,'Changing pieces does not spend AI quota');
  assert.equal(quoteMode({NODE_ENV:'production',ENSAMBLIA_QUOTE_MODE:'ai'}),'demo');
  assert.equal(quoteMode({NODE_ENV:'development',ENSAMBLIA_QUOTE_MODE:'ai'}),'ai');
  console.log('Passed production quota isolation, all uses, preview branch gate, missing keys, simulated AI, validated swaps and stale catalog conflicts.');
}finally{
 globalThis.fetch=originalFetch;
 for(const key of Object.keys(process.env))if(!(key in originalEnv))delete process.env[key];
 Object.assign(process.env,originalEnv);
}
