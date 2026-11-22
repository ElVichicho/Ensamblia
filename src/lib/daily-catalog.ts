import { randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import reference from "@/data/solotodo-catalog.json";
import { products } from "./quote-selection";
import { refreshSnapshot, type Snapshot } from "./catalog-snapshot";

export type CatalogStatus = "current" | "stale" | "unconfigured" | "unavailable";
export type DailyCatalog = { snapshot: Snapshot; status: CatalogStatus };
export type RedisCommand = (command: (string | number)[]) => Promise<unknown>;
type Dependencies = {
  command?: RedisCommand;
  refresh: () => Promise<Snapshot>;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  namespace: string;
};

export function catalogDay(date: number | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}

const fallback: Snapshot = { updatedAt: reference.updatedAt, products, offers: {} };
const finish = `if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
if ARGV[2] ~= '' then
local previous = redis.call('GET', KEYS[3])
if not previous or previous <= ARGV[3] then
redis.call('SET', KEYS[2], ARGV[2])
redis.call('SET', KEYS[3], ARGV[3])
end
end
redis.call('SET', KEYS[1], 'done', 'EX', 172800)
return 1`;

export function encodeCatalog(snapshot: Snapshot) {
  const packed = gzipSync(JSON.stringify(snapshot)).toString("base64");
  if (Buffer.byteLength(packed) > 900_000) throw new Error("Catalog exceeds cache payload limit");
  return packed;
}

export function decodeCatalog(packed: unknown): Snapshot | undefined {
  if (typeof packed !== "string") return;
  const snapshot = JSON.parse(gunzipSync(Buffer.from(packed, "base64"), { maxOutputLength: 12_000_000 }).toString()) as Snapshot;
  if (!Number.isFinite(Date.parse(snapshot.updatedAt)) || !Array.isArray(snapshot.products) || !snapshot.products.length || !snapshot.offers) throw new Error("Invalid cached catalog");
  return snapshot;
}

// A persistent daily claim survives function crashes and deploys. Failed attempts
// also consume that day's claim: retries by visitors cannot hammer SoloTodo.
export function createDailyCatalog(deps: Dependencies) {
  return async function getCatalog(): Promise<DailyCatalog> {
    if (!deps.command) return { snapshot: fallback, status: "unconfigured" };
    const command = deps.command;
    const today = catalogDay(deps.now());
    const claimKey = `${deps.namespace}:attempt:${today}`;
    const snapshotKey = `${deps.namespace}:snapshot`;
    const versionKey = `${deps.namespace}:updatedAt`;
    let saved: Snapshot | undefined;
    try {
      saved = decodeCatalog(await command(["GET", snapshotKey]));
      if (saved && catalogDay(saved.updatedAt) === today) return { snapshot: saved, status: "current" };
      const owner = randomUUID();
      const claimed = await command(["SET", claimKey, owner, "NX", "EX", 172800]);
      if (claimed === "OK") {
        try {
          // Recheck after acquisition: another instance may have just published.
          saved = decodeCatalog(await command(["GET", snapshotKey])) ?? saved;
          if (!saved || catalogDay(saved.updatedAt) !== today) {
            const fresh = await deps.refresh();
            const published = await command(["EVAL", finish, 3, claimKey, snapshotKey, versionKey, owner, encodeCatalog(fresh), fresh.updatedAt]);
            if (published !== 1) throw new Error("Daily claim lost");
            return { snapshot: fresh, status: "current" };
          }
          await command(["EVAL", finish, 3, claimKey, snapshotKey, versionKey, owner, "", ""]);
          return { snapshot: saved, status: "current" };
        } catch {
          await command(["EVAL", finish, 3, claimKey, snapshotKey, versionKey, owner, "", ""]);
          return { snapshot: saved ?? fallback, status: "stale" };
        }
      }
      // Concurrent first visitors wait for the one downloader. A crashed worker
      // leaves its claim until the following day; the reference remains usable.
      const deadline = deps.now() + 48_000;
      while (deps.now() < deadline) {
        if (await command(["GET", claimKey]) === "done") break;
        await deps.sleep(1000);
        saved = decodeCatalog(await command(["GET", snapshotKey])) ?? saved;
        if (saved && catalogDay(saved.updatedAt) === today) return { snapshot: saved, status: "current" };
      }
      saved = decodeCatalog(await command(["GET", snapshotKey])) ?? saved;
      return { snapshot: saved ?? fallback, status: saved && catalogDay(saved.updatedAt) === today ? "current" : "stale" };
    } catch {
      // Never query SoloTodo without a working distributed claim.
      return { snapshot: saved ?? fallback, status: "unavailable" };
    }
  };
}

function redisCommand(): RedisCommand | undefined {
  const configured = [
    { url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN },
    { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN },
  ].find(({url,token}) => url?.trim() && token?.trim());
  if (!configured?.url || !configured.token) return;
  const url = configured.url.trim();
  const token = configured.token.trim();
  return async command => {
    const response = await fetch(url, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command), cache: "no-store", signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Catalog storage unavailable");
    const data = await response.json();
    if (data.error) throw new Error("Catalog storage command failed");
    return data.result;
  };
}

export function getDailyCatalog() {
  return createDailyCatalog({ command: redisCommand(), refresh: refreshSnapshot,
    now: Date.now, sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    namespace: process.env.CATALOG_CACHE_NAMESPACE?.trim() || "ensamblia:catalog:v1",
  })();
}
