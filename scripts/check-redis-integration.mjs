import assert from "node:assert/strict";
import { createConnection } from "node:net";
import { randomUUID } from "node:crypto";
import { loadTypescript } from "./load-typescript.mjs";

// CI uses an isolated Redis service. This never connects to a deployed database.
const port = Number(process.env.CI_REDIS_PORT);
if (!port) {
  console.log("Redis integration requires CI_REDIS_PORT (CI's disposable service).");
  process.exit(0);
}
// Minimal RESP transport for the string/integer commands used by this test.
// It sends bulk data over TCP instead of passing catalog payloads as shell args.
const command = args => new Promise((resolve, reject) => {
  const socket = createConnection({ host: "127.0.0.1", port });
  let received = Buffer.alloc(0);
  const finish = (error, result) => { socket.destroy(); if (error) reject(error); else resolve(result); };
  socket.setTimeout(5000, () => finish(Error("Redis test timed out")));
  socket.on("error", reject);
  socket.on("connect", () => {
    const parts = [`*${args.length}\r\n`];
    for (const arg of args.map(String)) parts.push(`$${Buffer.byteLength(arg)}\r\n${arg}\r\n`);
    socket.write(parts.join(""));
  });
  socket.on("data", data => {
    received = Buffer.concat([received, data]);
    const end = received.indexOf("\r\n");
    if (end < 0) return;
    const type = String.fromCharCode(received[0]), value = received.subarray(1, end).toString();
    if (type === "-") return finish(Error(value));
    if (type === "+") return finish(null, value);
    if (type === ":") return finish(null, Number(value));
    if (type !== "$") return finish(Error("Unsupported Redis test response"));
    const length = Number(value);
    if (length === -1) return finish(null, null);
    if (received.length >= end + 2 + length + 2) finish(null, received.subarray(end + 2, end + 2 + length).toString());
  });
});
const { createDailyCatalog, catalogDay } = loadTypescript("src/lib/daily-catalog.ts");
const { products } = loadTypescript("src/lib/quote-selection.ts");
const namespace = `test:${randomUUID()}`;
let now = Date.parse("2026-11-22T12:00:00Z"), downloads = 0;
const deps = { command, namespace, now: () => now,
  sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  refresh: async () => {
    downloads++;
    await new Promise(resolve => setTimeout(resolve, 50));
    return { updatedAt: new Date(now).toISOString(), products, offers: {} };
  },
};
const quotes = await Promise.all(Array.from({ length: 12 }, () => createDailyCatalog(deps)()));
assert.equal(downloads, 1);
assert(quotes.every(item => item.status === "current"));
const claim = `${namespace}:attempt:${catalogDay(now)}`;
assert.equal(await command(["GET", claim]), "done");
const ttl = await command(["TTL", claim]);
assert(ttl > 172700 && ttl <= 172800);
assert.equal(await command(["TTL", `${namespace}:snapshot`]), -1);
assert.equal(await command(["GET", `${namespace}:updatedAt`]), new Date(now).toISOString());
const firstDate = quotes[0].snapshot.updatedAt;
now += 86400000;
const failures = { ...deps, refresh: async () => { downloads++; throw Error("SoloTodo offline"); } };
assert.equal((await createDailyCatalog(failures)()).status, "stale");
assert.equal((await createDailyCatalog(failures)()).snapshot.updatedAt, firstDate);
assert.equal(downloads, 2);
now += 86400000;
assert.equal((await createDailyCatalog(deps)()).status, "current");
assert.equal(downloads, 3);
// Simulate a slow older invocation finishing after a newer day's publication.
// The exact Lua script used by the application must preserve the newer snapshot.
const oldClock = now - 86400000;
await command(["DEL", `${namespace}:attempt:${catalogDay(oldClock)}`]);
const older = await createDailyCatalog({ ...deps, now: () => oldClock,
  refresh: async () => ({ updatedAt: new Date(oldClock).toISOString(), products, offers: {} }),
})();
assert.equal(older.status, "current");
assert.equal(await command(["GET", `${namespace}:updatedAt`]), new Date(now).toISOString());
assert.equal((await createDailyCatalog(deps)()).snapshot.updatedAt, new Date(now).toISOString());
console.log("Passed real Redis SET NX, atomic Lua publication, TTL, concurrent instances, failure reuse and publication ordering.");
