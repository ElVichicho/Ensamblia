import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();

export function loadTypescript(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const loaded = { exports: {} };
  cache.set(absolute, loaded);
  const source = fs.readFileSync(absolute, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  function importLocal(id) {
    if (!id.startsWith(".") && !id.startsWith("@/")) return require(id);
    const target = id.startsWith("@/") ? path.resolve("src", id.slice(2)) : path.resolve(path.dirname(absolute), id);
    if (fs.existsSync(target + ".ts")) return loadTypescript(target + ".ts");
    return require(target);
  }
  new Function("require", "module", "exports", compiled)(importLocal, loaded, loaded.exports);
  return loaded.exports;
}
