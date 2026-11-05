import { types } from "./vocab.generated.js";
const cache = new Map();
/** The type itself plus all of its Schema.org supertypes. Results are cached. */
export function ancestorTypes(name) {
    return cache.getOrInsertComputed(name, computeAncestors);
}
function computeAncestors(name) {
    const out = new Set();
    const queue = [name];
    while (queue.length > 0) {
        const t = queue.shift();
        if (out.has(t))
            continue;
        out.add(t);
        const def = types.get(t);
        if (def !== undefined)
            queue.push(...def.subTypeOf);
    }
    return out;
}
/** Union of `ancestorTypes` over several type names. */
export function ancestorsOf(names) {
    return names.reduce((acc, t) => acc.union(ancestorTypes(t)), new Set());
}
