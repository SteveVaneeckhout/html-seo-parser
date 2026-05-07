import { types } from "./vocab.generated.js";
const cache = new Map();
export function ancestorTypes(name) {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  const out = new Set();
  const queue = [name];
  while (queue.length > 0) {
    const t = queue.shift();
    if (out.has(t)) continue;
    out.add(t);
    const def = types[t];
    if (def !== undefined) {
      for (const parent of def.subTypeOf) queue.push(parent);
    }
  }
  cache.set(name, out);
  return out;
}
