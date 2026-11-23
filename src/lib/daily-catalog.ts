import { randomUUID } from "node:crypto";
import reference from "@/data/solotodo-catalog.json";
import { products } from "./quote-selection";
import { refreshSnapshot, type Snapshot } from "./catalog-snapshot";
import { catalogRpc } from "./supabase-catalog";
import { limitCatalog } from "./companies";
export type CatalogStatus = "current" | "stale" | "unconfigured" | "unavailable";
export type DailyCatalog = { snapshot: Snapshot; status: CatalogStatus };
export function catalogDay(date: number | string) {
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(date));
}
const fallback: Snapshot = {updatedAt:reference.updatedAt,products,offers:{}};
export function catalogIsCurrent(updatedAt:string,now=Date.now()) {
  const expected=new Date(now);expected.setUTCHours(9,0,0,0);
  if(now<expected.getTime())expected.setUTCDate(expected.getUTCDate()-1);
  // An explicit recovery published earlier on the scheduled day also counts.
  return catalogDay(updatedAt)>=catalogDay(expected.getTime());
}
export function validateSnapshot(value: unknown): Snapshot {
  const snapshot=value as Snapshot;
  if (!snapshot || !Number.isFinite(Date.parse(snapshot.updatedAt)) || !Array.isArray(snapshot.products) || !snapshot.products.length || !snapshot.offers) throw new Error("Invalid catalog snapshot");
  return snapshot;
}
// Reads only: visitors cannot trigger requests to a source API.
export async function getDailyCatalog(): Promise<DailyCatalog> {
  try {
    const rpc=catalogRpc();
    if (!rpc) return {snapshot:fallback,status:"unconfigured"};
    const data=await rpc<Snapshot|null>("get_catalog_snapshot");
    if (!data) return {snapshot:fallback,status:"stale"};
    const snapshot=validateSnapshot(data);
    return {snapshot,status:catalogIsCurrent(snapshot.updatedAt)?"current":"stale"};
  } catch { return {snapshot:fallback,status:"unavailable"}; }
}
type SyncDependencies = { rpc: NonNullable<ReturnType<typeof catalogRpc>>; refresh: () => Promise<Snapshot>; owner?: string };
export async function synchronizeCatalog({rpc,refresh,owner=randomUUID()}: SyncDependencies) {
  const claimed=await rpc<boolean>("claim_catalog_sync",{p_owner:owner});
  if (!claimed) return {status:"already_attempted" as const};
  let stage="download";
  try {
    const fresh=validateSnapshot(await refresh());
    stage="selection";
    const snapshot=limitCatalog(fresh);
    stage="publication";
    await rpc("publish_catalog",{p_owner:owner,p_snapshot:snapshot});
    return {status:"published" as const,count:snapshot.products.length,updatedAt:snapshot.updatedAt};
  } catch(error) {
    console.error("Catalog sync failed",{stage,code:error instanceof Error&&error.message.startsWith("Catalog database request failed")?error.message:"SOURCE_OR_VALIDATION_FAILED"});
    await rpc("fail_catalog_sync",{p_owner:owner}).catch(()=>undefined);
    throw new Error("Catalog synchronization failed; previous version retained");
  }
}
export async function runDailySync() {
  const rpc=catalogRpc(true);
  if (!rpc) throw new Error("Catalog write credentials are not configured");
  return synchronizeCatalog({rpc,refresh:refreshSnapshot});
}
