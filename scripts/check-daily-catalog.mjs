import assert from 'node:assert/strict';
import { loadTypescript } from './load-typescript.mjs';
const {createDailyCatalog,catalogDay,encodeCatalog,decodeCatalog}=loadTypescript('src/lib/daily-catalog.ts');
const {products}=loadTypescript('src/lib/quote-selection.ts');
let now=Date.parse('2026-11-22T12:00:00Z'), downloads=0;
const store=new Map();
const command=async ([op,...args])=>{
  if(op==='GET')return store.get(args[0])??null;
  if(op==='SET'){
    if(args.includes('NX')&&store.has(args[0]))return null;
    store.set(args[0],args[1]);return 'OK';
  }
  if(op==='EVAL'){
    const [,count,...rest]=args;assert.equal(count,3);
    const [claim,snapshot,version,owner,packed,updatedAt]=rest;
    if(store.get(claim)!==owner)return 0;
    if(packed&&(!store.get(version)||store.get(version)<=updatedAt)){
      store.set(snapshot,packed);store.set(version,updatedAt);
    }
    store.set(claim,'done');return 1;
  }
  throw Error(op);
};
const fresh=()=>({updatedAt:new Date(now).toISOString(),products,offers:{}});
const deps={command,namespace:'test',now:()=>now,sleep:()=>new Promise(r=>setTimeout(r,1)),refresh:async()=>{
  downloads++;await new Promise(r=>setTimeout(r,5));return fresh();
}};
assert.equal(catalogDay('2026-11-23T02:59:59Z'),'2026-11-22');
assert.equal(catalogDay('2026-11-23T03:00:00Z'),'2026-11-23');
assert.equal(catalogDay('2026-07-23T03:59:59Z'),'2026-07-22');
assert.equal(catalogDay('2026-07-23T04:00:00Z'),'2026-07-23');
const simultaneous=await Promise.all(Array.from({length:12},()=>createDailyCatalog(deps)()));
assert.equal(downloads,1,'Separate instances share a single download');
assert(simultaneous.every(x=>x.status==='current'));
await createDailyCatalog(deps)();assert.equal(downloads,1,'Warm quotes reuse persisted data');
now+=86400000;
await createDailyCatalog(deps)();assert.equal(downloads,2,'Next Chilean day refreshes once');
now+=86400000;
const failedDeps={...deps,refresh:async()=>{downloads++;throw Error('provider offline')}};
const stale=await createDailyCatalog(failedDeps)();
assert.equal(stale.status,'stale');assert.equal(downloads,3);
assert.equal((await createDailyCatalog(failedDeps)()).snapshot.updatedAt,stale.snapshot.updatedAt);
assert.equal(downloads,3,'Failure consumes the daily claim and keeps last good data');
const coldDeps={...failedDeps,namespace:'cold'};
assert.equal((await createDailyCatalog(coldDeps)()).status,'stale');
await createDailyCatalog(coldDeps)();assert.equal(downloads,4,'Cold failure also prevents repeated downloads');
assert.equal((await createDailyCatalog({...deps,command:undefined})()).status,'unconfigured');
assert.equal((await createDailyCatalog({...deps,command:async()=>{throw Error('Redis offline')}})()).status,'unavailable');
assert.equal(downloads,4,'Storage failures must not trigger uncoordinated API calls');
const packed=encodeCatalog(fresh());assert.deepEqual(decodeCatalog(packed),fresh());
assert.throws(()=>decodeCatalog('invalid'));
store.set('corrupt:snapshot','invalid');
assert.equal((await createDailyCatalog({...deps,namespace:'corrupt'})()).status,'unavailable');
assert.equal(downloads,4);
// An abandoned claim cannot be stolen and cause a second refresh that day.
let clock=now;
store.set(`crash:attempt:${catalogDay(now)}`,'dead-worker');
const abandoned=await createDailyCatalog({...deps,namespace:'crash',now:()=>clock,sleep:async ms=>{clock+=ms}})();
assert.equal(abandoned.status,'stale');assert.equal(downloads,4);
console.log('Passed shared daily cache, concurrent instances, Chile/DST boundaries, next-day refresh, provider/storage failures, crash claims and compression checks.');
// Exercise the HTTP adapter using Vercel's actual variable names. No credentials
// or external network are needed; the response is a previously refreshed cache.
const {getDailyCatalog}=loadTypescript('src/lib/daily-catalog.ts');
const envKeys=['KV_REST_API_URL','KV_REST_API_TOKEN','KV_REST_API_READ_ONLY_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'];
const previousEnv=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]));
const originalFetch=globalThis.fetch;
try{
 const cached=encodeCatalog({updatedAt:new Date().toISOString(),products,offers:{}});
 const cases=[
  {env:{KV_REST_API_URL:' https://kv.example.test ',KV_REST_API_TOKEN:' kv-write '},url:'https://kv.example.test',token:'kv-write'},
  {env:{UPSTASH_REDIS_REST_URL:'https://upstash.example.test',UPSTASH_REDIS_REST_TOKEN:'upstash-write'},url:'https://upstash.example.test',token:'upstash-write'},
  {env:{KV_REST_API_URL:'https://kv.example.test',KV_REST_API_TOKEN:'kv-write',UPSTASH_REDIS_REST_URL:'https://upstash.example.test',UPSTASH_REDIS_REST_TOKEN:'other'},url:'https://kv.example.test',token:'kv-write'},
  {env:{KV_REST_API_URL:'https://incomplete.example.test',UPSTASH_REDIS_REST_URL:'https://upstash.example.test',UPSTASH_REDIS_REST_TOKEN:'upstash-write'},url:'https://upstash.example.test',token:'upstash-write'},
  {env:{KV_REST_API_URL:'https://kv.example.test',UPSTASH_REDIS_REST_TOKEN:'must-not-mix'}},
  {env:{KV_REST_API_URL:'https://kv.example.test',KV_REST_API_READ_ONLY_TOKEN:'readonly-must-not-be-used'}},
 ];
 for(const test of cases){
  for(const key of envKeys)delete process.env[key];
  Object.assign(process.env,test.env);
  let requests=0;
  globalThis.fetch=async(url,init)=>{
   requests++;assert.equal(url,test.url);assert.equal(init.headers.Authorization,`Bearer ${test.token}`);
   assert.equal(JSON.parse(init.body)[0],'GET');return Response.json({result:cached});
  };
  const result=await getDailyCatalog();
  assert.equal(result.status,test.url?'current':'unconfigured');
  assert.equal(requests,test.url?1:0);
 }
 console.log('Passed Vercel KV variables, legacy Upstash pairs, precedence, whitespace, incomplete pairs and read-only-token rejection.');
}finally{
 globalThis.fetch=originalFetch;
 for(const key of envKeys){if(previousEnv[key]===undefined)delete process.env[key];else process.env[key]=previousEnv[key];}
}
