export function extractRdfa($) {
    const items = [];
    const ctx = { vocab: null, prefixes: {}, pendingProps: null };
    $.root()
        .children()
        .each((_i, el) => {
        walk($, el, ctx, items);
    });
    return items;
}
function walk($, el, ctx, items) {
    const $el = $(el);
    const vocabAttr = $el.attr("vocab");
    const prefixAttr = $el.attr("prefix");
    const typeofAttr = $el.attr("typeof");
    const propertyAttr = $el.attr("property");
    const relAttr = $el.attr("rel");
    const nextVocab = vocabAttr !== undefined ? (vocabAttr.length > 0 ? vocabAttr : null) : ctx.vocab;
    const nextPrefixes = prefixAttr !== undefined ? mergePrefixes(ctx.prefixes, prefixAttr) : ctx.prefixes;
    let newItem = null;
    let newPendingProps = null;
    if (typeofAttr !== undefined) {
        newItem = {};
        newPendingProps = {};
        const types = splitTokens(typeofAttr).map((t) => resolveTerm(t, nextVocab, nextPrefixes));
        if (types.length === 1)
            newItem["@type"] = types[0];
        else if (types.length > 1)
            newItem["@type"] = types;
        const id = $el.attr("resource") ?? $el.attr("href") ?? $el.attr("src");
        if (id !== undefined && id.length > 0)
            newItem["@id"] = id;
        const linkProp = propertyAttr ?? relAttr;
        if (linkProp !== undefined && ctx.pendingProps !== null) {
            for (const name of splitTokens(linkProp)) {
                const resolved = resolveTerm(name, nextVocab, nextPrefixes);
                (ctx.pendingProps[resolved] ??= []).push(newItem);
            }
        }
        else {
            items.push(newItem);
        }
    }
    else if (propertyAttr !== undefined && ctx.pendingProps !== null) {
        const value = extractPropertyValue($, el);
        for (const name of splitTokens(propertyAttr)) {
            const resolved = resolveTerm(name, nextVocab, nextPrefixes);
            (ctx.pendingProps[resolved] ??= []).push(value);
        }
    }
    else if (relAttr !== undefined && ctx.pendingProps !== null) {
        const target = $el.attr("href") ?? $el.attr("resource") ?? $el.attr("src");
        if (target !== undefined && target.length > 0) {
            for (const name of splitTokens(relAttr)) {
                const resolved = resolveTerm(name, nextVocab, nextPrefixes);
                (ctx.pendingProps[resolved] ??= []).push(target);
            }
        }
    }
    const childCtx = {
        vocab: nextVocab,
        prefixes: nextPrefixes,
        pendingProps: newPendingProps ?? ctx.pendingProps,
    };
    for (const child of el.children) {
        if (isElement(child))
            walk($, child, childCtx, items);
    }
    if (newItem !== null && newPendingProps !== null) {
        for (const [name, values] of Object.entries(newPendingProps)) {
            newItem[name] = values.length === 1 ? values[0] : values;
        }
    }
}
const URL_SRC_TAGS = new Set(["img", "audio", "video", "source", "track", "iframe", "embed"]);
function extractPropertyValue($, el) {
    const $el = $(el);
    const content = $el.attr("content");
    if (content !== undefined)
        return content;
    const tag = el.tagName.toLowerCase();
    if (tag === "time") {
        const datetime = $el.attr("datetime");
        if (datetime !== undefined)
            return datetime;
    }
    if (tag === "a" || tag === "area" || tag === "link") {
        const href = $el.attr("href");
        if (href !== undefined)
            return href;
    }
    if (URL_SRC_TAGS.has(tag)) {
        const src = $el.attr("src");
        if (src !== undefined)
            return src;
    }
    if (tag === "object") {
        const data = $el.attr("data");
        if (data !== undefined)
            return data;
    }
    const resource = $el.attr("resource");
    if (resource !== undefined)
        return resource;
    return $el.text().trim();
}
function resolveTerm(term, vocab, prefixes) {
    if (/^https?:\/\//i.test(term) || term.startsWith("urn:"))
        return term;
    const colonIdx = term.indexOf(":");
    if (colonIdx > 0) {
        const prefix = term.slice(0, colonIdx);
        const local = term.slice(colonIdx + 1);
        const expansion = prefixes[prefix];
        if (expansion !== undefined)
            return expansion + local;
        return term;
    }
    if (vocab !== null)
        return vocab + term;
    return term;
}
function mergePrefixes(base, prefixAttr) {
    const merged = { ...base };
    const tokens = prefixAttr.trim().split(/\s+/);
    for (let i = 0; i + 1 < tokens.length; i += 2) {
        const key = tokens[i];
        const value = tokens[i + 1];
        if (key.endsWith(":")) {
            merged[key.slice(0, -1)] = value;
        }
    }
    return merged;
}
function splitTokens(value) {
    return value
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0);
}
function isElement(node) {
    return (typeof node === "object" &&
        node !== null &&
        "type" in node &&
        node.type === "tag");
}
