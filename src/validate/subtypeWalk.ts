import { types } from "./vocab.generated.js";

const cache = new Map<string, ReadonlySet<string>>();

/** The type itself plus all of its Schema.org supertypes. Results are cached. */
export function ancestorTypes(name: string): ReadonlySet<string> {
  return cache.getOrInsertComputed(name, computeAncestors);
}

function computeAncestors(name: string): ReadonlySet<string> {
  const out = new Set<string>();
  const queue = [name];
  while (queue.length > 0) {
    const t = queue.shift()!;
    if (out.has(t)) continue;
    out.add(t);
    const def = types.get(t);
    if (def !== undefined) queue.push(...def.subTypeOf);
  }
  return out;
}

/** Union of `ancestorTypes` over several type names. */
export function ancestorsOf(names: readonly string[]): ReadonlySet<string> {
  return names.reduce<ReadonlySet<string>>((acc, t) => acc.union(ancestorTypes(t)), new Set());
}
