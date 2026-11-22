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
